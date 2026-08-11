import assert from "node:assert/strict";
import test from "node:test";

import {
  evaluateCoverageConvergence,
  MAX_RENDERED_LINK_CONVERGENCE_ITERATIONS,
} from "./convergence.js";
import { coverageCaptureKeys, stampCoveragePlan } from "./plan-identity.js";
import type { CoveragePlan, RouteTarget } from "./types.js";

function target(key: string): RouteTarget {
  return {
    key,
    route: `/${key}`,
    auth: "anonymous",
    coverageTier: key.startsWith("rendered") ? "discovered" : "canonical",
    state: "default",
    source: key.startsWith("rendered") ? "rendered" : "source",
    themes: ["oled"],
    viewports: ["desktop-1440"],
  };
}

function plan(iteration: number, targets: RouteTarget[]): CoveragePlan {
  return stampCoveragePlan({
    schemaVersion: 2,
    runId: "convergence-test",
    generatedAt: "2026-08-11T00:00:00.000Z",
    mode: "snapshot-lab",
    scope: "full",
    evidenceTier: "tier-1-synthetic",
    dataProvenance: "synthetic-fixture",
    expectedCommit: "a".repeat(40),
    viewportMatrixDigest: "b".repeat(64),
    acceleratorRecord: "chromium-headless-software",
    browserVersion: "test-chromium",
    inventoryDigest: "c".repeat(64),
    phase: "converging",
    seedCaptureCount: 1,
    convergenceIteration: iteration,
    sourceRoutes: ["/"],
    databaseRoutes: [],
    renderedRoutes: targets.filter((item) => item.source === "rendered").map((item) => item.route),
    assetRoutes: [],
    unresolvedDynamicPatterns: [],
    routeDispositions: [],
    samplingRationale: "Bounded convergence fixture.",
    requiredStates: ["oled-theme"],
    targets,
    expectedCaptureCount: targets.length,
  });
}

test("a strictly expanding fifth discovery layer remains within the bounded convergence budget", () => {
  const current = plan(4, [target("seed"), target("rendered-one")]);
  const reconciled = plan(5, [...current.targets, target("rendered-two")]);
  const result = evaluateCoverageConvergence({
    currentPlan: current,
    reconciledPlan: reconciled,
    capturedKeys: new Set(coverageCaptureKeys(current)),
  });
  assert.equal(result.addedKeys.length, 1);
  assert.deepEqual(result.missingKeys, result.addedKeys);
});

test("runaway rendered-link exploration terminates at the explicit route-depth bound", () => {
  const current = plan(MAX_RENDERED_LINK_CONVERGENCE_ITERATIONS, [target("seed")]);
  const reconciled = plan(MAX_RENDERED_LINK_CONVERGENCE_ITERATIONS + 1, [
    ...current.targets,
    target("rendered-late"),
  ]);
  assert.throws(() => evaluateCoverageConvergence({
    currentPlan: current,
    reconciledPlan: reconciled,
    capturedKeys: new Set(coverageCaptureKeys(current)),
  }), /bounded 8-iteration route-depth limit/);
});

test("convergence rejects target replacement and missing captures without expansion", () => {
  const current = plan(2, [target("seed"), target("rendered-one")]);
  const replaced = plan(3, [target("seed"), target("rendered-two")]);
  assert.throws(() => evaluateCoverageConvergence({
    currentPlan: current,
    reconciledPlan: replaced,
    capturedKeys: new Set(coverageCaptureKeys(current)),
  }), /attempted to replace/);

  assert.throws(() => evaluateCoverageConvergence({
    currentPlan: current,
    reconciledPlan: current,
    capturedKeys: new Set(),
  }), /without expanding the persisted target set/);
});
