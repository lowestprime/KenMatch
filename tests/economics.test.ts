import assert from "node:assert/strict";
import test from "node:test";

import { summarizeEconomics, summarizeRevenueStream } from "../src/lib/economics.ts";

test("summarizeRevenueStream applies treasury and founder shares", () => {
  const summary = summarizeRevenueStream({
    id: "stream-1",
    slug: "enterprise",
    name: "Enterprise packaging",
    engine: "enterprise",
    description: "Managed product layer",
    pricingModel: "Subscription",
    status: "live",
    monthlyRevenueUsd: 100_000,
    grossMargin: 0.8,
    treasurySharePercent: 80,
    founderSharePercent: 20,
  });

  assert.equal(summary.treasuryMonthlyUsd, 80_000);
  assert.equal(summary.founderMonthlyUsd, 20_000);
});

test("summarizeEconomics totals revenue and computes treasury balance from inflows and outflows", () => {
  const summary = summarizeEconomics(
    [
      {
        id: "stream-1",
        slug: "enterprise",
        name: "Enterprise packaging",
        engine: "enterprise",
        description: "Managed product layer",
        pricingModel: "Subscription",
        status: "live",
        monthlyRevenueUsd: 100_000,
        grossMargin: 0.8,
        treasurySharePercent: 80,
        founderSharePercent: 20,
      },
      {
        id: "stream-2",
        slug: "licensing",
        name: "Preference licensing",
        engine: "data-licensing",
        description: "Anonymized trajectory licensing",
        pricingModel: "License",
        status: "pilot",
        monthlyRevenueUsd: 25_000,
        grossMargin: 0.7,
        treasurySharePercent: 80,
        founderSharePercent: 20,
      },
    ],
    [
      {
        id: "entry-1",
        streamId: "stream-1",
        title: "Treasury routing",
        description: "Enterprise inflow",
        bucket: "compute-treasury",
        direction: "inflow",
        amountUsd: 80_000,
        createdAt: "2026-03-01T00:00:00.000Z",
      },
      {
        id: "entry-2",
        streamId: null,
        title: "Compute burn",
        description: "Month-tier outflow",
        bucket: "compute-treasury",
        direction: "outflow",
        amountUsd: 45_000,
        createdAt: "2026-03-02T00:00:00.000Z",
      },
      {
        id: "entry-3",
        streamId: null,
        title: "Founder transfer",
        description: "Ignored for treasury balance",
        bucket: "founder-ops",
        direction: "inflow",
        amountUsd: 20_000,
        createdAt: "2026-03-03T00:00:00.000Z",
      },
    ],
    45_000,
  );

  assert.equal(summary.monthlyRevenueUsd, 125_000);
  assert.equal(summary.treasuryMonthlyUsd, 100_000);
  assert.equal(summary.founderMonthlyUsd, 25_000);
  assert.equal(summary.treasuryBalanceUsd, 35_000);
  assert.equal(summary.monthlyPublicBurnUsd, 45_000);
});
