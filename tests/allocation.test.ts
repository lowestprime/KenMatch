import test from "node:test";
import assert from "node:assert/strict";

import { buildCategoryRankings, quadraticCost, spentCredits, tierForRank } from "../src/lib/allocation.ts";

test("quadratic cost grows non-linearly", () => {
  assert.equal(quadraticCost(0), 0);
  assert.equal(quadraticCost(3), 9);
  assert.equal(quadraticCost(6), 36);
});

test("spent credits sums per-task quadratic allocations", () => {
  assert.equal(spentCredits([{ voteCount: 4 }, { voteCount: 2 }, { voteCount: 1 }]), 21);
});

test("tierForRank follows the months / weeks / days allocation protocol", () => {
  assert.equal(tierForRank(1, true), "months");
  assert.equal(tierForRank(4, true), "weeks");
  assert.equal(tierForRank(11, true), "days");
  assert.equal(tierForRank(null, false), "queued");
  assert.equal(tierForRank(null, false, true), "blocked");
});

test("buildCategoryRankings ranks only eligible tasks and keeps blocked work out of the allocation ladder", () => {
  const rankings = buildCategoryRankings([
    { id: "alpha", categoryId: "open", title: "Alpha", createdAt: "2026-03-01T00:00:00.000Z", totalVotes: 12, stage: "running", safetyStatus: "approved" },
    { id: "beta", categoryId: "open", title: "Beta", createdAt: "2026-03-02T00:00:00.000Z", totalVotes: 8, stage: "scheduled", safetyStatus: "approved" },
    { id: "gamma", categoryId: "open", title: "Gamma", createdAt: "2026-03-03T00:00:00.000Z", totalVotes: 1, stage: "voting", safetyStatus: "approved" },
    { id: "delta", categoryId: "open", title: "Delta", createdAt: "2026-03-04T00:00:00.000Z", totalVotes: 0, stage: "review", safetyStatus: "pending" },
    { id: "epsilon", categoryId: "open", title: "Epsilon", createdAt: "2026-03-05T00:00:00.000Z", totalVotes: 100, stage: "blocked", safetyStatus: "blocked" },
  ]);

  assert.deepEqual(rankings.get("alpha"), { rank: 1, tier: "months" });
  assert.deepEqual(rankings.get("beta"), { rank: 2, tier: "months" });
  assert.deepEqual(rankings.get("gamma"), { rank: 3, tier: "months" });
  assert.deepEqual(rankings.get("delta"), { rank: null, tier: "queued" });
  assert.deepEqual(rankings.get("epsilon"), { rank: null, tier: "blocked" });
});