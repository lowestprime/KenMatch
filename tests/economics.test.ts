import assert from "node:assert/strict";
import test from "node:test";

import { computeGovernorSplit, summarizeEconomics, summarizeRevenueStream } from "../src/lib/economics.ts";

const baseStream = {
  publicBenefitCovenant: "Treasury funding stays separate from rank.",
  openDeliverableBoundary: "Public outputs remain readable.",
  contributorDividendPercent: 0,
  requiresContributorConsent: false,
} as const;

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
    ...baseStream,
  });

  assert.equal(summary.treasuryMonthlyUsd, 80_000);
  assert.equal(summary.founderMonthlyUsd, 20_000);
});

test("summarizeEconomics derives structured funding balances and coverage policy", () => {
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
        ...baseStream,
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
        publicBenefitCovenant: "Requires screened consent.",
        openDeliverableBoundary: "Only screened records leave the board.",
        contributorDividendPercent: 10,
        requiresContributorConsent: true,
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
        ...baseStream,
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
        fundingState: "committed",
        restrictionMode: "unrestricted",
        restrictionScope: "general",
        restrictionTargetId: null,
        restrictionTargetLabel: "Shared compute treasury",
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
        fundingState: "committed",
        restrictionMode: "restricted",
        restrictionScope: "category",
        restrictionTargetId: "public-interest",
        restrictionTargetLabel: "Public Interest",
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
        fundingState: "committed",
        restrictionMode: "unrestricted",
        restrictionScope: "general",
        restrictionTargetId: null,
        restrictionTargetLabel: "Month lane",
        createdAt: "2026-03-03T00:00:00.000Z",
      },
      {
        id: "entry-4",
        streamId: null,
        title: "Demo runway",
        description: "Sandbox capital",
        bucket: "compute-treasury",
        direction: "inflow",
        amountUsd: 8_000,
        fundingState: "simulated",
        restrictionMode: "unrestricted",
        restrictionScope: "general",
        restrictionTargetId: null,
        restrictionTargetLabel: "Demo runway",
        createdAt: "2026-03-04T00:00:00.000Z",
      },
      {
        id: "entry-5",
        streamId: null,
        title: "Safety reserve",
        description: "Protected reserve",
        bucket: "safety-reserve",
        direction: "inflow",
        amountUsd: 6_000,
        fundingState: "committed",
        restrictionMode: "restricted",
        restrictionScope: "safety-reserve",
        restrictionTargetId: "safety-reserve",
        restrictionTargetLabel: "Safety reserve",
        createdAt: "2026-03-05T00:00:00.000Z",
      },
    ],
    [
      {
        id: "commitment-1",
        sponsorName: "Civic Foundation",
        sponsorType: "foundation",
        sponsorContact: "ops@example.org",
        note: "Projected category support",
        amountUsd: 18_000,
        fundingState: "projected",
        status: "intake",
        restrictionScope: "category",
        restrictionTargetId: "public-interest",
        restrictionTargetLabel: "Public Interest",
        checkoutSessionId: null,
        createdAt: "2026-03-06T00:00:00.000Z",
        updatedAt: "2026-03-06T00:00:00.000Z",
        paidAt: null,
      },
    ],
    46_000,
    18_000,
    6,
  );

  assert.equal(summary.monthlyRevenueUsd, 135_000);
  assert.equal(summary.treasuryMonthlyUsd, 109_000);
  assert.equal(summary.founderMonthlyUsd, 26_000);
  assert.equal(summary.treasuryBalanceUsd, 54_000);
  assert.equal(summary.monthlyPublicBurnUsd, 46_000);
  assert.equal(summary.coverageMonths, 1.2);
  assert.equal(summary.coverageTargetMonths, 6);
  assert.equal(summary.coverageGapMonths, 4.8);
  assert.equal(summary.coverageStatus, "critical");
  assert.equal(summary.restrictedFundingUsd, 18_000);
  assert.equal(summary.committedRestrictedFundingUsd, 18_000);
  assert.equal(summary.projectedRestrictedFundingUsd, 18_000);
  assert.equal(summary.simulatedFundingUsd, 8_000);
  assert.equal(summary.sponsorPoolsUsd, 18_000);
  assert.equal(summary.sponsorCommitmentsUsd, 18_000);
  assert.equal(summary.safetyReserveUsd, 6_000);
  assert.equal(summary.verifiedFundingStreams, 2);
  assert.equal(summary.governorActive, true);
  assert.equal(summary.adjustedTreasurySharePercent, 90);
});

test("computeGovernorSplit leaves base split when coverage meets target", () => {
  const split = computeGovernorSplit(6, 6, 80);
  assert.deepEqual(split, { treasurySharePercent: 80, founderSharePercent: 20 });
});

test("computeGovernorSplit boosts treasury up to 10 points when below target, capped at 95", () => {
  assert.deepEqual(computeGovernorSplit(1, 6, 80), { treasurySharePercent: 90, founderSharePercent: 10 });
  assert.deepEqual(computeGovernorSplit(0, 6, 90), { treasurySharePercent: 95, founderSharePercent: 5 });
  assert.deepEqual(computeGovernorSplit(2, 6, 92), { treasurySharePercent: 95, founderSharePercent: 5 });
});

test("summarizeEconomics clamps negative balance to zero coverage months", () => {
  const summary = summarizeEconomics(
    [{
      id: "s1", slug: "e", name: "E", engine: "enterprise", description: "d",
      pricingModel: "sub", status: "live", monthlyRevenueUsd: 10_000,
      grossMargin: 0.8, treasurySharePercent: 80, founderSharePercent: 20,
      publicBenefitCovenant: "c", openDeliverableBoundary: "b",
      contributorDividendPercent: 0, requiresContributorConsent: false,
    }],
    [
      { id: "e1", streamId: null, title: "In", description: "d", bucket: "compute-treasury", direction: "inflow", amountUsd: 10_000, fundingState: "committed", restrictionMode: "unrestricted", restrictionScope: "general", restrictionTargetId: null, restrictionTargetLabel: "t", createdAt: "2026-01-01T00:00:00.000Z" },
      { id: "e2", streamId: null, title: "Out", description: "d", bucket: "compute-treasury", direction: "outflow", amountUsd: 50_000, fundingState: "committed", restrictionMode: "unrestricted", restrictionScope: "general", restrictionTargetId: null, restrictionTargetLabel: "t", createdAt: "2026-01-02T00:00:00.000Z" },
    ],
    [],
    20_000,
    0,
    6,
  );
  assert.equal(summary.coverageMonths, 0, "negative balance should yield 0 coverage months");
  assert.equal(summary.governorActive, true);
});
