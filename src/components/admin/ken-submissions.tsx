"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import { initialActionState } from "@/app/action-state";
import { reviewKenSubmissionAction } from "@/app/actions";
import { ReviewHistory, type ReviewerOption } from "@/components/admin/category-proposals";
import { parseIntakeResult, type KenIntakeResult } from "@/lib/intake-review";
import type {
  KenSubmissionRecord,
  ReviewEventRecord,
  SystemRole,
  TaskSummary,
} from "@/lib/types";
import { formatDateTime } from "@/lib/utils";

export function AdminKenSubmissions({
  items,
  reviewers,
  publicTasks,
  eventsByEntity,
  currentAccountId,
  currentRole,
}: {
  items: KenSubmissionRecord[];
  reviewers: ReviewerOption[];
  publicTasks: TaskSummary[];
  eventsByEntity: Record<string, ReviewEventRecord[]>;
  currentAccountId: string;
  currentRole: SystemRole;
}) {
  if (items.length === 0) {
    return <p className="text-sm text-muted">No Ken submissions match these review filters.</p>;
  }
  return (
    <div className="admin-grid">
      {items.map((submission) => (
        <KenSubmissionReview
          key={submission.id}
          submission={submission}
          reviewers={reviewers}
          publicTasks={publicTasks}
          events={eventsByEntity[submission.id] ?? []}
          currentAccountId={currentAccountId}
          currentRole={currentRole}
        />
      ))}
    </div>
  );
}

function KenSubmissionReview({
  submission,
  reviewers,
  publicTasks,
  events,
  currentAccountId,
  currentRole,
}: {
  submission: KenSubmissionRecord;
  reviewers: ReviewerOption[];
  publicTasks: TaskSummary[];
  events: ReviewEventRecord[];
  currentAccountId: string;
  currentRole: SystemRole;
}) {
  const [state, formAction, pending] = useActionState(reviewKenSubmissionAction, initialActionState);
  const [reviewAction, setReviewAction] = useState("assign");
  const canPublish = currentRole === "owner" || currentRole === "admin";
  const intake = parseIntakeResult<KenIntakeResult>(submission.intakeResultJson, {
    version: 1,
    outcome: "review",
    checks: [],
    similarityHints: [],
    estimatedTier: submission.estimatedTier,
    scopeMismatch: submission.estimatedTier !== submission.requestedTier,
    highRisk: true,
  });
  const assignedReviewer = reviewers.find((reviewer) => reviewer.id === submission.assigneeAccountId);

  return (
    <article className="audit-card category-review-card">
      <div className="category-review-head">
        <div className="min-w-0">
          <div className="eyebrow">Submitted {formatDateTime(submission.submittedAt)}</div>
          <h3><Link href={`/kens/${submission.taskSlug}`}>{submission.taskTitle}</Link></h3>
          <p className="text-sm text-muted">
            Proposed by {submission.proposerName ?? submission.proposerProfileId}
            {" · "}
            {assignedReviewer ? `assigned to ${assignedReviewer.label}` : "unassigned"}
          </p>
        </div>
        <span className={`status-chip is-${submission.intakeStatus}`}>{submission.intakeStatus.replaceAll("-", " ")}</span>
      </div>
      <p className="text-sm leading-7 text-muted">{submission.taskSummary}</p>
      <div className="review-lane-summary">
        <span>Requested lane <strong>{submission.requestedTier}</strong></span>
        <span>Scope estimate <strong>{submission.estimatedTier}</strong></span>
        <span className={intake.highRisk ? "text-red-500" : ""}>
          {intake.highRisk ? "Independent second approval required" : "Standard review"}
        </span>
      </div>
      <div className="category-guidelines">
        {submission.riskFlags.map((risk) => <span key={risk} className="guideline-item">{risk}</span>)}
      </div>
      <div className="review-check-grid" aria-label="Deterministic first-pass checks">
        {intake.checks.map((check) => (
          <div key={check.id} className={`review-check is-${check.level}`}>
            <strong>{check.label}</strong>
            <span>{check.detail}</span>
          </div>
        ))}
      </div>
      {intake.similarityHints.length > 0 ? (
        <p className="admin-hint">
          <strong>Possible overlap:</strong>{" "}
          {intake.similarityHints.map((hint) => `${hint.label} (${Math.round(hint.score * 100)}%)`).join(", ")}.
          The text comparison is advisory and does not publish, reject, or merge work.
        </p>
      ) : null}

      <form action={formAction} className="form-grid">
        <input type="hidden" name="submissionId" value={submission.id} />
        <label className="field-label">
          <span>Review action</span>
          <select className="field" name="action" value={reviewAction} onChange={(event) => setReviewAction(event.target.value)}>
            <option value="assign">Assign reviewer</option>
            <option value="recuse">Recuse myself</option>
            <option value="request-revision">Request revision</option>
            <option value="hold">Temporary high-risk hold</option>
            {canPublish ? <option value="approve">Approve to public voting</option> : null}
            {canPublish ? <option value="merge">Merge/link existing Ken</option> : null}
            {canPublish ? <option value="reject">Reject with reason</option> : null}
            {canPublish && submission.intakeStatus === "appealed" ? <option value="resolve-appeal">Return appeal to review</option> : null}
          </select>
        </label>
        <label className="field-label">
          <span>Assignee</span>
          <select className="field" name="targetAssigneeAccountId" defaultValue={submission.assigneeAccountId ?? currentAccountId}>
            {reviewers.map((reviewer) => (
              <option key={reviewer.id} value={reviewer.id}>{reviewer.label} · {reviewer.role}</option>
            ))}
          </select>
        </label>
        <label className="field-label">
          <span>Merge target</span>
          <select className="field" name="mergeTargetId" defaultValue="">
            <option value="">Choose only for merge</option>
            {publicTasks.filter((task) => task.id !== submission.taskId).map((task) => (
              <option key={task.id} value={task.id}>{task.title}</option>
            ))}
          </select>
        </label>
        <label className="field-label">
          <span>Public reason</span>
          <textarea
            className="field"
            name="publicNote"
            rows={3}
            defaultValue={submission.reviewNote ?? ""}
            placeholder="Required for revision, hold, approval, merge, rejection, and appeal resolution."
          />
        </label>
        <label className="field-label">
          <span>Private reviewer note</span>
          <textarea
            className="field"
            name="internalNote"
            rows={2}
            defaultValue={submission.internalReviewNote ?? ""}
            placeholder="Reviewer-only context; never shown in public outcomes or submitter email."
          />
        </label>
        <button type="submit" className="cta-secondary cta-compact" disabled={pending}>
          {pending ? "Recording decision" : "Record review action"}
        </button>
        {state.message ? (
          <p className={`alert ${state.status === "error" ? "alert-error" : "alert-success"}`}>{state.message}</p>
        ) : null}
      </form>
      <ReviewHistory events={events} />
    </article>
  );
}
