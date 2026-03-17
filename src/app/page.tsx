import Link from "next/link";

import { TaskCard } from "@/components/task-card";
import { getHomeData } from "@/lib/db";
<<<<<<< HEAD
import { getViewerProfileId } from "@/lib/session";
import { formatCurrency, formatNumber } from "@/lib/utils";

export default async function HomePage() {
  const viewerProfileId = await getViewerProfileId();
  const { metrics, categories, featuredTasks, contributors, governance, economics, revenueStreams, viewer } = await getHomeData(viewerProfileId);
=======
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
>>>>>>> origin/main

  return (
    <div className="space-y-12">
      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
<<<<<<< HEAD
        <div className="panel hero-panel fade-up">
          <div className="eyebrow">Democratizing sustained frontier AI</div>
          <h1 className="max-w-4xl font-display text-4xl font-semibold leading-tight text-foreground sm:text-5xl lg:text-6xl">
            Route months of agentic work by public value, earned voice, and explicit checkpoints instead of pure capital access.
          </h1>
          <p className="max-w-3xl text-lg leading-8 text-muted">
            KenMatch combines public curation, Stack Exchange-style debate, proposal quality bonds, checkpoint-gated execution, and a separate commercial flywheel that funds the compute treasury without selling governance.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/tasks" className="cta-primary">Browse ranked proposals</Link>
            <Link href="/submit" className="cta-secondary">Submit a task</Link>
            <Link href="/economics" className="cta-secondary">Inspect treasury logic</Link>
          </div>
          <div className="rounded-[1.5rem] border border-border bg-background/55 p-5 text-sm leading-7 text-muted">
            {viewer ? (
              <p>
                Signed in as <span className="font-semibold text-foreground">{viewer.name}</span> with <span className="font-semibold text-foreground">{viewer.availableCredits}</span> free voice credits and <span className="font-semibold text-foreground">{viewer.attestationLevel}</span> attestation.
              </p>
            ) : (
              <p>Browsing anonymously. The board stays public; participation requires a contributor account so voice and comments remain attributable.</p>
            )}
=======
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
>>>>>>> origin/main
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
        <div className="space-y-4 fade-up stagger-1">
          <div className="panel space-y-4">
            <div className="eyebrow">Allocation protocol</div>
<<<<<<< HEAD
            {[["Months", "Top 3 per category", "Deep, checkpoint-heavy work with multi-week monitoring."],["Weeks", "Next 10 per category", "Complex bounded work that still needs sustained continuity."],["Days", "Next 100 per category", "Focused sprints for narrow but high-value outputs."]].map(([label, value, copy]) => (
              <div key={label} className="rounded-[1.25rem] border border-border bg-background/50 p-4">
                <div className="font-display text-xl font-semibold text-foreground">{label}</div>
                <div className="mt-1 text-sm font-medium text-teal">{value}</div>
                <p className="mt-2 text-sm leading-6 text-muted">{copy}</p>
              </div>
            ))}
          </div>
          <div className="metric-grid">
            {[["Proposals", formatNumber(metrics.proposals)],["Active runs", formatNumber(metrics.activeRuns)],["Bonded voice", formatNumber(metrics.bondedVoice)],["Treasury / month", formatCurrency(metrics.treasuryMonthlyUsd)]].map(([label, value]) => (
              <div key={label} className="metric-card"><div className="eyebrow">{label}</div><div className="metric-value">{value}</div></div>
=======
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
>>>>>>> origin/main
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-5">
        <div className="section-heading">
          <div>
            <div className="eyebrow">Front-runners</div>
            <h2 className="font-display text-3xl font-semibold text-foreground">What the board would fund right now</h2>
          </div>
<<<<<<< HEAD
          <Link href="/tasks" className="text-sm font-semibold text-teal">Open full marketplace</Link>
=======
          <Link href="/tasks" className="text-sm font-semibold text-accent transition hover:text-ink">
            Open full marketplace
          </Link>
>>>>>>> origin/main
        </div>
        <div className="section-grid" data-columns="3">
          {featuredTasks.map((task) => <TaskCard key={task.id} task={task} />)}
        </div>
      </section>

      <section className="section-grid" data-columns="2">
        <div className="panel space-y-5">
<<<<<<< HEAD
          <div className="eyebrow">Broader public-interest frontier work</div>
          <div className="grid gap-4">
            {categories.map((category) => (
              <div key={category.id} className="rounded-[1.3rem] border border-border bg-background/55 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-display text-xl font-semibold text-foreground">{category.name}</div>
                  <span className="tag">{category.proposalCount} proposals</span>
=======
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
>>>>>>> origin/main
                </div>
                <p className="mt-2 text-sm leading-7 text-muted">{category.thesis}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="panel space-y-5">
<<<<<<< HEAD
          <div className="eyebrow">Revenue engine split</div>
          <h2 className="font-display text-3xl font-semibold text-foreground">Public curation and commercial packaging are intentionally separate</h2>
          <p className="text-sm leading-7 text-muted">
            Governance voice cannot be purchased. Revenue comes from enterprise packaging, data licensing, compute arbitrage, and sponsorship routing into the treasury.
          </p>
          <div className="grid gap-4">
            {revenueStreams.map((stream) => (
              <div key={stream.id} className="rounded-[1.3rem] border border-border bg-background/55 p-4 text-sm text-muted">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-semibold text-foreground">{stream.name}</div>
                  <span className="tag">{formatCurrency(stream.treasuryMonthlyUsd)}</span>
                </div>
                <p className="mt-2">{stream.description}</p>
=======
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
>>>>>>> origin/main
              </div>
            ))}
            <div className="rounded-[1.3rem] border border-border bg-background/55 p-4 text-sm text-muted">
              <div className="font-semibold text-foreground">Current treasury balance</div>
              <div className="mt-2 font-display text-3xl font-semibold text-foreground">{formatCurrency(economics.treasuryBalanceUsd)}</div>
            </div>
          </div>
        </div>
      </section>

      <section className="section-grid" data-columns="2">
        <div className="panel space-y-4">
          <div className="eyebrow">Recent governance</div>
          {governance.map((event) => (
            <div key={event.id} className="rounded-[1.3rem] border border-border bg-background/55 p-4">
              <div className="text-xs uppercase tracking-[0.22em] text-muted">{event.house.replace("-", " ")}</div>
              <div className="mt-2 font-display text-xl font-semibold text-foreground">{event.title}</div>
              <p className="mt-2 text-sm leading-7 text-muted">{event.decision}</p>
            </div>
          ))}
        </div>
        <div className="panel space-y-4">
          <div className="eyebrow">Contributors with standing voice</div>
          {contributors.map((profile) => (
            <div key={profile.id} className="rounded-[1.3rem] border border-border bg-background/55 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="font-display text-xl font-semibold text-foreground">{profile.name}</div>
                  <div className="text-sm text-muted">{profile.role} · {profile.specialty}</div>
                </div>
                <div className="text-right"><div className="font-display text-2xl font-semibold text-foreground">{profile.credibility.toFixed(2)}</div><div className="text-xs uppercase tracking-[0.22em] text-muted">credibility</div></div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
