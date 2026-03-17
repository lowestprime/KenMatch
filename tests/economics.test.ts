import assert from "node:assert/strict";
import test from "node:test";

import { summarizeEconomics, summarizeRevenueStream } from "../src/lib/economics.ts";

test("summarizeRevenueStream applies treasury and founder splits", () => {
  const stream = summarizeRevenueStream({
    id: "stream-1",
    slug: "enterprise",
    name: "Enterprise",
    engine: "enterprise",
    description: "Managed packaging",
    pricingModel: "Subscription",
    status: "live",
    monthlyRevenueUsd: 62000,
    grossMargin: 0.81,
    treasurySharePercent: 80,
    founderSharePercent: 20,
  });

  assert.equal(stream.treasuryMonthlyUsd, 49600);
  assert.equal(stream.founderMonthlyUsd, 12400);
});

test("summarizeEconomics computes the compute treasury balance from treasury entries only", () => {
  const summary = summarizeEconomics(
    [
      {
        id: "stream-1",
        slug: "enterprise",
        name: "Enterprise",
        engine: "enterprise",
        description: "Managed packaging",
        pricingModel: "Subscription",
        status: "live",
        monthlyRevenueUsd: 50000,
        grossMargin: 0.8,
        treasurySharePercent: 80,
        founderSharePercent: 20,
      },
    ],
    [
      {
        id: "entry-1",
        streamId: "stream-1",
        title: "Treasury inflow",
        description: "Revenue routed to compute treasury",
        bucket: "compute-treasury",
        direction: "inflow",
        amountUsd: 40000,
        createdAt: "2026-03-01T00:00:00.000Z",
      },
      {
        id: "entry-2",
        streamId: null,
        title: "Compute spend",
        description: "Month-tier run",
        bucket: "compute-treasury",
        direction: "outflow",
        amountUsd: 14000,
        createdAt: "2026-03-02T00:00:00.000Z",
      },
      {
        id: "entry-3",
        streamId: null,
        title: "Founder ops",
        description: "Separate founder distribution",
        bucket: "founder-ops",
        direction: "inflow",
        amountUsd: 10000,
        createdAt: "2026-03-03T00:00:00.000Z",
      },
    ],
    18000,
  );

  assert.equal(summary.monthlyRevenueUsd, 50000);
  assert.equal(summary.treasuryMonthlyUsd, 40000);
  assert.equal(summary.founderMonthlyUsd, 10000);
  assert.equal(summary.treasuryBalanceUsd, 26000);
  assert.equal(summary.monthlyPublicBurnUsd, 18000);
});
