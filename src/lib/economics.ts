import type {
  EconomicsSummary,
  RevenueStreamRecord,
  RevenueStreamSummary,
  SponsorshipCommitmentRecord,
  TreasuryEntryRecord,
} from "@/lib/types";

export function summarizeRevenueStream(stream: RevenueStreamRecord): RevenueStreamSummary {
  const treasuryMonthlyUsd = Math.round((stream.monthlyRevenueUsd * stream.treasurySharePercent) / 100);
  const founderMonthlyUsd = Math.round((stream.monthlyRevenueUsd * stream.founderSharePercent) / 100);

  return {
    ...stream,
    treasuryMonthlyUsd,
    founderMonthlyUsd,
  };
}

export function summarizeEconomics(
  streams: RevenueStreamRecord[],
  entries: TreasuryEntryRecord[],
  sponsorshipCommitments: SponsorshipCommitmentRecord[],
  monthlyPublicBurnUsd: number,
  sponsorPoolsUsd = 0,
  coverageTargetMonths = 6,
): EconomicsSummary {
  const summarized = streams.map(summarizeRevenueStream);
  const committed = summarized.filter((stream) => stream.status !== "planned");
  const monthlyRevenueUsd = summarized.reduce((total, stream) => total + stream.monthlyRevenueUsd, 0);
  const committedRevenueUsd = committed.reduce((total, stream) => total + stream.monthlyRevenueUsd, 0);
  const treasuryMonthlyUsd = summarized.reduce((total, stream) => total + stream.treasuryMonthlyUsd, 0);
  const committedTreasuryMonthlyUsd = committed.reduce((total, stream) => total + stream.treasuryMonthlyUsd, 0);
  const founderMonthlyUsd = summarized.reduce((total, stream) => total + stream.founderMonthlyUsd, 0);
  const treasuryBalanceUsd = entries
    .filter((entry) => entry.bucket === "compute-treasury")
    .reduce((total, entry) => total + (entry.direction === "inflow" ? entry.amountUsd : -entry.amountUsd), 0);
  const coverageMonths = monthlyPublicBurnUsd > 0 ? Number((treasuryBalanceUsd / monthlyPublicBurnUsd).toFixed(1)) : 0;
  const restrictedFundingUsd = entries
    .filter((entry) => entry.restrictionMode === "restricted")
    .reduce((total, entry) => total + (entry.direction === "inflow" ? entry.amountUsd : -entry.amountUsd), 0);
  const committedRestrictedFundingUsd = entries
    .filter((entry) => entry.restrictionMode === "restricted" && entry.fundingState === "committed")
    .reduce((total, entry) => total + (entry.direction === "inflow" ? entry.amountUsd : -entry.amountUsd), 0);
  const projectedRestrictedFundingUsd =
    sponsorshipCommitments
      .filter((entry) => entry.restrictionScope !== "general" && entry.fundingState === "projected")
      .reduce((total, entry) => total + entry.amountUsd, 0) +
    entries
      .filter((entry) => entry.restrictionMode === "restricted" && entry.fundingState === "projected")
      .reduce((total, entry) => total + (entry.direction === "inflow" ? entry.amountUsd : -entry.amountUsd), 0);
  const simulatedFundingUsd = entries
    .filter((entry) => entry.fundingState === "simulated")
    .reduce((total, entry) => total + (entry.direction === "inflow" ? entry.amountUsd : -entry.amountUsd), 0);
  const sponsorCommitmentsUsd = sponsorshipCommitments.reduce((total, entry) => total + entry.amountUsd, 0);
  const safetyReserveUsd = entries
    .filter((entry) => entry.bucket === "safety-reserve" || entry.restrictionScope === "safety-reserve")
    .reduce((total, entry) => total + (entry.direction === "inflow" ? entry.amountUsd : -entry.amountUsd), 0);
  const coverageGapMonths = Number(Math.max(coverageTargetMonths - coverageMonths, 0).toFixed(1));
  const coverageStatus =
    coverageMonths >= coverageTargetMonths ? "healthy" : coverageMonths >= Math.max(1, coverageTargetMonths / 2) ? "watch" : "critical";
  const verifiedFundingStreams = committed.length;

  return {
    monthlyRevenueUsd,
    committedRevenueUsd,
    treasuryMonthlyUsd,
    committedTreasuryMonthlyUsd,
    founderMonthlyUsd,
    treasuryBalanceUsd,
    monthlyPublicBurnUsd,
    coverageMonths,
    coverageTargetMonths,
    coverageGapMonths,
    coverageStatus,
    restrictedFundingUsd,
    committedRestrictedFundingUsd,
    projectedRestrictedFundingUsd,
    simulatedFundingUsd,
    sponsorPoolsUsd,
    sponsorCommitmentsUsd,
    safetyReserveUsd,
    verifiedFundingStreams,
  };
}
