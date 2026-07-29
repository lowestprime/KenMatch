import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CategoryFilterChip, LaneFilterChip } from "@/components/filter-chip-link";
import { DiscussionThread } from "@/components/discussion-thread";
import { JsonLd } from "@/components/json-ld";
import { KenBookmarkButton } from "@/components/ken-bookmark-button";
import { KenLifecycleMap } from "@/components/ken-lifecycle-map";
import { KenVisual } from "@/components/ken-visual";
import { KenSandboxStrip } from "@/components/ken-sandbox-strip";
import { KenTimingStrip } from "@/components/ken-timing-strip";
import { TaskPulsePanel } from "@/components/task-pulse-panel";
import { VotePanel } from "@/components/vote-panel";
import { getPublicKenSeoRecord, getTaskDetail } from "@/lib/db";
import {
  breadcrumbJsonLd,
  buildPrivateMetadata,
  buildPublicMetadata,
  canonicalUrl,
  seoDescription,
} from "@/lib/seo";
import { getViewerSession } from "@/lib/session";
import { formatCurrency, formatDateTime, formatHoursToHuman, labelForStage } from "@/lib/utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const ken = await getPublicKenSeoRecord(slug);
  if (!ken) {
    return buildPrivateMetadata(
      "Ken unavailable",
      "This Ken is not public, does not exist, or remains in private intake review.",
    );
  }
  return buildPublicMetadata({
    title: ken.title,
    description: seoDescription(ken.summary),
    path: `/kens/${encodeURIComponent(ken.slug)}`,
    type: "article",
    imageAlt: `${ken.title}, a ${ken.categoryName} Ken on KenMatch`,
  });
}

