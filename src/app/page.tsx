import type { Metadata } from "next";
import Link from "next/link";

import { Avatar } from "@/components/avatar";
import { TaskCard } from "@/components/task-card";
import { getHomeData } from "@/lib/db";
import { getViewerProfileId } from "@/lib/session";
import { formatCurrency, formatNumber } from "@/lib/utils";

export const metadata: Metadata = {
  title: "KenMatch — Community board for long-running AI projects",
  description: "Propose, vote on, and fund long-running AI projects with visible checkpoints, public discussion, and transparent economics. Browse Kens, back useful work, and join the community.",
  openGraph: { title: "KenMatch", description: "A public board where people decide which AI projects run longer." },
};

export default async function HomePage() {
  const viewerProfileId = await getViewerProfileId();
  const { metrics, categories, featuredTasks, contributors, governance, economics, revenueStreams, viewer } = await getHomeData(viewerProfileId);

  return (
    <div className="page-stack">
      <section className="hero-layout">
        <div className="panel hero-panel fade-up">
          <div className="eyebrow">Community board for helpful AI work</div>
          <h1 className="max-w-4xl font-display text-4xl font-semibold leading-tight text-foreground sm:text-5xl lg:text-6xl">
            Decide which AI projects are worth running for weeks, not just seconds.
          </h1>
          <p className="max-w-3xl text-lg leading-8 text-muted">
            KenMatch is a public board where people propose, vote on, and fund long-running AI projects. Lower your power bill, get smoke-day alerts, speed up benefit appeals, keep open-source tools safe, or give your local theater a boost — all with visible checkpoints and public discussion.
          </p>
          <div className="hero-actions">
            <Link href="/kens" className="cta-primary">Browse projects</Link>
            <Link href="/submit" className="cta-secondary">Propose a project</Link>
            <Link href="/economics" className="cta-secondary">{"See how it's funded"}</Link>
          </div>
          <div className="hero-note">
            {viewer ? (
              <p>
                Signed in as <span className="font-semibold text-foreground">{viewer.name}</span> with <span className="font-semibold text-foreground">{viewer.availableCredits}</span> free priority credits.
              </p>
            ) : (
              <p>Everything is readable without an account. Sign in to vote, comment, back a project, or propose one.</p>
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
            <div className="eyebrow">Trending now</div>
            <h2 className="font-display text-3xl font-semibold text-foreground">Projects people are backing right now</h2>
          </div>
          <Link href="/kens" className="text-sm font-semibold text-teal">See all projects</Link>
        </div>
        <div className="feed-list">
          {featuredTasks.map((task) => <TaskCard key={task.id} task={task} />)}
        </div>
      </section>

      <section className="section-grid" data-columns="2">
        <div className="panel space-y-5">
          <div className="eyebrow">Categories</div>
          <div className="grid gap-4">
            {categories.map((category) => (
              <Link key={category.id} href={`/kens?category=${category.slug}`} className="block rounded-[1.3rem] border border-border bg-background/55 p-5 transition hover:border-teal/30">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-display text-xl font-semibold text-foreground">{category.name}</div>
                  <span className="tag">{category.proposalCount} Kens</span>
                </div>
                <p className="mt-2 text-sm leading-7 text-muted">{category.thesis}</p>
              </Link>
            ))}
          </div>
        </div>
        <div className="panel space-y-5">
          <div className="eyebrow">{"How it's funded"}</div>
          <h2 className="font-display text-3xl font-semibold text-foreground">Money funds compute, not influence</h2>
          <p className="text-sm leading-7 text-muted">
            A Ken can attract backing, sandbox demonstrations, and hosted service revenue without turning rank into a purchasable privilege. Treasury reporting stays visible so people can see where support comes from and where compute is going.
          </p>
          <div className="signal-bar">
            <div className="flow-card"><div className="eyebrow">Coverage</div><div className="metric-value">{economics.coverageMonths.toFixed(1)} mo</div></div>
            <div className="flow-card"><div className="eyebrow">Sponsor pools</div><div className="metric-value">{formatCurrency(economics.sponsorPoolsUsd)}</div></div>
            <div className="flow-card"><div className="eyebrow">Verified streams</div><div className="metric-value">{formatNumber(economics.verifiedFundingStreams)}</div></div>
            <div className="flow-card">
              <div className="eyebrow">Treasury policy</div>
              <span className={`governor-badge ${economics.governorActive ? "is-active" : "is-healthy"}`}>
                {economics.governorActive ? "Governor active" : "Coverage healthy"}
              </span>
            </div>
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
          <div className="eyebrow">Recent decisions</div>
          {governance.map((event) => (
            <div key={event.id} className="rounded-[1.3rem] border border-border bg-background/55 p-4">
              <div className="text-xs uppercase tracking-[0.22em] text-muted">{event.house.replace("-", " ")}</div>
              <div className="mt-2 font-display text-xl font-semibold text-foreground">{event.title}</div>
              <p className="mt-2 text-sm leading-7 text-muted">{event.decision}</p>
            </div>
          ))}
        </div>
        <div className="panel space-y-4">
          <div className="eyebrow">Active contributors</div>
          {contributors.map((profile) => (
            <Link key={profile.id} href={`/profiles/${profile.id}`} className="block rounded-[1.3rem] border border-border bg-background/55 p-4 transition hover:border-teal/30">
              <div className="flex items-center gap-3">
                <Avatar name={profile.name} hue={profile.avatarHue} size={36} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-display text-xl font-semibold text-foreground">{profile.name}</div>
                    <span className="tag">{profile.attestationLevel}</span>
                  </div>
                  <div className="text-sm text-muted">{profile.role} · {profile.specialty}</div>
                </div>
              </div>
              <p className="mt-2 text-sm leading-7 text-muted line-clamp-3">{profile.attestationNote}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

