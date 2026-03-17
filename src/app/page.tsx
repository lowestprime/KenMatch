import Link from "next/link";

import { TaskCard } from "@/components/task-card";
import { getHomeData } from "@/lib/db";
import { getViewerProfileId } from "@/lib/session";
import { formatCurrency, formatNumber } from "@/lib/utils";

export default async function HomePage() {
  const viewerProfileId = await getViewerProfileId();
  const { metrics, categories, featuredTasks, contributors, governance, economics, revenueStreams, viewer } = await getHomeData(viewerProfileId);

  return (
    <div className="space-y-12">
      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
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
          </div>
        </div>
        <div className="space-y-4 fade-up stagger-1">
          <div className="panel space-y-4">
            <div className="eyebrow">Allocation protocol</div>
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
          <Link href="/tasks" className="text-sm font-semibold text-teal">Open full marketplace</Link>
        </div>
        <div className="section-grid" data-columns="3">
          {featuredTasks.map((task) => <TaskCard key={task.id} task={task} />)}
        </div>
      </section>

      <section className="section-grid" data-columns="2">
        <div className="panel space-y-5">
          <div className="eyebrow">Broader public-interest frontier work</div>
          <div className="grid gap-4">
            {categories.map((category) => (
              <div key={category.id} className="rounded-[1.3rem] border border-border bg-background/55 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-display text-xl font-semibold text-foreground">{category.name}</div>
                  <span className="tag">{category.proposalCount} proposals</span>
                </div>
                <p className="mt-2 text-sm leading-7 text-muted">{category.thesis}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="panel space-y-5">
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
