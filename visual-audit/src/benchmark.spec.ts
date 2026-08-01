import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  evaluateBenchmark,
  type BenchmarkInput,
  type BenchmarkObservation,
} from "./benchmark.js";
import {
  coverageCaptureKeys,
  coveragePlanBinding,
  stampCoveragePlan,
} from "./plan-identity.js";
import type { CaptureRecord, CoveragePlan, RouteTarget, RunManifest } from "./types.js";
import { writeJsonAtomic } from "./util.js";

const expectedCommit = "a".repeat(40);
const acceleratorRecord = "chromium-headless-software";

function target(): RouteTarget {
  return {
    key: "home",
    route: "/",
    auth: "anonymous",
    coverageTier: "canonical",
    state: "default",
    source: "source",
    themes: ["oled"],
    viewports: ["desktop-1440"],
  };
}

function plan(runId: string): CoveragePlan {
  return stampCoveragePlan({
    schemaVersion: 2,
    runId,
    generatedAt: "2026-08-01T00:00:00.000Z",
    mode: "snapshot-lab",
    scope: "smoke",
    evidenceTier: "tier-1-synthetic",
    dataProvenance: "synthetic-fixture",
    expectedCommit,
    viewportMatrixDigest: "b".repeat(64),
    acceleratorRecord,
    browserVersion: "test-chromium",
    inventoryDigest: "c".repeat(64),
    phase: "converged",
    seedCaptureCount: 1,
    convergenceIteration: 1,
    sourceRoutes: ["/"],
    databaseRoutes: [],
    renderedRoutes: [],
    assetRoutes: [],
    unresolvedDynamicPatterns: [],
    routeDispositions: [],
    samplingRationale: "Benchmark fixture.",
    requiredStates: ["oled-theme"],
    targets: [target()],
    expectedCaptureCount: 1,
  });
}

function capture(key: string, digest = "content"): CaptureRecord {
  return {
    key,
    createdAt: "2026-08-01T00:00:01.000Z",
    route: "/",
    finalUrl: "http://kenmatch-audit-app:3000/",
    status: 200,
    auth: "anonymous",
    theme: "oled",
    viewport: "desktop-1440",
    state: "default",
    coverageTier: "canonical",
    sensitive: false,
    stitchedFile: `captures/${key}.png`,
    tileManifestFile: `tiles/${key}.json`,
    width: 1440,
    height: 1200,
    deviceScaleFactor: 1,
    pageHeight: 1200,
    contentDigest: digest,
    accessibility: {
      skipLinkPresent: true,
      skipLinkTargetValid: true,
      skipLinkActivationValid: true,
      keyboardReachable: true,
      keyboardTrapDetected: false,
      focusVisible: true,
      horizontalOverflowPx: 0,
      undersizedTouchTargets: 0,
      reducedMotionStable: true,
      forcedColorsUsable: true,
      headingOrderValid: true,
      unlabeledControls: 0,
      seriousViolations: [],
    },
    discoveredLinks: ["/kens"],
    assetUrls: ["/brand/kenmatch-mark.svg"],
  };
}

function manifest(runPlan: CoveragePlan, workers: number, digest = "content"): RunManifest {
  const key = coverageCaptureKeys(runPlan)[0]!;
  return {
    schemaVersion: 2,
    runId: runPlan.runId,
    startedAt: "2026-08-01T00:00:00.000Z",
    completedAt: "2026-08-01T00:00:02.000Z",
    mode: runPlan.mode,
    scope: runPlan.scope,
    evidenceTier: runPlan.evidenceTier,
    dataProvenance: runPlan.dataProvenance,
    baseUrl: "http://kenmatch-audit-app:3000",
    expectedCommit,
    deployedCommit: expectedCommit,
    viewportMatrixDigest: runPlan.viewportMatrixDigest,
    acceleratorRecord,
    captureWorkers: workers,
    browserName: "chromium",
    browserVersion: runPlan.browserVersion,
    playwrightVersion: "1.61.0",
    inventoryDigest: runPlan.inventoryDigest,
    coveragePlan: coveragePlanBinding(runPlan),
    captures: [capture(key, digest)],
    completedKeys: [key],
    diagnostics: [],
    renderedLinks: ["/kens"],
    security: {
      loginMutations: 4,
      blockedUnsafeRequests: 1,
      successfulUnsafeRequests: 0,
      blockedCrossOriginRequests: 0,
      allowedCrossOriginRequests: 0,
      telemetrySuppressed: true,
      inventoryRequests: 1,
    },
    sourceEvidence: {
      databaseSha256Before: "d".repeat(64),
      databaseSha256After: "d".repeat(64),
      dataTreeSha256Before: "e".repeat(64),
      dataTreeSha256After: "e".repeat(64),
      sourceUnchanged: true,
      cleanupComplete: true,
    },
  };
}

function fixture(
  root: string,
  workers: number,
  durationMs: number,
  digest = "content",
): BenchmarkObservation {
  const runId = `benchmark-w${workers}`;
  const runPlan = plan(runId);
  const runRoot = path.join(root, runId);
  const manifestFile = path.join(runRoot, "manifest.json");
  const planFile = path.join(runRoot, "coverage-plan.json");
  const runManifest = manifest(runPlan, workers, digest);
  writeJsonAtomic(manifestFile, runManifest);
  writeJsonAtomic(planFile, runPlan);
  for (const record of runManifest.captures) {
    const imageFile = path.join(runRoot, record.stitchedFile);
    fs.mkdirSync(path.dirname(imageFile), { recursive: true });
    fs.writeFileSync(imageFile, "deterministic-image");
  }
  return { workers, durationMs, runId, manifestFile, planFile };
}

function input(observations: BenchmarkObservation[]): BenchmarkInput {
  return {
    schemaVersion: 1,
    benchmarkId: "benchmark-one",
    expectedCommit,
    acceleratorRecord,
    requiredWorkerCounts: [1, 2, 4],
    observations,
  };
}

test("equivalent worker archives select the fastest passing count", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "kenmatch-benchmark-"));
  try {
    const result = evaluateBenchmark(input([
      fixture(root, 1, 100),
      fixture(root, 2, 60),
      fixture(root, 4, 80),
    ]));
    assert.equal(result.passed, true);
    assert.equal(result.selectedWorkers, 2);
    assert.deepEqual(result.observations.map((item) => item.speedupVersusOne), [1, 1.6667, 1.25]);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("worker output drift prevents selection", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "kenmatch-benchmark-"));
  try {
    const result = evaluateBenchmark(input([
      fixture(root, 1, 100),
      fixture(root, 2, 60),
      fixture(root, 4, 40, "changed-content"),
    ]));
    assert.equal(result.passed, false);
    assert.equal(result.selectedWorkers, null);
    assert.match(result.errors.join("\n"), /captureEquivalenceDigest differs/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("missing worker observations are rejected", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "kenmatch-benchmark-"));
  try {
    const result = evaluateBenchmark(input([
      fixture(root, 1, 100),
      fixture(root, 2, 60),
    ]));
    assert.equal(result.passed, false);
    assert.equal(result.selectedWorkers, null);
    assert.match(result.errors.join("\n"), /required worker counts/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
