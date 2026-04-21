import Link from "next/link";

import { TaskCard } from "@/components/task-card";
import { getHomeData } from "@/lib/db";
import { getViewerProfileId } from "@/lib/session";
import { formatCurrency, formatNumber } from "@/lib/utils";

export default async function HomePage() {
  const viewerProfileId = await getViewerProfileId();
  const { metrics, categories, featuredTasks, contributors, governance, economics, revenueStreams, viewer } = await getHomeData(viewerProfileId);

  return (
    <div className="page-stack">
      <aside className="panel sandbox-banner" role="note" aria-label="Sandbox demo disclosure">
        <span className="eyebrow">Public sandbox</span>
        <p>
          <strong>This is a public demonstration of KenMatch.</strong> All dollar figures, sponsorship totals, pilot-user counts, and frontier AI result samples are <strong>simulated</strong> hypothetical outputs from consumer-grade deep research — not real investments, vendor commitments, or delivered production work.
        </p>
      </aside>
      <section className="hero-layout">
        <div className="panel hero-panel fade-up">
          <div className="eyebrow">Community board for helpful AI work</div>
          <h1 className="max-w-4xl font-display text-4xl font-semibold leading-tight text-foreground sm:text-5xl lg:text-6xl">
            Vote on the Kens worth running longer than one quick prompt.
          </h1>
          <p className="max-w-3xl text-lg leading-8 text-muted">
            KenMatch is a public board for work that needs more than one shot: lowering power bills, making smoke days easier to navigate, helping people appeal denied benefits, keeping open tools safer, and giving schools or archives better starter tools.
          </p>
          <div className="hero-actions">
            <Link href="/kens" className="cta-primary">Browse Kens</Link>
            <Link href="/submit" className="cta-secondary">Submit a Ken</Link>
            <Link href="/economics" className="cta-secondary">See backing</Link>
          </div>
          <div className="hero-note">
            {viewer ? (
              <p>
                Signed in as <span className="font-semibold text-foreground">{viewer.name}</span> with <span className="font-semibold text-foreground">{viewer.availableCredits}</span> free priority credits.
              </p>
            ) : (
              <p>Reading is open. Accounts are only required for voting, comments, and submitting a Ken.</p>
            )}
          </div>
        </div>
        <div className="space-y-4 fade-up stagger-1">
          <div className="panel space-y-4">
            <div className="eyebrow">How long a Ken can run</div>
            {[ ["Months", "Top 3 per category", "Long-running Kens with repeated human checkpoints and bigger public stakes."], ["Weeks", "Next 10 per category", "Multi-step Kens that need continuity, not just a single burst."], ["Days", "Next 100 per category", "Fast, focused Kens with a concrete public or community-facing output."] ].map(([label, value, copy]) => (
              <div key={label} className="rounded-[1.25rem] border border-border bg-background/55 p-4">
                <div className="font-display text-xl font-semibold text-foreground">{label}</div>
                <div className="mt-1 text-sm font-medium text-teal">{value}</div>
                <p className="mt-2 text-sm leading-6 text-muted">{copy}</p>
              </div>
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
            <h2 className="font-display text-3xl font-semibold text-foreground">What people are backing right now</h2>
          </div>
          <Link href="/kens" className="text-sm font-semibold text-teal">Open the full feed</Link>
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
              <div key={category.id} className="rounded-[1.3rem] border border-border bg-background/55 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-display text-xl font-semibold text-foreground">{category.name}</div>
                  <span className="tag">{category.proposalCount} Kens</span>
                </div>
                <p className="mt-2 text-sm leading-7 text-muted">{category.thesis}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="panel space-y-5">
          <div className="eyebrow">Funding snapshot</div>
          <h2 className="font-display text-3xl font-semibold text-foreground">Backers can add supply, but they cannot buy rank</h2>
          <p className="text-sm leading-7 text-muted">
            A Ken can attract backing, sandbox demonstrations, and hosted service revenue without turning rank into a purchasable privilege. Treasury reporting stays visible so people can see where support comes from and where compute is going.
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
          <div className="eyebrow">People on the board</div>
          {contributors.map((profile) => (
            <div key={profile.id} className="rounded-[1.3rem] border border-border bg-background/55 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="font-display text-xl font-semibold text-foreground">{profile.name}</div>
                  <div className="text-sm text-muted">{profile.role} · {profile.specialty}</div>
                </div>
                <span className="tag">{profile.attestationLevel}</span>
              </div>
              <p className="mt-2 text-sm leading-7 text-muted">{profile.attestationNote}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

