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
): EconomicsSummary {
  const summarized = streams.map(summarizeRevenueStream);
  const monthlyRevenueUsd = summarized.reduce((total, stream) => total + stream.monthlyRevenueUsd, 0);
  const treasuryMonthlyUsd = summarized.reduce((total, stream) => total + stream.treasuryMonthlyUsd, 0);
  const founderMonthlyUsd = summarized.reduce((total, stream) => total + stream.founderMonthlyUsd, 0);
  const treasuryBalanceUsd = entries
    .filter((entry) => entry.bucket === "compute-treasury")
    .reduce((total, entry) => total + (entry.direction === "inflow" ? entry.amountUsd : -entry.amountUsd), 0);

  return {
    monthlyRevenueUsd,
    treasuryMonthlyUsd,
    founderMonthlyUsd,
    treasuryBalanceUsd,
    monthlyPublicBurnUsd,
  };
}
