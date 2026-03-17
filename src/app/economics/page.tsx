import { getEconomicsData } from "@/lib/db";
import { getSessionProfileId } from "@/lib/session";
import { compactWords, formatCurrency, formatPercent } from "@/lib/utils";

export default async function EconomicsPage() {
  const activeProfileId = await getSessionProfileId();
  const { summary, streams, treasuryEntries, sponsoredTasks } = getEconomicsData(activeProfileId);

  return (
    <div className="space-y-8">
      <section className="panel card-sheen space-y-4">
        <div className="eyebrow">Economics</div>
        <h1 className="font-display text-4xl font-semibold text-ink">Public curation engine, commercial revenue engine</h1>
        <p className="max-w-4xl text-lg leading-8 text-ink/72">
          This layer operationalizes the conception brief’s financial thesis: open work stays merit-routed, enterprise packaging and preference licensing monetize convenience and insight, and the treasury recycles most of that value back into public compute.
        </p>
        <div className="metric-grid">
          <Metric label="Monthly revenue" value={formatCurrency(summary.monthlyRevenueUsd)} />
          <Metric label="Treasury share" value={formatCurrency(summary.treasuryMonthlyUsd)} />
          <Metric label="Founder share" value={formatCurrency(summary.founderMonthlyUsd)} />
          <Metric label="Treasury balance" value={formatCurrency(summary.treasuryBalanceUsd)} />
        </div>
      </section>

      <section className="section-grid" data-columns="2">
        <div className="panel space-y-5">
          <div>
            <div className="eyebrow">Revenue streams</div>
            <h2 className="mt-2 font-display text-3xl font-semibold text-ink">Open-source + enterprise dual flywheel</h2>
          </div>
          <div className="space-y-4">
            {streams.map((stream) => (
              <div key={stream.id} className="rounded-[1.35rem] border border-line bg-page/72 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-display text-xl font-semibold text-ink">{stream.name}</div>
                    <div className="text-xs uppercase tracking-[0.18em] text-ink/45">{stream.engine.replace("-", " ")} · {stream.status}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-display text-2xl font-semibold text-ink">{formatCurrency(stream.monthlyRevenueUsd)}</div>
                    <div className="text-xs uppercase tracking-[0.18em] text-ink/45">gross / month</div>
                  </div>
                </div>
                <p className="mt-3 text-sm leading-7 text-ink/68">{stream.description}</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <Metric label="Treasury" value={`${stream.treasurySharePercent}%`} compact />
                  <Metric label="Founder" value={`${stream.founderSharePercent}%`} compact />
                  <Metric label="Margin" value={formatPercent(stream.grossMargin)} compact />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="panel space-y-5">
          <div>
            <div className="eyebrow">Treasury ledger</div>
            <h2 className="mt-2 font-display text-3xl font-semibold text-ink">Recent routing decisions</h2>
          </div>
          <div className="space-y-4">
            {treasuryEntries.map((entry) => (
              <div key={entry.id} className="rounded-[1.35rem] border border-line bg-page/72 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-display text-xl font-semibold text-ink">{entry.title}</div>
                    <div className="text-xs uppercase tracking-[0.18em] text-ink/45">{entry.bucket.replace("-", " ")}</div>
                  </div>
                  <div className={`font-display text-2xl font-semibold ${entry.direction === "inflow" ? "text-accent" : "text-ember"}`}>
                    {entry.direction === "inflow" ? "+" : "-"}
                    {formatCurrency(entry.amountUsd)}
                  </div>
                </div>
                <p className="mt-3 text-sm leading-7 text-ink/68">{entry.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-grid" data-columns="2">
        <div className="panel space-y-5">
          <div>
            <div className="eyebrow">Commercial pull-through</div>
            <h2 className="mt-2 font-display text-3xl font-semibold text-ink">Which public lanes are most sponsorable</h2>
          </div>
          <div className="space-y-4">
            {sponsoredTasks.map((task) => (
              <div key={task.id} className="rounded-[1.35rem] border border-line bg-page/72 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-display text-xl font-semibold text-ink">{task.title}</div>
                  <span className="rounded-full border border-line px-3 py-1 text-xs uppercase tracking-[0.22em] text-ink/55">
                    {formatCurrency(task.sponsorPoolUsd)}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-7 text-ink/68">{compactWords(task.enterprisePackaging, 180)}</p>
                <p className="mt-2 text-sm leading-7 text-ink/60">{compactWords(task.dataValueNote, 180)}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="panel space-y-5">
          <div>
            <div className="eyebrow">Protocol summary</div>
            <h2 className="mt-2 font-display text-3xl font-semibold text-ink">How monetization stays aligned</h2>
          </div>
          <div className="space-y-4 text-sm leading-7 text-ink/68">
            <div className="rounded-[1.35rem] border border-line bg-page/72 p-5">
              Public curation, pulse votes, and quadratic allocation remain non-purchasable. Money buys packaging and service, not governance voice.
            </div>
            <div className="rounded-[1.35rem] border border-line bg-page/72 p-5">
              Open outputs stay open. The commercial layer monetizes hosting, integration, reliability, compliance, and convenience.
            </div>
            <div className="rounded-[1.35rem] border border-line bg-page/72 p-5">
              The 80/20 treasury rule is implemented directly in the modeled streams, with sponsorship lanes allowed to skew even more heavily toward public compute.
            </div>
            <div className="rounded-[1.35rem] border border-line bg-page/72 p-5">
              Preference and trajectory licensing is treated as privacy-screened, opt-in, and subordinate to public-benefit constraints rather than an excuse to exploit community labor.
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function Metric({ label, value, compact = false }: { label: string; value: string; compact?: boolean }) {
  return (
    <div className={`rounded-[1.2rem] border border-line bg-page/72 ${compact ? "px-4 py-3" : "px-4 py-4"}`}>
      <div className="text-xs uppercase tracking-[0.22em] text-ink/45">{label}</div>
      <div className="mt-2 font-display text-3xl font-semibold text-ink">{value}</div>
    </div>
  );
}
