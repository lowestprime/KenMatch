import { getEconomicsData } from "@/lib/db";
import { getViewerProfileId } from "@/lib/session";
import { formatCurrency, formatDateTime, formatNumber } from "@/lib/utils";

export default async function EconomicsPage() {
  const viewerProfileId = await getViewerProfileId();
  const { summary, revenueStreams, treasuryEntries, fundedTasks } = await getEconomicsData(viewerProfileId);

  return (
    <div className="page-stack">
      <section className="panel space-y-4">
        <div className="eyebrow">Funding and treasury</div>
        <h1 className="font-display text-4xl font-semibold text-foreground">How KenMatch funds public compute without selling rank</h1>
        <p className="max-w-4xl text-lg leading-8 text-muted">
          Revenue can support run costs, review, and operations. It does not buy placement on the board. The treasury page shows committed support, projected support, sponsor pools, and recent inflows and outflows.
        </p>
      </section>

      <section className="metric-grid">
        {[
          ["Revenue in market", formatCurrency(summary.monthlyRevenueUsd)],
          ["Committed revenue", formatCurrency(summary.committedRevenueUsd)],
          ["Committed treasury / month", formatCurrency(summary.committedTreasuryMonthlyUsd)],
          ["Projected treasury / month", formatCurrency(summary.treasuryMonthlyUsd)],
          ["Coverage", `${summary.coverageMonths.toFixed(1)} months`],
          ["Sponsor pools", formatCurrency(summary.sponsorPoolsUsd)],
        ].map(([label, value]) => (
          <div key={label} className="metric-card"><div className="eyebrow">{label}</div><div className="metric-value">{value}</div></div>
        ))}
      </section>

      <section className="section-grid" data-columns="2">
        <div className="panel space-y-4">
          <div className="eyebrow">Revenue streams</div>
          {revenueStreams.map((stream) => (
            <div key={stream.id} className="rounded-[1.3rem] border border-border bg-background/55 p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="font-display text-xl font-semibold text-foreground">{stream.name}</div>
                <span className="tag">{stream.status}</span>
              </div>
              <p className="mt-2 text-sm leading-7 text-muted">{stream.description}</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-3 text-sm text-muted">
                <div className="stat-card"><span>Monthly</span><strong>{formatCurrency(stream.monthlyRevenueUsd)}</strong></div>
                <div className="stat-card"><span>Treasury</span><strong>{formatCurrency(stream.treasuryMonthlyUsd)}</strong></div>
                <div className="stat-card"><span>Founder ops</span><strong>{formatCurrency(stream.founderMonthlyUsd)}</strong></div>
              </div>
            </div>
          ))}
        </div>
        <div className="panel space-y-4">
          <div className="eyebrow">Treasury ledger</div>
          {treasuryEntries.map((entry) => (
            <div key={entry.id} className="rounded-[1.3rem] border border-border bg-background/55 p-4 text-sm text-muted">
              <div className="flex items-center justify-between gap-3">
                <div className="font-semibold text-foreground">{entry.title}</div>
                <span className="tag">{entry.direction}</span>
              </div>
              <p className="mt-2">{entry.description}</p>
              <div className="mt-3 flex items-center justify-between gap-3">
                <div className="font-medium text-foreground">{formatCurrency(entry.amountUsd)}</div>
                <div className="text-xs uppercase tracking-[0.22em] text-muted">{formatDateTime(entry.createdAt)}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="section-grid" data-columns="2">
        <div className="panel space-y-4">
          <div className="eyebrow">Current flywheel</div>
          <div className="signal-bar">
            <div className="flow-card"><div className="eyebrow">Treasury balance</div><div className="metric-value">{formatCurrency(summary.treasuryBalanceUsd)}</div></div>
            <div className="flow-card"><div className="eyebrow">Restricted funding</div><div className="metric-value">{formatCurrency(summary.restrictedFundingUsd)}</div></div>
            <div className="flow-card"><div className="eyebrow">Verified streams</div><div className="metric-value">{formatNumber(summary.verifiedFundingStreams)}</div></div>
          </div>
          <p className="text-sm leading-7 text-muted">
            Sponsor pools stay attributable to specific Kens. Committed service revenue supports the shared compute treasury. Planned sponsorship is visible, but it is kept separate from committed monthly support until it is real.
          </p>
        </div>
        <div className="panel space-y-4">
          <div className="eyebrow">Funded Kens</div>
          <div className="grid gap-4 md:grid-cols-2">
            {fundedTasks.map((task) => (
              <div key={task.id} className="rounded-[1.3rem] border border-border bg-background/55 p-4 text-sm text-muted">
                <div className="font-display text-xl font-semibold text-foreground">{task.title}</div>
                <p className="mt-2">{task.enterprisePackaging}</p>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <span className="tag">Sponsor pool</span>
                  <span className="font-medium text-foreground">{formatCurrency(task.sponsorPoolUsd)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
