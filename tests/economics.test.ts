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

test("summarizeEconomics derives coverage, restricted funds, and verified streams", () => {
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
      {
        id: "stream-3",
        slug: "sponsorship",
        name: "Civic sponsorships",
        engine: "sponsorship",
        description: "Restricted pools",
        pricingModel: "Sponsorship",
        status: "planned",
        monthlyRevenueUsd: 10_000,
        grossMargin: 0.6,
        treasurySharePercent: 90,
        founderSharePercent: 10,
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
        title: "Restricted civic sponsorship pool",
        description: "Restricted inflow for public health Kens",
        bucket: "compute-treasury",
        direction: "inflow",
        amountUsd: 12_000,
        createdAt: "2026-03-02T00:00:00.000Z",
      },
      {
        id: "entry-3",
        streamId: null,
        title: "Compute burn",
        description: "Month-tier outflow",
        bucket: "compute-treasury",
        direction: "outflow",
        amountUsd: 46_000,
        createdAt: "2026-03-03T00:00:00.000Z",
      },
      {
        id: "entry-4",
        streamId: null,
        title: "Founder transfer",
        description: "Ignored for treasury balance",
        bucket: "founder-ops",
        direction: "inflow",
        amountUsd: 20_000,
        createdAt: "2026-03-04T00:00:00.000Z",
      },
    ],
    46_000,
    18_000,
  );

  assert.equal(summary.monthlyRevenueUsd, 135_000);
  assert.equal(summary.treasuryMonthlyUsd, 109_000);
  assert.equal(summary.founderMonthlyUsd, 26_000);
  assert.equal(summary.treasuryBalanceUsd, 46_000);
  assert.equal(summary.monthlyPublicBurnUsd, 46_000);
  assert.equal(summary.coverageMonths, 1);
  assert.equal(summary.restrictedFundingUsd, 12_000);
  assert.equal(summary.sponsorPoolsUsd, 18_000);
  assert.equal(summary.verifiedFundingStreams, 2);
});


