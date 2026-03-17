import { notFound } from "next/navigation";

import { VotePanel } from "@/components/vote-panel";
import { getHomeData, getTaskDetail } from "@/lib/db";
import { getSessionProfileId } from "@/lib/session";
import { formatCurrency, formatDate, labelForStage, labelForTier } from "@/lib/utils";

interface TaskDetailPageProps {
  params: Promise<{ slug: string }>;
}

export default async function TaskDetailPage({ params }: TaskDetailPageProps) {
  const { slug } = await params;
  const activeProfileId = await getSessionProfileId();
  const task = getTaskDetail(slug, activeProfileId);
  if (!task) {
    notFound();
  }

  const { activeProfile } = getHomeData(activeProfileId);

  return (
    <div className="space-y-8">
      <section className="panel space-y-6">
        <div className="flex flex-wrap gap-3">
          <span className="rounded-full bg-ink px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-paper">
            {labelForTier(task.allocatedTier)}
          </span>
          <span className="rounded-full border border-ink/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-ink/62">
            {labelForStage(task.stage)}
          </span>
          <span className="rounded-full border border-ink/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-ink/62">
            {task.categoryName}
          </span>
        </div>
        <div className="space-y-4">
          <div className="eyebrow">Proposal detail</div>
          <h1 className="max-w-4xl font-display text-4xl font-semibold text-ink sm:text-5xl">{task.title}</h1>
          <p className="max-w-4xl text-lg leading-8 text-ink/72">{task.summary}</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ["Quadratic votes", String(task.totalVotes)],
            ["Supporters", String(task.supporterCount)],
            ["Category rank", task.categoryRank ? String(task.categoryRank) : "-"],
            ["Budget", formatCurrency(task.budgetUsd)],
          ].map(([label, value]) => (
            <div key={label} className="rounded-[1.3rem] border border-ink/8 bg-white/70 p-5">
              <div className="text-xs uppercase tracking-[0.22em] text-ink/45">{label}</div>
              <div className="mt-2 font-display text-3xl font-semibold text-ink">{value}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          <div className="panel space-y-4">
            <div className="eyebrow">Why this exists</div>
            <h2 className="font-display text-2xl font-semibold text-ink">Problem and public benefit</h2>
            <p className="text-sm leading-7 text-ink/72">{task.problem}</p>
            <p className="text-sm leading-7 text-ink/72">{task.whyNow}</p>
            <p className="text-sm leading-7 text-ink/72">{task.publicBenefit}</p>
          </div>
          <div className="panel grid gap-5 lg:grid-cols-2">
            <ListBlock title="Deliverables" items={task.deliverables} />
            <ListBlock title="Evaluation criteria" items={task.evaluationCriteria} />
            <ListBlock title="Risk flags" items={task.riskFlags} />
            <ListBlock title="Evidence anchors" items={task.evidence} />
          </div>
          <div className="panel space-y-5">
            <div>
              <div className="eyebrow">Execution lane</div>
              <h2 className="mt-2 font-display text-2xl font-semibold text-ink">Run plan and checkpoints</h2>
            </div>
            {task.run ? (
              <div className="grid gap-4">
                <div className="rounded-[1.3rem] border border-ink/8 bg-white/72 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="font-display text-xl font-semibold text-ink">{task.run.backend}</div>
                    <span className="rounded-full border border-ink/10 px-3 py-1 text-xs uppercase tracking-[0.22em] text-ink/55">
                      {task.run.status}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-ink/68">{task.run.reproducibilityNotes}</p>
                  <p className="mt-3 text-sm leading-7 text-ink/68">Rollback plan: {task.run.rollbackPlan}</p>
                </div>
                <div className="space-y-3">
                  {task.checkpoints.map((checkpoint) => (
                    <div key={checkpoint.id} className="rounded-[1.3rem] border border-ink/8 bg-white/72 p-5">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="font-display text-xl font-semibold text-ink">{checkpoint.label}</div>
                        <span className="text-xs uppercase tracking-[0.22em] text-ink/45">Due {formatDate(checkpoint.dueAt)}</span>
                      </div>
                      <p className="mt-2 text-sm leading-7 text-ink/68">{checkpoint.detail}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm leading-7 text-ink/68">This proposal is not in an active run lane yet. It remains visible for debate and vote accumulation.</p>
            )}
          </div>
          <div className="panel space-y-4">
            <div>
              <div className="eyebrow">Governance log</div>
              <h2 className="mt-2 font-display text-2xl font-semibold text-ink">Recorded decisions for this task</h2>
            </div>
            {task.governanceEvents.length > 0 ? (
              task.governanceEvents.map((event) => (
                <div key={event.id} className="rounded-[1.3rem] border border-ink/8 bg-white/72 p-5">
                  <div className="flex items-center justify-between gap-3 text-xs uppercase tracking-[0.22em] text-ink/45">
                    <span>{event.house.replace("-", " ")}</span>
                    <span>{formatDate(event.createdAt)}</span>
                  </div>
                  <div className="mt-3 font-display text-xl font-semibold text-ink">{event.title}</div>
                  <p className="mt-2 text-sm leading-7 text-ink/68">{event.decision}</p>
                  <p className="mt-2 text-sm leading-7 text-ink/68">Outcome: {event.outcome}</p>
                </div>
              ))
            ) : (
              <p className="text-sm leading-7 text-ink/68">No governance actions have been logged beyond the default state.</p>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <VotePanel
            taskId={task.id}
            slug={task.slug}
            initialVotes={task.userVotes}
            availableCredits={activeProfile.availableCredits}
          />
          <div className="panel space-y-4">
            <div>
              <div className="eyebrow">Vote ledger</div>
              <h2 className="mt-2 font-display text-2xl font-semibold text-ink">Who is currently backing this</h2>
            </div>
            <div className="space-y-3">
              {task.votes.map((vote) => (
                <div key={vote.id} className="rounded-[1.2rem] border border-ink/8 bg-white/72 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-semibold text-ink">{vote.profileName}</div>
                    <div className="font-mono text-xs uppercase tracking-[0.22em] text-ink/45">{vote.voteCount} votes</div>
                  </div>
                  {vote.rationale ? <p className="mt-2 text-sm leading-6 text-ink/68">{vote.rationale}</p> : null}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function ListBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-[1.3rem] border border-ink/8 bg-white/72 p-5">
      <div className="font-display text-xl font-semibold text-ink">{title}</div>
      <ul className="mt-3 space-y-2 text-sm leading-7 text-ink/68">
        {items.map((item) => (
          <li key={item} className="flex gap-3">
            <span className="mt-2 size-2 rounded-full bg-teal" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
