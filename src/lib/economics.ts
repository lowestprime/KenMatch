import type { EconomicsSummary, RevenueStreamRecord, RevenueStreamSummary, TreasuryEntryRecord } from "@/lib/types";

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
  monthlyPublicBurnUsd: number,
  sponsorPoolsUsd = 0,
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
    .filter((entry) => entry.title.toLowerCase().includes("restricted") || entry.description.toLowerCase().includes("restricted"))
    .reduce((total, entry) => total + (entry.direction === "inflow" ? entry.amountUsd : -entry.amountUsd), 0);
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
    restrictedFundingUsd,
    sponsorPoolsUsd,
    verifiedFundingStreams,
  };
}
