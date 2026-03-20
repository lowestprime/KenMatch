import assert from "node:assert/strict";
import test from "node:test";

import { resolveParticipationPolicy } from "../src/lib/attestation.ts";

test("verified low-risk accounts keep full voice capacity", () => {
  const policy = resolveParticipationPolicy("verified", "low", 40);

  assert.equal(policy.state, "full");
  assert.equal(policy.effectiveVoiceCredits, 40);
  assert.equal(policy.canAllocateVoice, true);
  assert.equal(policy.canSubmit, true);
});

test("review accounts keep participation with a temporary voice cap", () => {
  const policy = resolveParticipationPolicy("review", "medium", 20);

  assert.equal(policy.state, "review-limited");
  assert.equal(policy.effectiveVoiceCredits, 12);
  assert.equal(policy.canAllocateVoice, true);
  assert.equal(policy.canComment, true);
});

test("limited or high-risk accounts become read-only until review completes", () => {
  const policy = resolveParticipationPolicy("limited", "high", 20);

  assert.equal(policy.state, "read-only");
  assert.equal(policy.effectiveVoiceCredits, 0);
  assert.equal(policy.canAllocateVoice, false);
  assert.equal(policy.canSubmit, false);
  assert.equal(policy.canComment, false);
});