export default async function KenDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const viewer = await getViewerSession();
  const viewerProfile = viewer?.profile ?? null;
  const publicParticipationMessage = viewerProfile?.participationNote ?? "Sign in to take part in public voting and discussion.";
  const task = await getTaskDetail(slug, viewerProfile?.id);
  if (!task) {
    notFound();
  }
  const intakeBlocked = Boolean(task.intakeReview && !task.intakeReview.canParticipate);
  const participationMessage = intakeBlocked
    ? `This Ken is ${task.intakeReview?.submission.intakeStatus.replaceAll("-", " ")} in intake and cannot receive public participation yet.`
    : publicParticipationMessage;
  const isPublicKen = !task.intakeReview || task.intakeReview.submission.intakeStatus === "approved";
  const kenUrl = canonicalUrl(`/kens/${encodeURIComponent(task.slug)}`);
  const structuredData = isPublicKen
    ? [
        breadcrumbJsonLd([
          { name: "KenMatch", path: "/" },
          { name: "Kens", path: "/kens" },
          { name: task.title, path: `/kens/${encodeURIComponent(task.slug)}` },
        ]),
        {
          "@context": "https://schema.org",
          "@type": "CreativeWork",
          "@id": `${kenUrl}#ken`,
          name: task.title,
          description: task.summary,
          url: kenUrl,
          dateCreated: task.createdAt,
          dateModified: task.lastActivityAt,
          creativeWorkStatus: labelForStage(task.stage),
          author: {
            "@type": "Person",
            name: task.proposerName,
          },
          about: {
            "@type": "DefinedTerm",
            name: task.categoryName,
            url: canonicalUrl(`/kens?category=${encodeURIComponent(task.categorySlug)}`),
          },
          isPartOf: { "@id": `${canonicalUrl("/")}#website` },
          keywords: [task.categoryName, `${task.allocatedTier} lane`, "sustained AI-assisted work"],
        },
      ]
    : [];

  return (
    <div className="page-stack">
      {structuredData.map((data, index) => <JsonLd key={index} data={data} />)}
      <section className="panel hero-panel card-sheen space-y-6">
        <div className="flex flex-wrap gap-3">
          <LaneFilterChip tier={task.allocatedTier} />
          <span className="tag">{labelForStage(task.stage)}</span>
          <CategoryFilterChip slug={task.categorySlug} label={task.categoryName} />
          <span className="tag">Pulse {task.taskPulseScore > 0 ? `+${task.taskPulseScore}` : task.taskPulseScore}</span>
          <KenBookmarkButton taskId={task.id} slug={task.slug} saved={task.bookmarked} signedIn={Boolean(viewerProfile)} compact />
        </div>
        <div className="ken-detail-heading">
          <div className="space-y-4">
            <div className="eyebrow">Ken thread</div>
            <h1 className="max-w-4xl font-display text-4xl font-semibold text-foreground sm:text-5xl">{task.title}</h1>
            <p className="max-w-4xl text-lg leading-8 text-muted">{task.summary}</p>
          </div>
          <KenVisual task={task} variant="detail" />
        </div>
        <div className="detail-meta-row">
          <span className="micro-pill">Created {formatDateTime(task.createdAt)}</span>
          <span className="micro-pill">Last activity {formatDateTime(task.lastActivityAt)}</span>
          <span className="micro-pill">Proposed by {task.proposerName}</span>
        </div>
        <KenTimingStrip ken={task} />
        <div className="metric-grid">
          {[ ["Voice", String(task.totalVotes)], ["Backers", String(task.supporterCount)], ["Comments", String(task.discussionCount)], ["Sandbox backing", formatCurrency(task.sandboxCapitalUsd)] ].map(([label, value]) => (
            <div key={label} className="metric-card"><div className="eyebrow">{label}</div><div className="metric-value">{value}</div></div>
          ))}
        </div>
      </section>

      {task.intakeReview ? (
        <section className="panel grid gap-4" aria-labelledby="intake-review-heading">
          <div className="category-review-head">
            <div>
              <div className="eyebrow">Transparent intake record</div>
              <h2 id="intake-review-heading" className="font-display text-2xl font-semibold text-foreground">Submission review</h2>
            </div>
            <span className={`status-chip is-${task.intakeReview.submission.intakeStatus}`}>
              {task.intakeReview.submission.intakeStatus.replaceAll("-", " ")}
            </span>
          </div>
          <div className="review-lane-summary">
            <span>Requested <strong>{task.intakeReview.submission.requestedTier}</strong></span>
            <span>Scope estimate <strong>{task.intakeReview.submission.estimatedTier}</strong></span>
            <span>{task.intakeReview.submission.assigneeAccountId ? "Reviewer assigned" : "Awaiting assignment"}</span>
          </div>
          {task.intakeReview.submission.reviewNote ? (
            <p className="admin-hint"><strong>Public review note:</strong> {task.intakeReview.submission.reviewNote}</p>
          ) : null}
          {intakeBlocked ? (
            <p className="text-sm leading-7 text-muted">
              This private detail record is visible only to its submitter and authorized reviewers. It does not appear in search, profiles, ranking, pulse, or public feed results until approved.
            </p>
          ) : null}
          <details className="review-history">
            <summary>Public review history ({task.intakeReview.events.filter((event) => event.isPublic).length})</summary>
            <ol className="review-history-list">
              {task.intakeReview.events.filter((event) => event.isPublic).map((event) => (
                <li key={event.id}>
                  <div><strong>{event.action.replaceAll("-", " ")}</strong><span>{formatDateTime(event.createdAt)}</span></div>
                  {event.publicNote ? <p>{event.publicNote}</p> : null}
                </li>
              ))}
            </ol>
          </details>
        </section>
      ) : null}

      <KenLifecycleMap
        density="progress"
        currentTaskStage={task.stage}
        eyebrow="Ken progression"
        title="Current position in the public lifecycle"
      />

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
            disabled={intakeBlocked || !viewerProfile?.canComment}
            disabledMessage={participationMessage}
          />
        </div>

        <div className="space-y-6">
          <TaskPulsePanel
            taskId={task.id}
            slug={task.slug}
            userPulse={task.userTaskPulse}
            positivePulseCount={task.positivePulseCount}
            negativePulseCount={task.negativePulseCount}
            disabled={intakeBlocked || !viewerProfile?.canPulse}
            disabledMessage={participationMessage}
          />
          <VotePanel
            taskId={task.id}
            slug={task.slug}
            initialVotes={task.userVotes}
            availableCredits={viewerProfile?.availableCredits ?? 0}
            totalCredits={viewerProfile?.effectiveVoiceCredits ?? 0}
            disabled={intakeBlocked || !viewerProfile?.canAllocateVoice}
            disabledMessage={participationMessage}
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
        {items.map((item) => (
          <li key={item} className="flex gap-3"><span className="list-accent-dot mt-2 size-2 rounded-full" /><span>{item}</span></li>
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
