import test from "node:test";
import assert from "node:assert/strict";
import { performance } from "node:perf_hooks";

import {
  buildMarketplaceHref,
  DEFAULT_MARKETPLACE_PAGE_SIZE,
  getDiscoveryReasons,
  hasActiveMarketplaceFilters,
  normalizeMarketplacePage,
  normalizeMarketplacePageSize,
  rankDiscoveryCandidates,
  sortMarketplaceCandidates,
  type DiscoveryCandidate,
} from "../src/lib/discovery.ts";

const NOW = Date.parse("2026-07-27T12:00:00.000Z");

function candidate(overrides: Partial<DiscoveryCandidate> & Pick<DiscoveryCandidate, "id">): DiscoveryCandidate {
  const { id, ...rest } = overrides;
  return {
    id,
    proposerId: "proposer-a",
    categoryId: "category-a",
    createdAt: "2026-05-01T00:00:00.000Z",
    lastActivityAt: "2026-07-01T00:00:00.000Z",
    stage: "voting",
    safetyStatus: "approved",
    totalVotes: 2,
    supporterCount: 2,
    taskPulseScore: 2,
    taskPulseVotes: 2,
    positivePulseCount: 2,
    negativePulseCount: 0,
    trustedPulseScore: 2,
    completedCheckpointCount: 0,
    updateCount: 0,
    categoryRank: 2,
    ...rest,
  };
}

test("marketplace URLs serialize defaults, filters, and pages canonically", () => {
  assert.equal(buildMarketplaceHref("/kens", {}), "/kens");
  assert.equal(buildMarketplaceHref("/kens", {
    query: "  rare disease  ",
    category: "science-health",
    tier: "months",
    stage: "running",
    sort: "voice",
    page: 3,
  }), "/kens?q=rare+disease&category=science-health&tier=months&stage=running&sort=voice&page=3");
  assert.equal(buildMarketplaceHref("/kens", {
    query: "",
    category: "all",
    tier: "all",
    stage: "all",
    sort: "active",
    page: 1,
  }), "/kens");
  assert.equal(hasActiveMarketplaceFilters({ query: "safety" }), true);
  assert.equal(hasActiveMarketplaceFilters({ sort: "active" }), false);
});

test("marketplace page bounds reject invalid input and cap requested page size", () => {
  assert.equal(normalizeMarketplacePage(undefined), 1);
  assert.equal(normalizeMarketplacePage("0"), 1);
  assert.equal(normalizeMarketplacePage("not-a-page"), 1);
  assert.equal(normalizeMarketplacePage("8"), 8);
  assert.equal(normalizeMarketplacePageSize(undefined), DEFAULT_MARKETPLACE_PAGE_SIZE);
  assert.equal(normalizeMarketplacePageSize(500), 50);
});

test("exact discovery ties always resolve by stable Ken id", () => {
  const tasks = ["ken-c", "ken-a", "ken-b"].map((id) => candidate({ id }));
  assert.deepEqual(rankDiscoveryCandidates(tasks, NOW).map((task) => task.id), ["ken-a", "ken-b", "ken-c"]);
  assert.deepEqual(rankDiscoveryCandidates([...tasks].reverse(), NOW).map((task) => task.id), ["ken-a", "ken-b", "ken-c"]);
});

test("default discovery limits a dominant proposer's first-page concentration", () => {
  const dominant = Array.from({ length: 20 }, (_, index) => candidate({
    id: `dominant-${String(index).padStart(2, "0")}`,
    proposerId: "dominant",
    totalVotes: 100 - index,
    categoryRank: index + 1,
  }));
  const alternatives = Array.from({ length: 8 }, (_, index) => candidate({
    id: `alternative-${index}`,
    proposerId: `proposer-${index}`,
    totalVotes: 5,
    categoryRank: index + 21,
  }));

  const firstTen = rankDiscoveryCandidates([...dominant, ...alternatives], NOW).slice(0, 10);
  assert.equal(new Set(firstTen.map((task) => task.proposerId)).size >= 8, true);
  assert.equal(firstTen.filter((task) => task.proposerId === "dominant").length <= 2, true);
});

