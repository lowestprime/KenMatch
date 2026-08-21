"use client";

import { useActionState, useState } from "react";

import { initialActionState } from "@/app/action-state";
import { decideCategoryProposalAction } from "@/app/actions";
import { parseIntakeResult, type CategoryIntakeResult } from "@/lib/intake-review";
import type {
  CategoryProposalRecord,
  CategoryRecord,
  ReviewEventRecord,
  SystemRole,
} from "@/lib/types";
import { formatDateTime } from "@/lib/utils";

export interface ReviewerOption {
  id: string;
  label: string;
  role: SystemRole;
}

export function AdminCategoryProposals({
  items,
  reviewers,
  categories,
  eventsByEntity,
  currentAccountId,
  currentRole,
}: {
  items: CategoryProposalRecord[];
  reviewers: ReviewerOption[];
  categories: CategoryRecord[];
  eventsByEntity: Record<string, ReviewEventRecord[]>;
  currentAccountId: string;
  currentRole: SystemRole;
}) {
  if (items.length === 0) {
    return <p className="text-sm text-muted">No category proposals match these review filters.</p>;
  }

  return (
    <div className="admin-grid">
      {items.map((proposal) => (
        <CategoryProposalReview
          key={proposal.id}
          proposal={proposal}
          reviewers={reviewers}
          categories={categories}
          events={eventsByEntity[proposal.id] ?? []}
          currentAccountId={currentAccountId}
          currentRole={currentRole}
        />
      ))}
    </div>
  );
}

function CategoryProposalReview({
  proposal,
  reviewers,
  categories,
  events,
  currentAccountId,
  currentRole,
}: {
  proposal: CategoryProposalRecord;
  reviewers: ReviewerOption[];
  categories: CategoryRecord[];
  events: ReviewEventRecord[];
  currentAccountId: string;
  currentRole: SystemRole;
}) {
  const [state, action, pending] = useActionState(decideCategoryProposalAction, initialActionState);
  const [reviewAction, setReviewAction] = useState("assign");
  const canPublish = currentRole === "owner" || currentRole === "admin";
  const intake = parseIntakeResult<CategoryIntakeResult>(proposal.intakeResultJson, {
    version: 1,
    outcome: "review",
    checks: [],
    similarityHints: [],
    normalizedName: proposal.name.toLowerCase(),
    normalizedSlug: proposal.slug,
  });
  const assignedReviewer = reviewers.find((reviewer) => reviewer.id === proposal.assigneeAccountId);

  return (
    <article className="audit-card category-review-card">
      <div className="category-review-head">
        <div className="min-w-0">
          <div className="eyebrow">Submitted {formatDateTime(proposal.createdAt)}</div>
          <h3>{proposal.name}</h3>
          <p className="text-sm text-muted">
            Proposed by {proposal.proposerName ?? proposal.proposerProfileId}
            {" · "}
            {assignedReviewer ? `assigned to ${assignedReviewer.label}` : "unassigned"}
          </p>
        </div>
        <span className={`status-chip is-${proposal.reviewStatus}`}>{proposal.reviewStatus.replaceAll("-", " ")}</span>
      </div>
      <p className="text-sm leading-7 text-muted">{proposal.description}</p>
      <p className="text-sm leading-7 text-muted"><strong>Public value:</strong> {proposal.publicBenefit}</p>
      <div className="category-guidelines">
        {proposal.exampleKens.map((example) => <span key={example} className="guideline-item">{example}</span>)}
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
          This deterministic text comparison is advisory; a reviewer decides whether boundaries overlap.
        </p>
      ) : null}

      <form action={action} className="form-grid">
        <input type="hidden" name="proposalId" value={proposal.id} />
        <label className="field-label">
          <span>Review action</span>
          <select className="field" name="action" value={reviewAction} onChange={(event) => setReviewAction(event.target.value)}>
            <option value="assign">Assign reviewer</option>
            <option value="recuse">Recuse myself</option>
            <option value="request-revision">Request revision</option>
            <option value="hold">Temporary risk hold</option>
            {canPublish ? <option value="approve">Approve category</option> : null}
            {canPublish ? <option value="merge">Merge into existing category</option> : null}
            {canPublish ? <option value="reject">Reject with reason</option> : null}
            {canPublish && proposal.reviewStatus === "appealed" ? <option value="resolve-appeal">Return appeal to review</option> : null}
          </select>
        </label>
        <label className="field-label">
          <span>Assignee</span>
          <select className="field" name="targetAssigneeAccountId" defaultValue={proposal.assigneeAccountId ?? currentAccountId}>
            {reviewers.map((reviewer) => (
              <option key={reviewer.id} value={reviewer.id}>{reviewer.label} · {reviewer.role}</option>
            ))}
          </select>
        </label>
        <label className="field-label">
          <span>Merge target</span>
          <select className="field" name="mergeTargetId" defaultValue="">
            <option value="">Choose only for merge</option>
            {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </select>
        </label>
        <label className="field-label">
          <span>Public reason</span>
          <textarea
            className="field"
            name="publicNote"
            rows={3}
            defaultValue={proposal.reviewNote ?? ""}
            placeholder="Required for revision, hold, approval, merge, rejection, and appeal resolution."
          />
        </label>
        <label className="field-label">
          <span>Private reviewer note</span>
          <textarea
            className="field"
            name="internalNote"
            rows={2}
            defaultValue={proposal.internalReviewNote ?? ""}
            placeholder="Visible only to reviewers. Never included in public outcomes."
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

export function ReviewHistory({ events }: { events: ReviewEventRecord[] }) {
  return (
    <details className="review-history">
      <summary>Decision history ({events.length})</summary>
      {events.length > 0 ? (
        <ol className="review-history-list">
          {events.map((event) => (
            <li key={event.id}>
              <div>
                <strong>{event.action.replaceAll("-", " ")}</strong>
                <span>{formatDateTime(event.createdAt)} · {event.actorName ?? "system"}</span>
              </div>
              {event.fromStatus || event.toStatus ? (
                <p>{event.fromStatus ?? "new"} → {event.toStatus ?? "unchanged"}</p>
              ) : null}
              {event.publicNote ? <p><strong>Public:</strong> {event.publicNote}</p> : null}
              {event.internalNote ? <p><strong>Private:</strong> {event.internalNote}</p> : null}
            </li>
          ))}
        </ol>
      ) : <p className="text-sm text-muted">No decision events have been recorded.</p>}
    </details>
  );
}
