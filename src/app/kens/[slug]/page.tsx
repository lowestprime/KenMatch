import type { Metadata } from "next";
import { notFound } from "next/navigation";

import Link from "next/link";

import { BookmarkButton } from "@/components/bookmark-button";
import { DiscussionThread } from "@/components/discussion-thread";
import { KenSandboxStrip } from "@/components/ken-sandbox-strip";
import { KenTimingStrip } from "@/components/ken-timing-strip";
import { ShareButton } from "@/components/share-button";
import { TaskPulsePanel } from "@/components/task-pulse-panel";
import { VotePanel } from "@/components/vote-panel";
import { getBookmarkedTaskIds, getTaskDetail } from "@/lib/db";
import { getViewerSession } from "@/lib/session";
import { formatCurrency, formatDateTime, formatHoursToHuman, labelForStage, labelForTier } from "@/lib/utils";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const task = await getTaskDetail(slug, null);
  if (!task) return { title: "Ken not found" };
  return {
    title: task.title,
    description: task.summary,
    openGraph: { title: task.title, description: task.summary },
  };
}

export default async function KenDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const viewer = await getViewerSession();
  const viewerProfile = viewer?.profile ?? null;
  const publicParticipationMessage = viewerProfile?.participationNote ?? "Sign in to take part in public voting and discussion.";
  const [task, bookmarkedIds] = await Promise.all([
    getTaskDetail(slug, viewerProfile?.id),
    viewerProfile ? getBookmarkedTaskIds(viewerProfile.id) : Promise.resolve([]),
  ]);
  if (!task) {
    notFound();
  }

  return (
    <div className="page-stack">
      <section className="panel hero-panel card-sheen space-y-6">
        <div className="flex flex-wrap gap-3">
          <span className={`tier-chip is-${task.allocatedTier}`}>{labelForTier(task.allocatedTier)}</span>
          <span className="tag">{labelForStage(task.stage)}</span>
          <span className="tag">{task.categoryName}</span>
          <span className="tag">Pulse {task.taskPulseScore > 0 ? `+${task.taskPulseScore}` : task.taskPulseScore}</span>
        </div>
        <div className="space-y-4">
          <div className="eyebrow">Ken thread</div>
          <h1 className="max-w-4xl font-display text-4xl font-semibold text-foreground sm:text-5xl">{task.title}</h1>
          <p className="max-w-4xl text-lg leading-8 text-muted">{task.summary}</p>
        </div>
        <div className="detail-meta-row">
          <span className="micro-pill">Created {formatDateTime(task.createdAt)}</span>
          <span className="micro-pill">Last activity {formatDateTime(task.lastActivityAt)}</span>
          <Link href={`/profiles/${task.proposerId}`} className="micro-pill micro-pill-link">Proposed by {task.proposerName}</Link>
          <ShareButton title={task.title} slug={task.slug} />
          <BookmarkButton taskId={task.id} bookmarked={bookmarkedIds.includes(task.id)} disabled={!viewerProfile} />
        </div>
        <KenTimingStrip ken={task} />
        <div className="metric-grid">
          {[ ["Voice", String(task.totalVotes)], ["Backers", String(task.supporterCount)], ["Comments", String(task.discussionCount)], ["Sandbox backing", formatCurrency(task.sandboxCapitalUsd)] ].map(([label, value]) => (
            <div key={label} className="metric-card"><div className="eyebrow">{label}</div><div className="metric-value">{value}</div></div>
          ))}
        </div>
      </section>

      <section className="detail-layout">
        <div className="space-y-6">
          <KenSandboxStrip ken={task} />

          <div className="panel space-y-4">
            <div className="eyebrow">Why this Ken matters</div>
            <h2 className="font-display text-2xl font-semibold text-foreground">Problem, timing, and public usefulness</h2>
            <p className="text-sm leading-7 text-muted">{task.problem}</p>
            <p className="text-sm leading-7 text-muted">{task.whyNow}</p>
            <p className="text-sm leading-7 text-muted">{task.publicBenefit}</p>
          </div>

          <div className="panel grid gap-5 lg:grid-cols-2">
            <ListBlock title="Deliverables" items={task.deliverables} />
            <ListBlock title="Evaluation checks" items={task.evaluationCriteria} />
            <ListBlock title="Risks and constraints" items={task.riskFlags} />
            <ListBlock title="Evidence anchors" items={task.evidence} />
          </div>

          <div className="panel grid gap-4 lg:grid-cols-2">
            <InfoCard title="Bond held during review" body={`${task.qualityBondCredits} voice credits remain locked while this Ken is unresolved or still in review.`} />
            <InfoCard title="Sponsor pool" body={`${formatCurrency(task.sponsorPoolUsd)} is currently reserved for this Ken's delivery path.`} />
            <InfoCard title="Service version" body={task.enterprisePackaging} />
            <InfoCard title="Correction and audit value" body={task.dataValueNote} />
          </div>

          <div className="panel space-y-5">
            <div>
              <div className="eyebrow">Run plan</div>
              <h2 className="mt-2 font-display text-2xl font-semibold text-foreground">Launch window, compute cap, and checkpoints</h2>
            </div>
            {task.run ? (
              <div className="grid gap-4">
                <div className="rounded-[1.3rem] border border-border bg-background/55 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="font-display text-xl font-semibold text-foreground">{task.run.backend}</div>
                    <span className="tag">{task.run.status}</span>
                  </div>
                  <div className="mt-3 grid gap-3 text-sm text-muted md:grid-cols-3">
                    <div className="stat-card"><span>Runtime cap</span><strong>{formatHoursToHuman(task.run.runtimeHours)}</strong></div>
                    <div className="stat-card"><span>Checkpoint cadence</span><strong>{formatHoursToHuman(task.run.checkpointCadenceHours)}</strong></div>
                    <div className="stat-card"><span>Run budget</span><strong>{formatCurrency(task.run.budgetUsd)}</strong></div>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-muted">{task.run.reproducibilityNotes}</p>
                  <p className="mt-3 text-sm leading-7 text-muted">Rollback plan: {task.run.rollbackPlan}</p>
                </div>
                {task.checkpoints.map((checkpoint) => (
                  <div key={checkpoint.id} className="rounded-[1.3rem] border border-border bg-background/55 p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="font-display text-xl font-semibold text-foreground">{checkpoint.label}</div>
                      <span className="tag">Due {formatDateTime(checkpoint.dueAt)}</span>
                    </div>
                    <p className="mt-2 text-sm leading-7 text-muted">{checkpoint.detail}</p>
                    <p className="mt-2 text-sm leading-7 text-muted">Release gate: {checkpoint.approvalScore}/{checkpoint.requiredApprovals} approvals · {checkpoint.releaseStatus}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm leading-7 text-muted">This Ken is still building public signal and review history before a run lane opens.</p>
            )}
          </div>

          <div className="panel space-y-5">
            <div>
              <div className="eyebrow">Run audit</div>
              <h2 className="mt-2 font-display text-2xl font-semibold text-foreground">Incremental deliverables and checkpoints reached along the way</h2>
            </div>
            {task.runUpdates.length > 0 ? (
              <div className="space-y-4">
                {task.runUpdates.map((update) => (
                  <div key={update.id} className="audit-card">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="font-display text-xl font-semibold text-foreground">{update.label}</div>
                        <div className="text-xs uppercase tracking-[0.22em] text-muted">{formatDateTime(update.createdAt)}</div>
                      </div>
                      <span className="tag">{update.status}</span>
                    </div>
                    <p className="mt-3 text-sm leading-7 text-muted">{update.summary}</p>
                    <div className="mt-3 grid gap-3 text-sm text-muted md:grid-cols-2">
                      <div className="stat-card"><span>Artifact</span><strong>{update.artifact}</strong></div>
                      <div className="stat-card"><span>Evidence note</span><strong>{update.evidenceNote}</strong></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm leading-7 text-muted">No incremental updates have been logged yet.</p>
            )}
          </div>

          <DiscussionThread
            taskId={task.id}
            slug={task.slug}
            comments={task.comments}
            disabled={!viewerProfile?.canComment}
            disabledMessage={publicParticipationMessage}
          />
        </div>

        <div className="space-y-6">
          <TaskPulsePanel
            taskId={task.id}
            slug={task.slug}
            userPulse={task.userTaskPulse}
            positivePulseCount={task.positivePulseCount}
            negativePulseCount={task.negativePulseCount}
            disabled={!viewerProfile?.canPulse}
            disabledMessage={publicParticipationMessage}
          />
          <VotePanel
            taskId={task.id}
            slug={task.slug}
            initialVotes={task.userVotes}
            availableCredits={viewerProfile?.availableCredits ?? 0}
            totalCredits={viewerProfile?.effectiveVoiceCredits ?? 0}
            disabled={!viewerProfile?.canAllocateVoice}
            disabledMessage={publicParticipationMessage}
          />

          <div className="panel space-y-4">
            <div>
              <div className="eyebrow">Current state</div>
              <h2 className="mt-2 font-display text-2xl font-semibold text-foreground">How this Ken is progressing right now</h2>
            </div>
            <div className="grid gap-3 text-sm text-muted">
              <div className="stat-card"><span>Completion state</span><strong>{task.completionSummary}</strong></div>
              <div className="stat-card"><span>Compute used</span><strong>{formatHoursToHuman(task.computeHoursUsed)}</strong></div>
              <div className="stat-card"><span>Latest audit note</span><strong>{task.latestUpdateLabel ?? "No logged update yet"}</strong></div>
            </div>
          </div>

          <div className="panel space-y-4">
            <div>
              <div className="eyebrow">Priority backing</div>
              <h2 className="mt-2 font-display text-2xl font-semibold text-foreground">Who is spending voice here</h2>
            </div>
            <div className="space-y-3">
              {task.votes.length > 0 ? task.votes.map((vote) => (
                <div key={vote.id} className="rounded-[1.2rem] border border-border bg-background/55 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-semibold text-foreground">{vote.profileName}</div>
                    <div className="font-mono text-xs uppercase tracking-[0.22em] text-muted">{vote.voteCount} voice</div>
                  </div>
                  {vote.rationale ? <p className="mt-2 text-sm leading-6 text-muted">{vote.rationale}</p> : null}
                </div>
              )) : <p className="text-sm text-muted">No voice has been allocated yet.</p>}
            </div>
          </div>

          <div className="panel space-y-4">
            <div>
              <div className="eyebrow">Governance log</div>
              <h2 className="mt-2 font-display text-2xl font-semibold text-foreground">Recorded reviews and boundary decisions</h2>
            </div>
            {task.governanceEvents.length > 0 ? task.governanceEvents.map((event) => (
              <div key={event.id} className="rounded-[1.2rem] border border-border bg-background/55 p-4">
                <div className="text-xs uppercase tracking-[0.22em] text-muted">{event.house.replace("-", " ")} · {formatDateTime(event.createdAt)}</div>
                <div className="mt-2 font-semibold text-foreground">{event.title}</div>
                <p className="mt-2 text-sm leading-7 text-muted">{event.decision}</p>
                <p className="mt-2 text-sm leading-7 text-muted">Outcome: {event.outcome}</p>
              </div>
            )) : <p className="text-sm text-muted">No governance actions have been recorded yet.</p>}
          </div>
        </div>
      </section>
    </div>
  );
}

function ListBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-[1.3rem] border border-border bg-background/55 p-5">
      <div className="font-display text-xl font-semibold text-foreground">{title}</div>
      <ul className="mt-3 space-y-2 text-sm leading-7 text-muted">
        {items.map((item, index) => (
          <li key={`${index}-${item}`} className="flex gap-3"><span className="mt-2 size-2 rounded-full bg-teal" /><span>{item}</span></li>
        ))}
      </ul>
    </div>
  );
}

function InfoCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-[1.3rem] border border-border bg-background/55 p-5">
      <div className="font-display text-xl font-semibold text-foreground">{title}</div>
      <p className="mt-2 text-sm leading-7 text-muted">{body}</p>
    </div>
  );
}
