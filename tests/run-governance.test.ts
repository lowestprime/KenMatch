import assert from "node:assert/strict";
import test from "node:test";

import {
  CAPACITY_POLICIES,
  DEFAULT_CAPACITY_OVERRIDE,
  RUN_DECISION_DEFINITIONS,
  deriveAutomaticCapacityState,
  isRunDecisionCompatible,
  resolveCapacityState,
  runDecisionTransition,
} from "../src/lib/run-governance.ts";
import { capacityStates, stopDecisionCodes } from "../src/lib/types.ts";

test("capacity thresholds cover all four public operating states", () => {
  assert.equal(deriveAutomaticCapacityState(6, 6, 10_000), "normal");
  assert.equal(deriveAutomaticCapacityState(3, 6, 10_000), "constrained");
  assert.equal(deriveAutomaticCapacityState(1, 6, 10_000), "new-launches-paused");
  assert.equal(deriveAutomaticCapacityState(0.9, 6, 10_000), "critical-maintenance-only");
  assert.equal(deriveAutomaticCapacityState(0, 6, 0), "normal");
  assert.deepEqual(Object.keys(CAPACITY_POLICIES), [...capacityStates]);
});

test("manual capacity overrides can only make the automatic state more restrictive", () => {
  const restrictive = resolveCapacityState("constrained", {
    mode: "manual",
    manualState: "new-launches-paused",
    publicReason: "Provider instability requires a launch pause.",
    updatedAt: "2026-07-29T00:00:00.000Z",
    updatedBy: "owner",
  });
  assert.equal(restrictive.state, "new-launches-paused");
  assert.equal(restrictive.source, "manual-restrictive-override");
  assert.equal(restrictive.publicReason, "Provider instability requires a launch pause.");

  const attemptedRelaxation = resolveCapacityState("critical-maintenance-only", {
    mode: "manual",
    manualState: "normal",
    publicReason: "Attempted relaxation",
    updatedAt: "2026-07-29T00:00:00.000Z",
    updatedBy: "owner",
  });
  assert.equal(attemptedRelaxation.state, "critical-maintenance-only");
  assert.equal(attemptedRelaxation.source, "automatic");

  assert.equal(resolveCapacityState("normal", DEFAULT_CAPACITY_OVERRIDE).state, "normal");
});

test("stop reasons are exhaustive, unique, and typed as stop events", () => {
  assert.equal(new Set(stopDecisionCodes).size, 10);
  for (const code of stopDecisionCodes) {
    assert.equal(RUN_DECISION_DEFINITIONS[code].eventType, "stop");
    assert.equal(isRunDecisionCompatible("stop", code), true);
    assert.ok(RUN_DECISION_DEFINITIONS[code].description.length > 20);
  }
});

test("run decision transitions distinguish release, partial delivery, redirect, and failure", () => {
  assert.deepEqual(runDecisionTransition("release-approved"), {
    stage: "shipped",
    completionMode: "completed-early",
  });
  assert.deepEqual(runDecisionTransition("release-partial"), {
    stage: "shipped",
    completionMode: "partial-delivery",
  });
  assert.deepEqual(runDecisionTransition("reviewer-redirect"), {
    stage: "scheduled",
    completionMode: "planned",
  });
  assert.deepEqual(runDecisionTransition("provenance-failure"), {
    stage: "blocked",
    completionMode: "blocked",
  });
  assert.equal(runDecisionTransition("checkpoint-approved"), null);
  assert.equal(isRunDecisionCompatible("release", "checkpoint-approved"), false);
});
