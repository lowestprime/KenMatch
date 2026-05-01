import Link from "next/link";

import { CategorySymbol } from "@/components/ken-visual";
import { TaskCard } from "@/components/task-card";
import { getHomeData } from "@/lib/db";
import { KEN_DEFINITION } from "@/lib/faq";
import { getViewerProfileId } from "@/lib/session";
import { categoryFilterHref, laneFilterHref } from "@/lib/taxonomy";
import type { AllocationTier } from "@/lib/types";
import { formatCurrency, formatNumber } from "@/lib/utils";

export default async function HomePage() {
  const viewerProfileId = await getViewerProfileId();
  const { metrics, categories, featuredTasks, governance, economics, revenueStreams, viewer } = await getHomeData(viewerProfileId);

  return (
    <div className="page-stack">
      <aside className="panel sandbox-banner" role="note" aria-label="Sandbox demo disclosure">
        <span className="eyebrow">Public sandbox</span>
        <p>
          <strong>This is a public demonstration of KenMatch.</strong> Dollar figures, sponsorship totals, pilot-user counts, and result samples are <strong>simulated</strong> sandbox data. They show how the system would work, not real investments, vendor commitments, or delivered production work.
        </p>
      </aside>
      <section className="hero-layout">
        <div className="panel hero-panel fade-up">
          <div className="eyebrow">Public queue for sustained AI work</div>
          <h1 className="max-w-4xl font-display text-4xl font-semibold leading-tight text-foreground sm:text-5xl lg:text-6xl">
            Rank the Kens worth long-running compute, checkpoints, and review.
          </h1>
          <p className="max-w-3xl text-lg leading-8 text-muted">
            {KEN_DEFINITION} Examples include mechanism maps, reproducibility agents, benchmark harnesses, dependency-safety planning, protocol scouting, and other outputs that need public inspection after the first demo.
          </p>
          <div className="hero-actions">
            <Link href="/kens" className="cta-primary">Browse Kens</Link>
            <Link href="/submit" className="cta-secondary">Submit a Ken</Link>
            <Link href="/economics" className="cta-secondary">See backing</Link>
          </div>
          <div className="hero-note">
            {viewer ? (
              <p>
                Signed in as <span className="font-semibold text-foreground">{viewer.name}</span> with <span className="font-semibold text-foreground">{viewer.availableCredits}</span> allocation credits available.
              </p>
            ) : (
              <p>Reading is open. Accounts are only needed to vote, comment, submit Kens, or request verification.</p>
            )}
          </div>
        </div>
        <div className="space-y-4 fade-up stagger-1">
          <div className="panel space-y-4">
            <div className="eyebrow">How long a Ken can run</div>
            {[
              ["months", "Months", "Top 3 per category", "Long-horizon synthesis, evaluation, and tool-building with repeated human checkpoints."],
              ["weeks", "Weeks", "Next 10 per category", "Multi-step research, coding, and design runs with visible mid-run decisions."],
              ["days", "Days", "Next 100 per category", "Focused deliverables with clear acceptance checks and public artifacts."],
            ].map(([tier, label, value, copy]) => (
              <Link key={label} href={laneFilterHref(tier as AllocationTier)} className="lane-summary-card interactive-surface">
                <div className="font-display text-xl font-semibold text-foreground">{label}</div>
                <div className="mt-1 text-sm font-medium text-accent">{value}</div>
                <p className="mt-2 text-sm leading-6 text-muted">{copy}</p>
              </Link>
            ))}
          </div>
          <div className="metric-grid">
            {[ ["Kens", formatNumber(metrics.proposals)], ["Running", formatNumber(metrics.activeRuns)], ["Bonded voice", formatNumber(metrics.bondedVoice)], ["Committed treasury / month", formatCurrency(metrics.treasuryMonthlyUsd)] ].map(([label, value]) => (
              <div key={label} className="metric-card"><div className="eyebrow">{label}</div><div className="metric-value">{value}</div></div>
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-5">
        <div className="section-heading">
          <div>
            <div className="eyebrow">Trending Kens</div>
            <h2 className="font-display text-3xl font-semibold text-foreground">What the board is prioritizing now</h2>
          </div>
          <Link href="/kens" className="text-sm font-semibold text-accent">Open the full feed</Link>
        </div>
        <div className="feed-list">
          {featuredTasks.slice(0, 4).map((task) => <TaskCard key={task.id} task={task} />)}
        </div>
      </section>

      <section className="section-grid" data-columns="2">
        <div className="panel space-y-5">
          <div className="eyebrow">Where Kens show up</div>
          <div className="grid gap-4">
            {categories.map((category) => (
              <Link key={category.id} href={categoryFilterHref(category.slug)} className="category-summary-card interactive-surface">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <CategorySymbol
                      categorySlug={category.slug}
                      categoryName={category.name}
                      tier="queued"
                      stage={category.runningCount > 0 ? "running" : category.shippedCount > 0 ? "shipped" : "review"}
                      variant="inline"
                    />
                    <div className="font-display text-xl font-semibold text-foreground">{category.name}</div>
                  </div>
                  <span className="tag">{category.proposalCount} Kens</span>
                </div>
                <p className="mt-2 text-sm leading-7 text-muted">{category.thesis}</p>
              </Link>
            ))}
          </div>
        </div>
        <div className="panel space-y-5">
          <div className="eyebrow">Funding snapshot</div>
          <h2 className="font-display text-3xl font-semibold text-foreground">Funding adds compute supply, not control</h2>
          <p className="text-sm leading-7 text-muted">
            KenMatch keeps ranking, checkpoints, and safety release gates separate from sponsorship. Backing can pay for compute, review, moderation, or delivery support; it cannot buy votes, hide restrictions, or override public checkpoint outcomes.
          </p>
          <div className="signal-bar">
            <div className="flow-card"><div className="eyebrow">Coverage</div><div className="metric-value">{economics.coverageMonths.toFixed(1)} mo</div></div>
            <div className="flow-card"><div className="eyebrow">Sponsor pools</div><div className="metric-value">{formatCurrency(economics.sponsorPoolsUsd)}</div></div>
            <div className="flow-card"><div className="eyebrow">Verified streams</div><div className="metric-value">{formatNumber(economics.verifiedFundingStreams)}</div></div>
          </div>
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
          <div className="eyebrow">Allocation credits</div>
          <h2 className="font-display text-3xl font-semibold text-foreground">Influence gets more expensive as it concentrates</h2>
          <p className="text-sm leading-7 text-muted">
            Quick pulse votes show broad interest. Allocation credits are scarcer: spending 1, 2, 3, or more voice on the same Ken costs quadratically, so broad support beats one person pushing a favorite. Verification can raise a contributor&apos;s cap, but it never converts money into rank.
          </p>
          <div className="signal-bar">
            <div className="flow-card"><div className="eyebrow">Issued voice</div><div className="metric-value">{formatNumber(metrics.voiceIssued)}</div></div>
            <div className="flow-card"><div className="eyebrow">Spent voice</div><div className="metric-value">{formatNumber(metrics.voiceSpent)}</div></div>
            <div className="flow-card"><div className="eyebrow">Public signal</div><div className="metric-value">{formatNumber(metrics.publicSignal)}</div></div>
          </div>
        </div>
      </section>
    </div>
  );
}

