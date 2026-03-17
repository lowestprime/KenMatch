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
<<<<<<< HEAD
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
=======
          <span className="rounded-full bg-ink px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-page">
            {labelForTier(task.allocatedTier)}
          </span>
          <span className="rounded-full border border-line px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-ink/62">
            {labelForStage(task.stage)}
          </span>
          <span className="rounded-full border border-line px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-ink/62">
            {task.categoryName}
          </span>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] ${task.bondStatus === "secure" ? "bg-accent text-white" : "bg-amber-100 text-amber-900"}`}>
            bond {task.bondStatus}
          </span>
        </div>
        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-4">
            <div className="eyebrow">Proposal detail</div>
            <h1 className="max-w-4xl font-display text-4xl font-semibold text-ink sm:text-5xl">{task.title}</h1>
            <p className="max-w-4xl text-lg leading-8 text-ink/72">{task.summary}</p>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[
                ["Quadratic votes", String(task.totalVotes)],
                ["Public signal", task.taskPulseScore > 0 ? `+${task.taskPulseScore}` : String(task.taskPulseScore)],
                ["Sponsor pool", formatCurrency(task.sponsorPoolUsd)],
                ["Quality bond", String(task.qualityBondCredits)],
              ].map(([label, value]) => (
                <div key={label} className="rounded-[1.3rem] border border-line bg-page/72 p-5">
                  <div className="text-xs uppercase tracking-[0.22em] text-ink/45">{label}</div>
                  <div className="mt-2 font-display text-3xl font-semibold text-ink">{value}</div>
                </div>
              ))}
            </div>
          </div>
          <TaskPulsePanel
            taskId={task.id}
            slug={task.slug}
            initialValue={task.userTaskPulse}
            score={task.taskPulseScore}
            upvotes={task.positivePulseCount}
            downvotes={task.negativePulseCount}
          />
>>>>>>> origin/main
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-6">
          <div className="panel space-y-4">
            <div className="eyebrow">Why this exists</div>
<<<<<<< HEAD
            <h2 className="font-display text-2xl font-semibold text-foreground">Problem, timing, and public benefit</h2>
            <p className="text-sm leading-7 text-muted">{task.problem}</p>
            <p className="text-sm leading-7 text-muted">{task.whyNow}</p>
            <p className="text-sm leading-7 text-muted">{task.publicBenefit}</p>
=======
            <h2 className="font-display text-2xl font-semibold text-ink">Problem framing and public upside</h2>
            <p className="text-sm leading-7 text-ink/72">{task.problem}</p>
            <p className="text-sm leading-7 text-ink/72">{task.whyNow}</p>
            <p className="text-sm leading-7 text-ink/72">{task.publicBenefit}</p>
>>>>>>> origin/main
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
<<<<<<< HEAD
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
=======
              <h2 className="mt-2 font-display text-2xl font-semibold text-ink">Run plan and checkpoint release gates</h2>
            </div>
            {task.run ? (
              <div className="grid gap-4">
                <div className="rounded-[1.3rem] border border-line bg-page/72 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="font-display text-xl font-semibold text-ink">{task.run.backend}</div>
                    <span className="rounded-full border border-line px-3 py-1 text-xs uppercase tracking-[0.22em] text-ink/55">
                      {task.run.status}
                    </span>
                  </div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-3">
                    <Metric label="Budget" value={formatCurrency(task.run.budgetUsd)} />
                    <Metric label="Runtime" value={`${task.run.runtimeHours}h`} />
                    <Metric label="Cadence" value={`${task.run.checkpointCadenceHours}h`} />
                  </div>
                  <p className="mt-4 text-sm leading-7 text-ink/68">{task.run.reproducibilityNotes}</p>
                  <p className="mt-3 text-sm leading-7 text-ink/68">Rollback plan: {task.run.rollbackPlan}</p>
                </div>
                <div className="space-y-3">
                  {task.checkpoints.map((checkpoint) => (
                    <div key={checkpoint.id} className="rounded-[1.3rem] border border-line bg-page/72 p-5">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <div className="font-display text-xl font-semibold text-ink">{checkpoint.label}</div>
                          <div className="mt-1 text-xs uppercase tracking-[0.18em] text-ink/45">Due {formatDate(checkpoint.dueAt)} · {checkpoint.status}</div>
                        </div>
                        <span className={`rounded-full px-3 py-1 text-xs uppercase tracking-[0.22em] ${checkpoint.releaseStatus === "approved" ? "bg-accent text-white" : checkpoint.releaseStatus === "held" ? "bg-amber-100 text-amber-900" : "border border-line text-ink/60"}`}>
                          {checkpoint.releaseStatus}
                        </span>
                      </div>
                      <p className="mt-3 text-sm leading-7 text-ink/68">{checkpoint.detail}</p>
                      <div className="mt-3 text-xs uppercase tracking-[0.18em] text-ink/45">
                        Community checkpoint approvals {checkpoint.approvalScore} / {checkpoint.requiredApprovals || task.checkpointApprovalTarget}
                      </div>
>>>>>>> origin/main
                    </div>
                    <p className="mt-2 text-sm leading-7 text-muted">{checkpoint.detail}</p>
                    <p className="mt-2 text-sm leading-7 text-muted">Release gate: {checkpoint.approvalScore}/{checkpoint.requiredApprovals} approvals · {checkpoint.releaseStatus}</p>
                  </div>
                ))}
              </div>
            ) : (
<<<<<<< HEAD
              <p className="text-sm leading-7 text-muted">No active run lane yet. The proposal remains live for debate, pulse, and quadratic support.</p>
=======
              <p className="text-sm leading-7 text-ink/68">This proposal is not in an active run lane yet. It remains open for debate, pulse ranking, and allocation accumulation.</p>
>>>>>>> origin/main
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
<<<<<<< HEAD
              <h2 className="mt-2 font-display text-2xl font-semibold text-foreground">Who is currently backing this</h2>
            </div>
            <div className="space-y-3">
              {task.votes.map((vote) => (
                <div key={vote.id} className="rounded-[1.2rem] border border-border bg-background/55 p-4">
                  <div className="flex items-center justify-between gap-3"><div className="font-semibold text-foreground">{vote.profileName}</div><div className="font-mono text-xs uppercase tracking-[0.22em] text-muted">{vote.voteCount} votes</div></div>
                  {vote.rationale ? <p className="mt-2 text-sm leading-6 text-muted">{vote.rationale}</p> : null}
=======
              <h2 className="mt-2 font-display text-2xl font-semibold text-ink">Who is backing allocation right now</h2>
            </div>
            <div className="space-y-3">
              {task.votes.map((vote) => (
                <div key={vote.id} className="rounded-[1.2rem] border border-line bg-page/72 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-semibold text-ink">{vote.profileName}</div>
                    <div className="font-mono text-xs uppercase tracking-[0.22em] text-ink/45">{vote.voteCount} votes</div>
                  </div>
                  {vote.rationale ? <p className="mt-2 text-sm leading-6 text-ink/68">{vote.rationale}</p> : null}
>>>>>>> origin/main
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
<<<<<<< HEAD
  return <div className="rounded-[1.3rem] border border-border bg-background/55 p-5"><div className="font-display text-xl font-semibold text-foreground">{title}</div><ul className="mt-3 space-y-2 text-sm leading-7 text-muted">{items.map((item) => <li key={item} className="flex gap-3"><span className="mt-2 size-2 rounded-full bg-teal" /><span>{item}</span></li>)}</ul></div>;
}

function InfoCard({ title, body }: { title: string; body: string }) {
  return <div className="rounded-[1.3rem] border border-border bg-background/55 p-5"><div className="font-display text-xl font-semibold text-foreground">{title}</div><p className="mt-2 text-sm leading-7 text-muted">{body}</p></div>;
=======
  return (
    <div className="rounded-[1.3rem] border border-line bg-page/72 p-5">
      <div className="font-display text-xl font-semibold text-ink">{title}</div>
      <ul className="mt-3 space-y-2 text-sm leading-7 text-ink/68">
        {items.map((item) => (
          <li key={item} className="flex gap-3">
            <span className="mt-2 size-2 rounded-full bg-accent" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
>>>>>>> origin/main
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-[0.18em] text-ink/45">{label}</div>
      <div className="mt-1 font-display text-2xl font-semibold text-ink">{value}</div>
    </div>
  );
}
