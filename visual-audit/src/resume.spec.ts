import assert from "node:assert/strict";
import test from "node:test";

import type { AuditConfig } from "./config.js";
import {
  coverageCaptureKeys,
  coveragePlanBinding,
  stampCoveragePlan,
} from "./plan-identity.js";
import { assertResumeCompatible } from "./run.js";
import type { CaptureRecord, CoveragePlan, RouteTarget, RunManifest } from "./types.js";

const config = {
  runId: "run-one",
  targetMode: "snapshot-lab",
  scope: "smoke",
  evidenceTier: "tier-1-synthetic",
  dataProvenance: "synthetic-fixture",
  baseUrl: "http://127.0.0.1:3100",
  expectedCommit: "abcdef1",
  viewportMatrixDigest: "viewport-matrix",
  acceleratorRecord: "chromium-headless-software",
} as AuditConfig;

function routeTarget(key: string): RouteTarget {
  return {
    key,
    route: `/${key}`,
    auth: "anonymous",
    coverageTier: "canonical",
    state: "default",
    source: "source",
    themes: ["oled"],
    viewports: ["desktop-1440"],
  };
}

function makePlan(runId = config.runId, targets = [routeTarget("home")]): CoveragePlan {
  return stampCoveragePlan({
    schemaVersion: 2,
    runId,
    generatedAt: "2026-08-01T00:00:00.000Z",
    mode: config.targetMode,
    scope: config.scope,
    evidenceTier: config.evidenceTier,
    dataProvenance: config.dataProvenance,
    expectedCommit: config.expectedCommit,
    viewportMatrixDigest: config.viewportMatrixDigest,
    acceleratorRecord: config.acceleratorRecord,
    browserVersion: "1.2.3",
    inventoryDigest: "inventory",
    phase: "converged",
    seedCaptureCount: 1,
    convergenceIteration: 1,
    sourceRoutes: ["/"],
    databaseRoutes: [],
    renderedRoutes: targets.filter((target) => target.source === "rendered").map((target) => target.route),
    assetRoutes: [],
    unresolvedDynamicPatterns: [],
    routeDispositions: [],
    samplingRationale: "Resume identity fixture.",
    requiredStates: ["oled-theme"],
    targets,
    expectedCaptureCount: targets.length,
  });
}

function makeManifest(plan: CoveragePlan): RunManifest {
  return {
    schemaVersion: 2,
    runId: plan.runId,
    startedAt: "2026-08-01T00:00:00.000Z",
    completedAt: null,
    mode: config.targetMode,
    scope: config.scope,
    evidenceTier: config.evidenceTier,
    dataProvenance: config.dataProvenance,
    baseUrl: config.baseUrl,
    expectedCommit: config.expectedCommit,
    deployedCommit: config.expectedCommit,
    viewportMatrixDigest: config.viewportMatrixDigest,
    acceleratorRecord: config.acceleratorRecord,
    browserName: "chromium",
    browserVersion: "1.2.3",
    playwrightVersion: "1.61.0",
    inventoryDigest: "inventory",
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

const plan = makePlan();
const manifest = makeManifest(plan);

function restampPlan(source: CoveragePlan, patch: Partial<Omit<CoveragePlan, "planDigest" | "targetKeysDigest">>) {
  return stampCoveragePlan({ ...source, ...patch });
}

test("resume accepts identical immutable provenance and converged plan identity", () => {
  assert.doesNotThrow(() => assertResumeCompatible({
    config,
    manifest,
    plan,
    inventoryDigest: "inventory",
    browserVersion: "1.2.3",
  }));
});

test("resume continues an exact converging checkpoint but rejects captures under an initial plan", () => {
  const converging = restampPlan(plan, { phase: "converging", convergenceIteration: 1 });
  const captureKey = coverageCaptureKeys(converging)[0]!;
  const convergingManifest = makeManifest(converging);
  convergingManifest.captures = [{ key: captureKey } as CaptureRecord];
  convergingManifest.completedKeys = [captureKey];
  assert.doesNotThrow(() => assertResumeCompatible({
    config,
    manifest: convergingManifest,
    plan: converging,
    inventoryDigest: "inventory",
    browserVersion: "1.2.3",
  }));

  const initial = restampPlan(plan, { phase: "initial", convergenceIteration: 0 });
  const initialManifest = makeManifest(initial);
  initialManifest.captures = [{ key: captureKey } as CaptureRecord];
  initialManifest.completedKeys = [captureKey];
  assert.throws(() => assertResumeCompatible({
    config,
    manifest: initialManifest,
    plan: initial,
    inventoryDigest: "inventory",
    browserVersion: "1.2.3",
  }), /initial phase captures/);
});

test("resume rejects build or inventory drift", () => {
  assert.throws(() => assertResumeCompatible({
    config,
    manifest,
    plan,
    inventoryDigest: "changed",
    browserVersion: "1.2.3",
  }), /immutable run identity changed/);
});

test("resume rejects viewport, provenance, or accelerator drift", () => {
  assert.throws(() => assertResumeCompatible({
    config: { ...config, acceleratorRecord: "gpu-different" },
    manifest,
    plan,
    inventoryDigest: "inventory",
    browserVersion: "1.2.3",
  }), /accelerator record/);
  assert.throws(() => assertResumeCompatible({
    config: { ...config, viewportMatrixDigest: "changed-viewports" },
    manifest,
    plan,
    inventoryDigest: "inventory",
    browserVersion: "1.2.3",
  }), /viewport matrix/);
  assert.throws(() => assertResumeCompatible({
    config: {
      ...config,
      evidenceTier: "tier-2-production-clone",
      dataProvenance: "production-clone",
    },
    manifest,
    plan,
    inventoryDigest: "inventory",
    browserVersion: "1.2.3",
  }), /evidence tier|data provenance/);
});

test("a changed rendered target set is rejected for resume but valid under a new run identity", () => {
  const rendered = { ...routeTarget("rendered-new"), source: "rendered" as const, coverageTier: "discovered" as const };
  const changedPlan = makePlan(config.runId, [routeTarget("home"), rendered]);
  assert.throws(() => assertResumeCompatible({
    config,
    manifest,
    plan: changedPlan,
    inventoryDigest: "inventory",
    browserVersion: "1.2.3",
  }), /manifest coverage-plan binding/);

  const newConfig = { ...config, runId: "run-two" };
  const newPlan = makePlan(newConfig.runId, [routeTarget("home"), rendered]);
  const newManifest = makeManifest(newPlan);
  assert.doesNotThrow(() => assertResumeCompatible({
    config: newConfig,
    manifest: newManifest,
    plan: newPlan,
    inventoryDigest: "inventory",
    browserVersion: "1.2.3",
  }));
});
