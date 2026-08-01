import assert from "node:assert/strict";
import test from "node:test";

import {
  expandSourceRoutes,
  validateInventoryShape,
} from "./inventory.js";
import type { ProtectedInventory } from "./types.js";

const inventory = {
  routes: {
    static: [],
    kens: ["/kens/example"],
    profiles: ["/people/person"],
    discussions: ["/discuss/thread"],
  },
} as unknown as ProtectedInventory;

test("dynamic source routes expand only from protected public inventory", () => {
  const result = expandSourceRoutes({
    staticRoutes: ["/", "/kens"],
    dynamicPatterns: ["/kens/[slug]", "/people/[slug]", "/discuss/[slug]", "/tasks/[slug]"],
  }, inventory);
  assert.deepEqual(result.unresolved, []);
  assert.ok(result.routes.includes("/kens/example"));
  assert.ok(result.routes.includes("/people/person"));
  assert.ok(result.routes.includes("/discuss/thread"));
  assert.ok(result.routes.includes("/tasks/example"));
});

const completeInventory = {
  schemaVersion: 1,
  complete: true,
  generatedAt: "2026-07-29T12:00:00.000Z",
  lastModified: "2026-07-29T11:00:00.000Z",
  build: {
    sha: "a".repeat(40),
    tier: "tier-1-synthetic",
    dataProvenance: "synthetic-fixture",
    labMode: true,
  },
  counts: {
    kens: 1,
    profiles: 1,
    categories: 1,
    discussions: 1,
    assets: 1,
  },
  routes: {
    static: ["/"],
    kens: ["/kens/example"],
    profiles: ["/people/person"],
    discussions: ["/discuss/thread"],
  },
  taxonomy: {
    categories: ["safety"],
    lanes: ["months"],
  },
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
};

test("protected inventory rejects truncation and count or route drift", () => {
  assert.doesNotThrow(() => validateInventoryShape(structuredClone(completeInventory)));
  assert.throws(
    () => validateInventoryShape({ ...structuredClone(completeInventory), complete: false }),
    /incomplete/,
  );
  const countDrift = structuredClone(completeInventory);
  countDrift.counts.kens = 2;
  assert.throws(() => validateInventoryShape(countDrift), /counts do not match/);
  const routeDrift = structuredClone(completeInventory);
  routeDrift.routes.kens = ["/kens/different"];
  assert.throws(() => validateInventoryShape(routeDrift), /routes or taxonomy/);
});