test("trusted breadth outranks coordinated untrusted pulse in pulse view", () => {
  const brigaded = candidate({
    id: "brigaded",
    proposerId: "brigade",
    taskPulseScore: 80,
    taskPulseVotes: 80,
    positivePulseCount: 80,
    trustedPulseScore: 0,
  });
  const broad = candidate({
    id: "broad",
    proposerId: "broad-community",
    taskPulseScore: 6,
    taskPulseVotes: 8,
    positivePulseCount: 7,
    negativePulseCount: 1,
    trustedPulseScore: 5,
  });

  assert.equal(sortMarketplaceCandidates([brigaded, broad], "pulse", NOW)[0]?.id, "broad");
});

test("reason labels separate voice, breadth, freshness, evidence, and safety state", () => {
  assert.deepEqual(getDiscoveryReasons(candidate({
    id: "voice",
    totalVotes: 16,
    positivePulseCount: 1,
    taskPulseVotes: 1,
  }), NOW), ["high-voice"]);

  assert.equal(getDiscoveryReasons(candidate({
    id: "fresh",
    proposerId: "new-proposer",
    categoryId: "new-category",
    createdAt: "2026-07-25T00:00:00.000Z",
    totalVotes: 0,
    supporterCount: 0,
    categoryRank: null,
  }), NOW).includes("new-under-reviewed"), true);

  assert.equal(getDiscoveryReasons(candidate({
    id: "old-quality",
    createdAt: "2024-01-01T00:00:00.000Z",
    completedCheckpointCount: 4,
    updateCount: 6,
  }), NOW).includes("checkpoint-momentum"), true);

  assert.deepEqual(getDiscoveryReasons(candidate({
    id: "unsafe",
    stage: "blocked",
    safetyStatus: "blocked",
  }), NOW), ["blocked"]);
});

test("old checkpoint-backed work remains discoverable while blocked work stays last", () => {
  const oldQuality = candidate({
    id: "old-quality",
    proposerId: "experienced",
    createdAt: "2023-01-01T00:00:00.000Z",
    completedCheckpointCount: 5,
    updateCount: 8,
  });
  const fresh = candidate({
    id: "fresh",
    proposerId: "new",
    categoryId: "sparse-category",
    createdAt: "2026-07-26T00:00:00.000Z",
    totalVotes: 0,
    supporterCount: 0,
    categoryRank: null,
  });
  const blocked = candidate({
    id: "blocked",
    proposerId: "blocked-proposer",
    stage: "blocked",
    safetyStatus: "blocked",
    totalVotes: 1_000,
  });
  const ordered = rankDiscoveryCandidates([blocked, fresh, oldQuality], NOW);

  assert.equal(ordered.slice(0, 2).some((task) => task.id === "old-quality"), true);
  assert.equal(ordered.slice(0, 2).some((task) => task.id === "fresh"), true);
  assert.equal(ordered.at(-1)?.id, "blocked");
});

test("discovery ordering stays bounded and deterministic through 100,000 Kens", () => {
  for (const size of [10, 100, 10_000, 100_000]) {
    const tasks = Array.from({ length: size }, (_, index) => candidate({
      id: `ken-${String(index).padStart(6, "0")}`,
      proposerId: `proposer-${index % 137}`,
      categoryId: `category-${index % 43}`,
      createdAt: new Date(NOW - (index % 720) * 86_400_000).toISOString(),
      lastActivityAt: new Date(NOW - (index % 90) * 3_600_000).toISOString(),
      stage: index % 97 === 0 ? "blocked" : index % 11 === 0 ? "running" : "voting",
      safetyStatus: index % 97 === 0 ? "blocked" : "approved",
      totalVotes: index % 31,
      supporterCount: index % 13,
      taskPulseScore: (index % 17) - 4,
      taskPulseVotes: index % 19,
      positivePulseCount: index % 15,
      negativePulseCount: index % 5,
      trustedPulseScore: (index % 9) - 2,
      completedCheckpointCount: index % 23 === 0 ? 3 : 0,
      updateCount: index % 29 === 0 ? 2 : 0,
      categoryRank: (index % 120) + 1,
    }));

    const startedAt = performance.now();
    const ordered = rankDiscoveryCandidates(tasks, NOW);
    const elapsedMs = performance.now() - startedAt;
    assert.equal(ordered.length, size);
    assert.equal(new Set(ordered.map((task) => task.id)).size, size);
    assert.deepEqual(
      ordered.slice(0, 25).map((task) => task.id),
      rankDiscoveryCandidates([...tasks].reverse(), NOW).slice(0, 25).map((task) => task.id),
    );
    if (size === 100_000) {
      assert.equal(elapsedMs < 15_000, true, `100,000-Ken discovery ordering took ${elapsedMs.toFixed(0)}ms`);
    }
  }
});
