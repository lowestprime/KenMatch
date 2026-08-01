import assert from "node:assert/strict";
import test from "node:test";

import {
  coverageCaptureKeys,
  coveragePlanBinding,
  stampCoveragePlan,
} from "./plan-identity.js";
import type { CoveragePlan, RouteTarget } from "./types.js";

function target(key: string, source: RouteTarget["source"] = "source", viewports = ["desktop-1440"]): RouteTarget {
  return {
    key,
    route: `/${key}`,
    auth: "anonymous",
    coverageTier: source === "rendered" ? "discovered" : "canonical",
    state: "default",
    source,
    themes: ["oled"],
    viewports,
  };
}

function plan(input: {
  runId: string;
  generatedAt: string;
  phase: CoveragePlan["phase"];
  seedCaptureCount: number;
  convergenceIteration: number;
  targets: RouteTarget[];
  renderedRoutes?: string[];
}) {
  const expectedCaptureCount = input.targets.reduce(
    (total, item) => total + item.themes.length * item.viewports.length,
    0,
  );
  return stampCoveragePlan({
    schemaVersion: 2,
    runId: input.runId,
    generatedAt: input.generatedAt,
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
    seedCaptureCount: input.seedCaptureCount,
    convergenceIteration: input.convergenceIteration,
    sourceRoutes: ["/"],
    databaseRoutes: [],
    renderedRoutes: input.renderedRoutes ?? [],
    assetRoutes: [],
    unresolvedDynamicPatterns: [],
    routeDispositions: [],
    samplingRationale: "Deterministic formal convergence fixture.",
    requiredStates: ["oled-theme"],
    targets: input.targets,
    expectedCaptureCount,
  });
}

test("the formal 1,215 seed plus 23 rendered targets converges deterministically to 1,261 keys", () => {
  const seedTargets = Array.from({ length: 1_215 }, (_, index) => target(`seed-${String(index).padStart(4, "0")}`));
  const renderedTargets = Array.from(
    { length: 23 },
    (_, index) => target(`rendered-${String(index).padStart(2, "0")}`, "rendered", ["desktop-1440", "mobile-390"]),
  );
  const seed = plan({
    runId: "formal-seed",
    generatedAt: "2026-08-01T00:00:00.000Z",
    phase: "initial",
    seedCaptureCount: 1_215,
    convergenceIteration: 0,
    targets: seedTargets,
  });
  const renderedRoutes = renderedTargets.map((item) => item.route);
  const first = plan({
    runId: "formal-final-one",
    generatedAt: "2026-08-01T01:00:00.000Z",
    phase: "converged",
    seedCaptureCount: seed.expectedCaptureCount,
    convergenceIteration: 2,
    targets: [...seedTargets, ...renderedTargets],
    renderedRoutes,
  });
  const repeated = plan({
    runId: "formal-final-two",
    generatedAt: "2026-08-02T01:00:00.000Z",
    phase: "converged",
    seedCaptureCount: seed.expectedCaptureCount,
    convergenceIteration: 2,
    targets: [...renderedTargets].reverse().concat([...seedTargets].reverse()),
    renderedRoutes: [...renderedRoutes].reverse(),
  });

  assert.equal(seed.expectedCaptureCount, 1_215);
  assert.equal(first.expectedCaptureCount, 1_261);
  assert.equal(first.expectedCaptureCount - seed.expectedCaptureCount, 46);
  assert.deepEqual(coverageCaptureKeys(first), coverageCaptureKeys(repeated));
  assert.equal(first.targetKeysDigest, repeated.targetKeysDigest);
  assert.equal(first.planDigest, repeated.planDigest);
  assert.deepEqual(coveragePlanBinding(first), {
    phase: "converged",
    seedCaptureCount: 1_215,
    expectedCaptureCount: 1_261,
    convergenceIterations: 2,
    planDigest: first.planDigest,
    targetKeysDigest: first.targetKeysDigest,
  });
});

test("capture-key duplication is rejected before persistence", () => {
  assert.throws(() => plan({
    runId: "duplicate",
    generatedAt: "2026-08-01T00:00:00.000Z",
    phase: "initial",
    seedCaptureCount: 2,
    convergenceIteration: 0,
    targets: [target("same"), target("same")],
  }), /duplicate route target keys/);
});
