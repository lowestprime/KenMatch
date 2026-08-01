import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  assertCoveragePlanIdentity,
  coverageCaptureKeys,
  coveragePlanBinding,
  stampCoveragePlan,
} from "./plan-identity.js";
import {
  persistCoveragePlanState,
  recoverCoveragePlanState,
} from "./plan-state.js";
import type { CoveragePlan, RouteTarget, RunManifest } from "./types.js";
import { readJson, writeJsonAtomic } from "./util.js";

function routeTarget(key: string, source: RouteTarget["source"] = "source"): RouteTarget {
  return {
    key,
    route: `/${key}`,
    auth: "anonymous",
    coverageTier: source === "rendered" ? "discovered" : "canonical",
    state: "default",
    source,
    themes: ["oled"],
    viewports: ["desktop-1440"],
  };
}

function makePlan(input: {
  phase: CoveragePlan["phase"];
  iteration: number;
  targets: RouteTarget[];
}) {
  return stampCoveragePlan({
    schemaVersion: 2,
    runId: "interrupted-run",
    generatedAt: "2026-08-01T00:00:00.000Z",
    mode: "snapshot-lab",
    scope: "full",
    evidenceTier: "tier-1-synthetic",
    dataProvenance: "synthetic-fixture",
    expectedCommit: "a".repeat(40),
    viewportMatrixDigest: "b".repeat(64),
    acceleratorRecord: "chromium-headless-software",
    browserVersion: "test-chromium",
    inventoryDigest: "c".repeat(64),
    phase: input.phase,
    seedCaptureCount: 1,
    convergenceIteration: input.iteration,
    sourceRoutes: ["/"],
    databaseRoutes: [],
    renderedRoutes: input.targets.filter((target) => target.source === "rendered").map((target) => target.route),
    assetRoutes: [],
    unresolvedDynamicPatterns: [],
    routeDispositions: [],
    samplingRationale: "Interrupted transition fixture.",
    requiredStates: ["oled-theme"],
    targets: input.targets,
    expectedCaptureCount: input.targets.length,
  });
}

function makeManifest(plan: CoveragePlan): RunManifest {
  return {
    schemaVersion: 2,
    runId: plan.runId,
    startedAt: plan.generatedAt,
    completedAt: null,
    mode: plan.mode,
    scope: plan.scope,
    evidenceTier: plan.evidenceTier,
    dataProvenance: plan.dataProvenance,
    baseUrl: "http://127.0.0.1:3100",
    expectedCommit: plan.expectedCommit,
    deployedCommit: plan.expectedCommit,
    viewportMatrixDigest: plan.viewportMatrixDigest,
    acceleratorRecord: plan.acceleratorRecord,
    browserName: "chromium",
    browserVersion: plan.browserVersion,
    playwrightVersion: "1.61.0",
    inventoryDigest: plan.inventoryDigest,
    coveragePlan: coveragePlanBinding(plan),
    captures: [],
    completedKeys: [],
    diagnostics: [],
    renderedLinks: [],
    security: {
      loginMutations: 0,
      blockedUnsafeRequests: 0,
      successfulUnsafeRequests: 0,
      blockedCrossOriginRequests: 0,
      allowedCrossOriginRequests: 0,
      telemetrySuppressed: true,
      inventoryRequests: 1,
    },
    sourceEvidence: {
      databaseSha256Before: null,
      databaseSha256After: null,
      dataTreeSha256Before: null,
      dataTreeSha256After: null,
      sourceUnchanged: false,
      cleanupComplete: false,
    },
  };
}

test("an interrupted coverage transition recovers one exact plan and manifest binding", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "kenmatch-plan-state-"));
  const planFile = path.join(root, "coverage-plan.json");
  const manifestFile = path.join(root, "manifest.json");
  const journalFile = path.join(root, ".coverage-transition.json");
  try {
    const initial = makePlan({ phase: "initial", iteration: 0, targets: [routeTarget("home")] });
    let currentManifest = persistCoveragePlanState({
      planFile,
      manifestFile,
      journalFile,
      plan: initial,
      manifest: makeManifest(initial),
    });
    assert.equal(fs.existsSync(journalFile), false);

    const firstPass = makePlan({ phase: "converging", iteration: 1, targets: [routeTarget("home")] });
    currentManifest = persistCoveragePlanState({
      planFile,
      manifestFile,
      journalFile,
      plan: firstPass,
      manifest: currentManifest,
    });
    const expanded = makePlan({
      phase: "converging",
      iteration: 2,
      targets: [routeTarget("home"), routeTarget("rendered", "rendered")],
    });
    currentManifest = persistCoveragePlanState({
      planFile,
      manifestFile,
      journalFile,
      plan: expanded,
      manifest: currentManifest,
    });
    const next = makePlan({
      phase: "converged",
      iteration: 2,
      targets: expanded.targets,
    });
    const nextManifest = { ...currentManifest, coveragePlan: coveragePlanBinding(next) };
    writeJsonAtomic(journalFile, {
      schemaVersion: 1,
      runId: next.runId,
      plan: next,
      manifest: nextManifest,
    });

    let validated = false;
    assert.equal(recoverCoveragePlanState({
      planFile,
      manifestFile,
      journalFile,
      validate: (manifest, plan) => {
        validated = true;
        assertCoveragePlanIdentity(plan);
        assert.deepEqual(manifest.coveragePlan, coveragePlanBinding(plan));
      },
    }), true);
    assert.equal(validated, true);
    assert.equal(fs.existsSync(journalFile), false);
    assert.deepEqual(coverageCaptureKeys(readJson<CoveragePlan>(planFile)), coverageCaptureKeys(next));
    assert.deepEqual(readJson<RunManifest>(manifestFile).coveragePlan, coveragePlanBinding(next));
    assert.equal(fs.readdirSync(root).some((entry) => entry.endsWith(".tmp")), false);

    const changed = makePlan({
      phase: "converged",
      iteration: 2,
      targets: [...next.targets, routeTarget("late-rendered", "rendered")],
    });
    assert.throws(() => persistCoveragePlanState({
      planFile,
      manifestFile,
      journalFile,
      plan: changed,
      manifest: readJson<RunManifest>(manifestFile),
    }), /converged coverage plan cannot be replaced/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
