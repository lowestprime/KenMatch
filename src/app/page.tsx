import Link from "next/link";

import { TaskCard } from "@/components/task-card";
import { getHomeData } from "@/lib/db";
import { getSessionProfileId } from "@/lib/session";
import { compactWords, formatNumber } from "@/lib/utils";

export default async function HomePage() {
  const activeProfileId = await getSessionProfileId();
  const { metrics, categories, featuredTasks, contributors, governance, activeProfile } = getHomeData(activeProfileId);

  return (
    <div className="space-y-12">
      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="panel hero-mesh relative overflow-hidden">
          <div className="relative space-y-6">
            <div className="eyebrow">Democratizing sustained frontier compute</div>
            <h1 className="max-w-4xl font-display text-4xl font-semibold leading-tight text-ink sm:text-5xl lg:text-6xl">
              Route month-scale agentic work by earned public value, not by who can privately buy the biggest cluster.
            </h1>
            <p className="max-w-3xl text-lg leading-8 text-ink/72">
              KenMatch turns the conception docs into a working product surface: proposals, quadratic voice, safety review,
              transparent tiering, and checkpointed execution across APIs, leased GPU fleets, and open-weight stacks.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/tasks" className="rounded-full bg-ink px-5 py-3 text-sm font-semibold text-paper transition hover:bg-teal">
                Browse ranked proposals
              </Link>
              <Link href="/submit" className="rounded-full border border-ink/12 bg-white/80 px-5 py-3 text-sm font-semibold text-ink transition hover:border-teal hover:text-teal">
                Submit a task
              </Link>
            </div>
            <div className="rounded-[1.5rem] border border-ink/10 bg-white/78 p-5 text-sm leading-7 text-ink/70">
              <div className="font-display text-lg font-semibold text-ink">Active perspective</div>
              <p className="mt-2">
                You are browsing as <span className="font-semibold text-ink">{activeProfile.name}</span>, with
                <span className="font-semibold text-ink"> {activeProfile.availableCredits}</span> free voice credits.
                Every vote spends earned, non-purchasable influence.
              </p>
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <div className="panel">
            <div className="eyebrow">Allocation protocol</div>
            <div className="mt-4 grid gap-3">
              {[
                ["Months", "Top 3 per category", "Reserved for profound, checkpoint-heavy work."],
                ["Weeks", "Next 10 per category", "Complex delivery lanes with active evaluation."],
                ["Days", "Next 100 per category", "Focused sprints for narrow but valuable outputs."],
              ].map(([label, value, copy]) => (
                <div key={label} className="rounded-[1.2rem] border border-ink/8 bg-white/70 p-4">
                  <div className="font-display text-xl font-semibold text-ink">{label}</div>
                  <div className="mt-1 text-sm font-medium text-teal">{value}</div>
                  <p className="mt-2 text-sm leading-6 text-ink/68">{copy}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="metric-grid">
            {[
              ["Proposals", formatNumber(metrics.proposals)],
              ["Eligible", formatNumber(metrics.eligible)],
              ["Active runs", formatNumber(metrics.activeRuns)],
              ["Voice spent", formatNumber(metrics.voiceSpent)],
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
          <Link href="/tasks" className="text-sm font-semibold text-teal transition hover:text-ink">
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
            <div className="eyebrow">Governance by design</div>
            <h2 className="mt-2 font-display text-3xl font-semibold text-ink">Two houses, one public ledger</h2>
          </div>
          <div className="grid gap-4">
            <div className="rounded-[1.35rem] border border-ink/8 bg-white/70 p-5">
              <div className="font-display text-xl font-semibold text-ink">House A: Safety council</div>
              <p className="mt-2 text-sm leading-7 text-ink/68">
                Screens for prohibited dual-use work, sets monitoring conditions, and records every block in a public log.
              </p>
            </div>
            <div className="rounded-[1.35rem] border border-ink/8 bg-white/70 p-5">
              <div className="font-display text-xl font-semibold text-ink">House B: Allocation chamber</div>
              <p className="mt-2 text-sm leading-7 text-ink/68">
                Uses broad, quadratic voice to rank proposals by demonstrated community value instead of financial weight.
              </p>
            </div>
          </div>
        </div>
        <div className="panel space-y-5">
          <div>
            <div className="eyebrow">Recent decisions</div>
            <h2 className="mt-2 font-display text-3xl font-semibold text-ink">Transparent governance trail</h2>
          </div>
          <div className="space-y-4">
            {governance.map((event) => (
              <div key={event.id} className="rounded-[1.35rem] border border-ink/8 bg-white/72 p-5">
                <div className="flex items-center justify-between gap-3 text-xs uppercase tracking-[0.22em] text-ink/45">
                  <span>{event.house.replace("-", " ")}</span>
                  <span>{new Date(event.createdAt).toLocaleDateString("en-US")}</span>
                </div>
                <div className="mt-3 font-display text-xl font-semibold text-ink">{event.title}</div>
                <p className="mt-2 text-sm leading-7 text-ink/68">{compactWords(event.decision, 160)}</p>
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
              <div key={category.id} className="rounded-[1.35rem] border border-ink/8 bg-white/70 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-display text-xl font-semibold text-ink">{category.name}</div>
                  <span className="rounded-full border border-ink/10 px-3 py-1 text-xs uppercase tracking-[0.22em] text-ink/55">
                    {category.proposalCount} proposals
                  </span>
                </div>
                <p className="mt-2 text-sm leading-7 text-ink/68">{category.thesis}</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-3 text-sm text-ink/62">
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
            <div className="eyebrow">Merit ledger</div>
            <h2 className="mt-2 font-display text-3xl font-semibold text-ink">Who currently has the strongest voice</h2>
          </div>
          <div className="space-y-4">
            {contributors.map((profile) => (
              <div key={profile.id} className="rounded-[1.35rem] border border-ink/8 bg-white/72 p-5">
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
    </div>
  );
}