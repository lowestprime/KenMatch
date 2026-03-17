import { getEconomicsData } from "@/lib/db";
import { getViewerProfileId } from "@/lib/session";
import { formatCurrency } from "@/lib/utils";

export default async function EconomicsPage() {
  const viewerProfileId = await getViewerProfileId();
  const { summary, revenueStreams, treasuryEntries, fundedTasks } = await getEconomicsData(viewerProfileId);

  return (
    <div className="space-y-8">
      <section className="panel space-y-4">
        <div className="eyebrow">Economics</div>
        <h1 className="font-display text-4xl font-semibold text-foreground">Commercial revenue funds public compute, but does not buy voice</h1>
        <p className="max-w-4xl text-lg leading-8 text-muted">
          This page operationalizes the conception document’s financial split: enterprise and data revenue route into the compute treasury, while the public curation engine remains visibly separate.
        </p>
      </section>

      <section className="metric-grid">
        {[["Monthly revenue", formatCurrency(summary.monthlyRevenueUsd)],["Treasury / month", formatCurrency(summary.treasuryMonthlyUsd)],["Founder / month", formatCurrency(summary.founderMonthlyUsd)],["Treasury balance", formatCurrency(summary.treasuryBalanceUsd)]].map(([label, value]) => (
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
                <div className="stat-card"><span>Founder</span><strong>{formatCurrency(stream.founderMonthlyUsd)}</strong></div>
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
              <div className="mt-2 font-medium text-foreground">{formatCurrency(entry.amountUsd)}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="panel space-y-4">
        <div className="eyebrow">Funded work</div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {fundedTasks.map((task) => (
            <div key={task.id} className="rounded-[1.3rem] border border-border bg-background/55 p-4 text-sm text-muted">
              <div className="font-display text-xl font-semibold text-foreground">{task.title}</div>
              <p className="mt-2">{task.enterprisePackaging}</p>
              <div className="mt-3 font-medium text-foreground">Sponsor pool {formatCurrency(task.sponsorPoolUsd)}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
