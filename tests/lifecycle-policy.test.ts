import assert from "node:assert/strict";
import test from "node:test";

import {
  CHECKPOINT_DECISIONS,
  DELIVERY_OUTCOMES,
  KEN_LIFECYCLE_SIGNALS,
  KEN_LIFECYCLE_STAGES,
  lifecycleStageForTask,
} from "../src/lib/allocation-policy.ts";

test("the canonical lifecycle has eight ordered, uniquely identified public stages", () => {
  assert.deepEqual(
    KEN_LIFECYCLE_STAGES.map((stage) => stage.shortLabel),
    [
      "Draft",
      "Intake review",
      "Public signal",
      "Board approval",
      "Monitored run",
      "Checkpoint review",
      "Public delivery",
      "Post-run audit",
    ],
  );
  assert.deepEqual(
    KEN_LIFECYCLE_STAGES.map((stage) => stage.step),
    [1, 2, 3, 4, 5, 6, 7, 8],
  );
  assert.equal(new Set(KEN_LIFECYCLE_STAGES.map((stage) => stage.id)).size, 8);
  for (const stage of KEN_LIFECYCLE_STAGES) {
    assert.ok(stage.summary.length >= 60);
    assert.ok(stage.publicGate.length >= 50);
  }
});

test("lifecycle callouts reference canonical stages and preserve rank/funding separation", () => {
  const stageIds = new Set(KEN_LIFECYCLE_STAGES.map((stage) => stage.id));
  for (const signal of KEN_LIFECYCLE_SIGNALS) {
    assert.ok(signal.stageIds.length > 0);
    assert.ok(signal.stageIds.every((stageId) => stageIds.has(stageId)));
  }
  const fundingSignal = KEN_LIFECYCLE_SIGNALS.find((signal) => signal.id === "money-rank-separation");
  assert.match(fundingSignal?.summary ?? "", /never buys voice, rank, or checkpoint approval/i);
  assert.deepEqual(CHECKPOINT_DECISIONS, ["continue", "redirect", "pause", "block"]);
  assert.deepEqual(DELIVERY_OUTCOMES, ["complete", "partial", "early"]);
});

test("persisted task stages map to the correct lifecycle position", () => {
  assert.equal(lifecycleStageForTask("review"), "review");
  assert.equal(lifecycleStageForTask("voting"), "voting");
  assert.equal(lifecycleStageForTask("scheduled"), "scheduled");
  assert.equal(lifecycleStageForTask("running"), "running");
  assert.equal(lifecycleStageForTask("shipped"), "shipped");
  assert.equal(lifecycleStageForTask("blocked"), "checkpoint-review");
});
