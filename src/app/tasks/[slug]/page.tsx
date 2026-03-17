import { notFound } from "next/navigation";

import { DiscussionThread } from "@/components/discussion-thread";
import { TaskPulsePanel } from "@/components/task-pulse-panel";
import { VotePanel } from "@/components/vote-panel";
import { getTaskDetail } from "@/lib/db";
import { getViewerSession } from "@/lib/session";
import { formatCurrency, formatDate, labelForStage, labelForTier } from "@/lib/utils";

export default async function TaskDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const viewer = await getViewerSession();
  const task = await getTaskDetail(slug, viewer?.profile.id);
  if (!task) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <section className="panel card-sheen space-y-6">
        <div className="flex flex-wrap gap-3">
          <span className={`tier-chip is-${task.allocatedTier}`}>{labelForTier(task.allocatedTier)}</span>
          <span className="tag">{labelForStage(task.stage)}</span>
          <span className="tag">{task.categoryName}</span>
          <span className="tag">Pulse {task.taskPulseScore}</span>
        </div>
        <div className="space-y-4">
          <div className="eyebrow">Proposal detail</div>
          <h1 className="max-w-4xl font-display text-4xl font-semibold text-foreground sm:text-5xl">{task.title}</h1>
          <p className="max-w-4xl text-lg leading-8 text-muted">{task.summary}</p>
        </div>
        <div className="metric-grid">
          {[["Quadratic votes", String(task.totalVotes)],["Supporters", String(task.supporterCount)],["Category rank", task.categoryRank ? String(task.categoryRank) : "-"],["Budget lane", formatCurrency(task.budgetUsd)]].map(([label, value]) => (
            <div key={label} className="metric-card"><div className="eyebrow">{label}</div><div className="metric-value">{value}</div></div>
          ))}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-6">
          <div className="panel space-y-4">
            <div className="eyebrow">Why this exists</div>
            <h2 className="font-display text-2xl font-semibold text-foreground">Problem, timing, and public benefit</h2>
            <p className="text-sm leading-7 text-muted">{task.problem}</p>
            <p className="text-sm leading-7 text-muted">{task.whyNow}</p>
            <p className="text-sm leading-7 text-muted">{task.publicBenefit}</p>
          </div>
          <div className="panel grid gap-5 lg:grid-cols-2">
            <ListBlock title="Deliverables" items={task.deliverables} />
            <ListBlock title="Evaluation criteria" items={task.evaluationCriteria} />
            <ListBlock title="Risk flags" items={task.riskFlags} />
            <ListBlock title="Evidence anchors" items={task.evidence} />
          </div>
          <div className="panel grid gap-4 lg:grid-cols-2">
            <InfoCard title="Quality bond" body={`${task.qualityBondCredits} voice credits remain locked while this task is in review or otherwise unresolved.`} />
            <InfoCard title="Sponsor pool" body={`${formatCurrency(task.sponsorPoolUsd)} reserved for execution and downstream delivery.`} />
            <InfoCard title="Institutional packaging" body={task.enterprisePackaging} />
            <InfoCard title="Preference and data value" body={task.dataValueNote} />
          </div>
          <div className="panel space-y-5">
            <div>
              <div className="eyebrow">Execution lane</div>
              <h2 className="mt-2 font-display text-2xl font-semibold text-foreground">Run plan and release checkpoints</h2>
            </div>
            {task.run ? (
              <div className="grid gap-4">
                <div className="rounded-[1.3rem] border border-border bg-background/55 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="font-display text-xl font-semibold text-foreground">{task.run.backend}</div>
                    <span className="tag">{task.run.status}</span>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-muted">{task.run.reproducibilityNotes}</p>
                  <p className="mt-3 text-sm leading-7 text-muted">Rollback plan: {task.run.rollbackPlan}</p>
                </div>
                {task.checkpoints.map((checkpoint) => (
                  <div key={checkpoint.id} className="rounded-[1.3rem] border border-border bg-background/55 p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="font-display text-xl font-semibold text-foreground">{checkpoint.label}</div>
                      <span className="tag">Due {formatDate(checkpoint.dueAt)}</span>
                    </div>
                    <p className="mt-2 text-sm leading-7 text-muted">{checkpoint.detail}</p>
                    <p className="mt-2 text-sm leading-7 text-muted">Release gate: {checkpoint.approvalScore}/{checkpoint.requiredApprovals} approvals · {checkpoint.releaseStatus}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm leading-7 text-muted">No active run lane yet. The proposal remains live for debate, pulse, and quadratic support.</p>
            )}
          </div>
          <DiscussionThread taskId={task.id} slug={task.slug} comments={task.comments} disabled={!viewer} />
        </div>

        <div className="space-y-6">
          <TaskPulsePanel taskId={task.id} slug={task.slug} userPulse={task.userTaskPulse} positivePulseCount={task.positivePulseCount} negativePulseCount={task.negativePulseCount} disabled={!viewer} />
          <VotePanel taskId={task.id} slug={task.slug} initialVotes={task.userVotes} availableCredits={viewer?.profile.availableCredits ?? 0} disabled={!viewer} />
          <div className="panel space-y-4">
            <div>
              <div className="eyebrow">Financialization layer</div>
              <h2 className="mt-2 font-display text-2xl font-semibold text-ink">How this lane funds itself without selling influence</h2>
            </div>
            <div className="rounded-[1.3rem] border border-line bg-page/72 p-5">
              <div className="text-xs uppercase tracking-[0.22em] text-ink/45">Enterprise packaging path</div>
              <p className="mt-2 text-sm leading-7 text-ink/68">{task.enterprisePackaging}</p>
            </div>
            <div className="rounded-[1.3rem] border border-line bg-page/72 p-5">
              <div className="text-xs uppercase tracking-[0.22em] text-ink/45">Preference data value</div>
              <p className="mt-2 text-sm leading-7 text-ink/68">{task.dataValueNote}</p>
            </div>
          </div>
          <div className="panel space-y-4">
            <div>
              <div className="eyebrow">Vote ledger</div>
              <h2 className="mt-2 font-display text-2xl font-semibold text-foreground">Who is currently backing this</h2>
            </div>
            <div className="space-y-3">
              {task.votes.map((vote) => (
                <div key={vote.id} className="rounded-[1.2rem] border border-border bg-background/55 p-4">
                  <div className="flex items-center justify-between gap-3"><div className="font-semibold text-foreground">{vote.profileName}</div><div className="font-mono text-xs uppercase tracking-[0.22em] text-muted">{vote.voteCount} votes</div></div>
                  {vote.rationale ? <p className="mt-2 text-sm leading-6 text-muted">{vote.rationale}</p> : null}
                </div>
              ))}
            </div>
          </div>
          <div className="panel space-y-4">
            <div className="eyebrow">Governance log</div>
            {task.governanceEvents.map((event) => (
              <div key={event.id} className="rounded-[1.2rem] border border-border bg-background/55 p-4">
                <div className="text-xs uppercase tracking-[0.22em] text-muted">{event.house.replace("-", " ")} · {formatDate(event.createdAt)}</div>
                <div className="mt-2 font-semibold text-foreground">{event.title}</div>
                <p className="mt-2 text-sm leading-7 text-muted">{event.decision}</p>
                <p className="mt-2 text-sm leading-7 text-muted">Outcome: {event.outcome}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-grid" data-columns="2">
        <div className="panel space-y-4">
          <div>
            <div className="eyebrow">Governance log</div>
            <h2 className="mt-2 font-display text-2xl font-semibold text-ink">Recorded decisions for this task</h2>
          </div>
          {task.governanceEvents.length > 0 ? (
            task.governanceEvents.map((event) => (
              <div key={event.id} className="rounded-[1.3rem] border border-line bg-page/72 p-5">
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
        <div className="panel space-y-4">
          <div>
            <div className="eyebrow">Reddit / Stack Exchange layer</div>
            <h2 className="mt-2 font-display text-2xl font-semibold text-ink">Threaded discussion and quality triage</h2>
          </div>
          <DiscussionThread taskId={task.id} slug={task.slug} comments={task.comments} />
        </div>
      </section>
    </div>
  );
}

function ListBlock({ title, items }: { title: string; items: string[] }) {
  return <div className="rounded-[1.3rem] border border-border bg-background/55 p-5"><div className="font-display text-xl font-semibold text-foreground">{title}</div><ul className="mt-3 space-y-2 text-sm leading-7 text-muted">{items.map((item) => <li key={item} className="flex gap-3"><span className="mt-2 size-2 rounded-full bg-teal" /><span>{item}</span></li>)}</ul></div>;
}

function InfoCard({ title, body }: { title: string; body: string }) {
  return <div className="rounded-[1.3rem] border border-border bg-background/55 p-5"><div className="font-display text-xl font-semibold text-foreground">{title}</div><p className="mt-2 text-sm leading-7 text-muted">{body}</p></div>;
}
