import Link from "next/link";

import { TaskCard } from "@/components/task-card";
import { getHomeData } from "@/lib/db";
import { getSessionProfileId } from "@/lib/session";
import { compactWords, formatCurrency, formatNumber, formatPercent } from "@/lib/utils";

const scenarioGallery = [
  {
    title: "Public defender evidence navigator",
    copy: "Continuously summarize discovery packets, surface contradictions, and route human reviewers to the riskiest gaps before hearings.",
  },
  {
    title: "Heat shelter capacity planner",
    copy: "Fuse weather forecasts, transport constraints, and municipal shelter data into hour-by-hour public response recommendations.",
  },
  {
    title: "Small-lab reagent substitution atlas",
    copy: "Keep a living map of workable substitutes, protocol caveats, and procurement risk for research teams that cannot carry deep bench inventory.",
  },
  {
    title: "Cultural archive restoration desk",
    copy: "Maintain provenance-safe restoration, indexing, and packaging workflows for museums, libraries, and public-domain collections.",
  },
];

export default async function HomePage() {
  const activeProfileId = await getSessionProfileId();
  const { metrics, categories, featuredTasks, contributors, governance, activeProfile, sponsoredTasks, streams, economics } = getHomeData(activeProfileId);

  return (
    <div className="space-y-12">
      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="panel card-sheen relative overflow-hidden space-y-6">
          <div className="eyebrow">Democratizing sustained frontier compute</div>
          <h1 className="max-w-4xl font-display text-4xl font-semibold leading-tight text-ink sm:text-5xl lg:text-6xl">
            Let public judgment route month-scale AI execution, while the revenue engine quietly refills the treasury behind it.
          </h1>
          <p className="max-w-3xl text-lg leading-8 text-ink/72">
            KenMatch now separates four layers the conception brief implicitly demanded: public curation, quadratic allocation,
            checkpointed execution, and commercial packaging that funds more open work without turning access into a purchase.
          </p>
          <div className="signal-bar">
            <div className="flow-card">
              <div className="text-xs uppercase tracking-[0.22em] text-ink/45">Active perspective</div>
              <div className="mt-2 font-display text-2xl font-semibold text-ink">{activeProfile.name}</div>
              <p className="mt-2 text-sm leading-7 text-ink/66">{activeProfile.availableCredits} free voice credits with {activeProfile.bondedCredits} currently bonded to proposal quality.</p>
            </div>
            <div className="flow-card">
              <div className="text-xs uppercase tracking-[0.22em] text-ink/45">Treasury inflow / mo</div>
              <div className="mt-2 font-display text-2xl font-semibold text-ink">{formatCurrency(economics.treasuryMonthlyUsd)}</div>
              <p className="mt-2 text-sm leading-7 text-ink/66">Public compute is funded by enterprise packaging, licensing, and arbitrage rather than by bought voting power.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/tasks" className="rounded-full bg-ink px-5 py-3 text-sm font-semibold text-page transition hover:bg-accent">
              Browse ranked proposals
            </Link>
            <Link href="/economics" className="rounded-full border border-line bg-page/74 px-5 py-3 text-sm font-semibold text-ink transition hover:border-accent hover:text-accent">
              Inspect treasury logic
            </Link>
          </div>
        </div>
        <div className="space-y-4">
          <div className="panel">
            <div className="eyebrow">Allocation protocol</div>
            <div className="mt-4 grid gap-3">
              {[
                ["Months", "Top 3 per category", "Reserved for profound, checkpoint-heavy work with explicit tranche release gates."],
                ["Weeks", "Next 10 per category", "Complex delivery lanes with active evaluation and public course correction."],
                ["Days", "Next 100 per category", "Focused sprints for fast validation, repair, and reusable public artifacts."],
              ].map(([label, value, copy]) => (
                <div key={label} className="rounded-[1.2rem] border border-line bg-page/74 p-4">
                  <div className="font-display text-xl font-semibold text-ink">{label}</div>
                  <div className="mt-1 text-sm font-medium text-accent">{value}</div>
                  <p className="mt-2 text-sm leading-6 text-ink/68">{copy}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="metric-grid">
            {[
              ["Proposals", formatNumber(metrics.proposals)],
              ["Active runs", formatNumber(metrics.activeRuns)],
              ["Bonded voice", formatNumber(metrics.bondedVoice)],
              ["Public signal", formatNumber(metrics.publicSignal)],
            ].map(([label, value]) => (
              <div key={label} className="metric-card">
                <div className="text-xs uppercase tracking-[0.22em] text-ink/45">{label}</div>
                <div className="mt-2 font-display text-3xl font-semibold text-ink">{value}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="eyebrow">Current front-runners</div>
            <h2 className="mt-2 font-display text-3xl font-semibold text-ink">What the board would fund today</h2>
          </div>
          <Link href="/tasks" className="text-sm font-semibold text-accent transition hover:text-ink">
            Open full marketplace
          </Link>
        </div>
        <div className="section-grid" data-columns="3">
          {featuredTasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      </section>

      <section className="section-grid" data-columns="2">
        <div className="panel space-y-5">
          <div>
            <div className="eyebrow">Public to commercial flywheel</div>
            <h2 className="mt-2 font-display text-3xl font-semibold text-ink">Open outputs feed enterprise packaging, and enterprise packaging funds more open outputs</h2>
          </div>
          <div className="grid gap-4">
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
                <div className="mt-3 flex flex-wrap gap-3 text-xs uppercase tracking-[0.18em] text-ink/45">
                  <span>{stream.treasurySharePercent}% treasury</span>
                  <span>{stream.founderSharePercent}% founder</span>
                  <span>{formatPercent(stream.grossMargin)} gross margin</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="panel space-y-5">
          <div>
            <div className="eyebrow">Sponsor-ready lanes</div>
            <h2 className="mt-2 font-display text-3xl font-semibold text-ink">Tasks with realistic commercial or institutional pull-through</h2>
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
                <p className="mt-2 text-sm leading-7 text-ink/68">{compactWords(task.enterprisePackaging, 170)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-grid" data-columns="2">
        <div className="panel space-y-5">
          <div>
            <div className="eyebrow">Broader realistic examples</div>
            <h2 className="mt-2 font-display text-3xl font-semibold text-ink">The service should feel useful for serious public work, not just AI demos</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {scenarioGallery.map((scenario) => (
              <div key={scenario.title} className="rounded-[1.35rem] border border-line bg-page/72 p-5">
                <div className="font-display text-xl font-semibold text-ink">{scenario.title}</div>
                <p className="mt-2 text-sm leading-7 text-ink/68">{scenario.copy}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="panel space-y-5">
          <div>
            <div className="eyebrow">Governance and merit</div>
            <h2 className="mt-2 font-display text-3xl font-semibold text-ink">Who currently has the strongest voice</h2>
          </div>
          <div className="space-y-4">
            {contributors.map((profile) => (
              <div key={profile.id} className="rounded-[1.35rem] border border-line bg-page/72 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-display text-xl font-semibold text-ink">{profile.name}</div>
                    <div className="text-sm text-ink/62">{profile.role} · {profile.specialty}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-display text-2xl font-semibold text-ink">{profile.credibility.toFixed(2)}</div>
                    <div className="text-xs uppercase tracking-[0.22em] text-ink/45">credibility</div>
                  </div>
                </div>
                <p className="mt-3 text-sm leading-7 text-ink/68">{profile.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-grid" data-columns="2">
        <div className="panel space-y-5">
          <div>
            <div className="eyebrow">Category health</div>
            <h2 className="mt-2 font-display text-3xl font-semibold text-ink">Where proposals are accumulating</h2>
          </div>
          <div className="grid gap-4">
            {categories.map((category) => (
              <div key={category.id} className="rounded-[1.35rem] border border-line bg-page/72 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-display text-xl font-semibold text-ink">{category.name}</div>
                  <span className="rounded-full border border-line px-3 py-1 text-xs uppercase tracking-[0.22em] text-ink/55">
                    {category.proposalCount} proposals
                  </span>
                </div>
                <p className="mt-2 text-sm leading-7 text-ink/68">{category.thesis}</p>
                <div className="mt-4 grid gap-3 text-sm text-ink/62 sm:grid-cols-3">
                  <div>
                    <div className="text-xs uppercase tracking-[0.2em] text-ink/45">Eligible</div>
                    <div className="mt-1 font-display text-2xl font-semibold text-ink">{category.eligibleCount}</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-[0.2em] text-ink/45">Running</div>
                    <div className="mt-1 font-display text-2xl font-semibold text-ink">{category.runningCount}</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-[0.2em] text-ink/45">Shipped</div>
                    <div className="mt-1 font-display text-2xl font-semibold text-ink">{category.shippedCount}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="panel space-y-5">
          <div>
            <div className="eyebrow">Recent decisions</div>
            <h2 className="mt-2 font-display text-3xl font-semibold text-ink">Transparent governance trail</h2>
          </div>
          <div className="space-y-4">
            {governance.map((event) => (
              <div key={event.id} className="rounded-[1.35rem] border border-line bg-page/72 p-5">
                <div className="flex items-center justify-between gap-3 text-xs uppercase tracking-[0.22em] text-ink/45">
                  <span>{event.house.replace("-", " ")}</span>
                  <span>{new Date(event.createdAt).toLocaleDateString("en-US")}</span>
                </div>
                <div className="mt-3 font-display text-xl font-semibold text-ink">{event.title}</div>
                <p className="mt-2 text-sm leading-7 text-ink/68">{compactWords(event.decision, 165)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
