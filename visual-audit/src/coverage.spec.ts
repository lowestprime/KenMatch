import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";

import {
  viewportMatrixDigest,
  VIEWPORTS,
  type AuditConfig,
} from "./config.js";
import { buildCoveragePlan } from "./coverage.js";
import { coverageCaptureKeys } from "./plan-identity.js";
import type { ProtectedInventory } from "./types.js";

const inventory = {
  schemaVersion: 1,
  complete: true,
  generatedAt: "2026-07-29T12:00:00.000Z",
  lastModified: null,
  build: {
    sha: "a".repeat(40),
    tier: "tier-1-synthetic",
    dataProvenance: "synthetic-fixture",
    labMode: true,
  },
  counts: { kens: 1, profiles: 1, categories: 1, discussions: 1, assets: 1 },
  routes: {
    static: ["/"],
    kens: ["/kens/example"],
    profiles: ["/people/person"],
    discussions: ["/discuss/thread"],
  },
  taxonomy: { categories: ["safety"], lanes: ["days", "weeks", "months", "queued", "blocked"] },
  states: {
    taskStages: ["running"],
    safetyStates: ["reviewed"],
    hasComments: true,
    hasUploadedIllustration: false,
    hasFallbackIllustration: true,
  },
  kens: [{
    slug: "example",
    stage: "running",
    safetyStatus: "reviewed",
    requestedLane: "months",
    categorySlug: "safety",
    illustrationUrl: null,
    illustrationSource: null,
    hasComments: true,
  }],
  discussions: [{ slug: "thread", topic: "Thread" }],
  assets: [{ url: "/icon.svg", bytes: 128, sha256: "b".repeat(64) }],
} satisfies ProtectedInventory;

const baseConfig = {
  targetMode: "snapshot-lab",
  scope: "full",
  evidenceTier: "tier-1-synthetic",
  dataProvenance: "synthetic-fixture",
  baseUrl: "http://127.0.0.1:3100",
  expectedCommit: "a".repeat(40),
  viewportMatrixDigest: viewportMatrixDigest(),
  acceleratorRecord: "chromium-headless-software",
  runId: "coverage-test",
  repoRoot: path.resolve(process.cwd(), ".."),
} as AuditConfig;

test("full coverage gives canonical routes the exact Light/OLED viewport matrix", () => {
  const plan = buildCoveragePlan({
    config: baseConfig,
    inventory,
    inventoryDigest: "c".repeat(64),
    browserVersion: "test-chromium",
    renderedRoutes: ["/faq?source=rendered"],
  });
  const expectedViewports = VIEWPORTS.map((viewport) => viewport.name).sort();
  const canonical = plan.targets.filter((target) => (
    target.coverageTier === "canonical" && target.state === "default"
  ));
  assert.ok(canonical.length > 0);
  for (const target of canonical) {
    assert.deepEqual([...target.themes].sort(), ["light", "oled"]);
    assert.deepEqual([...target.viewports].sort(), expectedViewports);
  }
  assert.deepEqual(plan.unresolvedDynamicPatterns, []);
  assert.ok(plan.requiredStates.includes("ken-stage:running"));
  for (const lane of inventory.taxonomy.lanes) {
    assert.ok(plan.requiredStates.includes(`lane-state:${lane}`));
  }
  assert.deepEqual(plan.routeDispositions, [{
    route: "/faq?source=rendered",
    disposition: "captured",
    representativeRoute: "/faq?source=rendered",
    reason: "Exact source, database, required, or rendered-link target.",
  }]);
});

test("smoke coverage records explicit equivalence for unsampled rendered links", () => {
  const renderedRoutes = Array.from({ length: 6 }, (_, index) => `/faq?sample=${index}`);
  const plan = buildCoveragePlan({
    config: { ...baseConfig, scope: "smoke" },
    inventory,
    inventoryDigest: "c".repeat(64),
    browserVersion: "test-chromium",
    renderedRoutes,
  });
  assert.equal(plan.routeDispositions.length, renderedRoutes.length);
  assert.equal(plan.routeDispositions.filter((entry) => entry.disposition === "captured").length, 4);
  assert.equal(plan.routeDispositions.filter((entry) => entry.disposition === "equivalent").length, 2);
  for (const entry of plan.routeDispositions) {
    assert.ok(plan.targets.some((target) => target.route === entry.representativeRoute));
    assert.ok(entry.reason.length > 20);
  }
});

test("smoke rendered-link samples remain monotonic while discovery expands", () => {
  const initial = buildCoveragePlan({
    config: { ...baseConfig, scope: "smoke" },
    inventory,
    inventoryDigest: "c".repeat(64),
    browserVersion: "test-chromium",
    renderedRoutes: ["/faq?z=1", "/faq?z=2", "/faq?z=3", "/faq?z=4"],
  });
  const retained = initial.targets
    .filter((target) => target.source === "rendered")
    .map((target) => target.route);
  const expanded = buildCoveragePlan({
    config: { ...baseConfig, scope: "smoke" },
    inventory,
    inventoryDigest: "c".repeat(64),
    browserVersion: "test-chromium",
    renderedRoutes: ["/economics?new=1", ...retained],
    retainedRenderedCaptureRoutes: retained,
  });
  assert.deepEqual(
    expanded.targets
      .filter((target) => target.source === "rendered")
      .map((target) => target.route)
      .sort(),
    [...retained].sort(),
  );
});

test("rendered-link ordering and duplicates do not change final target identity", () => {
  const routes = ["/faq?b=2", "/faq?a=1", "/economics?c=3"];
  const first = buildCoveragePlan({
    config: baseConfig,
    inventory,
    inventoryDigest: "c".repeat(64),
    browserVersion: "test-chromium",
    renderedRoutes: routes,
    phase: "converged",
    seedCaptureCount: 1,
    convergenceIteration: 2,
  });
  const second = buildCoveragePlan({
    config: { ...baseConfig, runId: "coverage-test-repeated" },
    inventory,
    inventoryDigest: "c".repeat(64),
    browserVersion: "test-chromium",
    renderedRoutes: [routes[2]!, routes[0]!, routes[1]!, routes[0]!, routes[2]!],
    phase: "converged",
    seedCaptureCount: 1,
    convergenceIteration: 2,
  });
  assert.deepEqual(coverageCaptureKeys(first), coverageCaptureKeys(second));
  assert.equal(first.expectedCaptureCount, second.expectedCaptureCount);
  assert.equal(first.targetKeysDigest, second.targetKeysDigest);
  assert.equal(first.planDigest, second.planDigest);
});
