"use client";

import Link from "next/link";
import { useActionState } from "react";

import { initialActionState } from "@/app/action-state";
import { appealReviewDecisionAction } from "@/app/actions";
import type {
  CategoryProposalRecord,
  KenSubmissionRecord,
  ReviewEntityType,
  ReviewEventRecord,
} from "@/lib/types";
import { formatDateTime } from "@/lib/utils";

export function SubmissionReviewStatus({
  categories,
  kens,
  events,
}: {
  categories: CategoryProposalRecord[];
  kens: KenSubmissionRecord[];
  events: ReviewEventRecord[];
}) {
  if (categories.length === 0 && kens.length === 0) {
    return (
      <p className="text-sm text-muted">
        No intake records yet. <Link href="/submit" className="underline">Submit a Ken or propose a category</Link>.
      </p>
    );
  }

  return (
    <div className="grid gap-3">
      {kens.map((submission) => (
        <SubmissionStatusCard
          key={submission.id}
          entityType="ken-submission"
          entityId={submission.id}
          title={submission.taskTitle}
          href={`/kens/${submission.taskSlug}`}
          status={submission.intakeStatus}
          note={submission.reviewNote}
          updatedAt={submission.updatedAt}
          facts={[
            `Requested ${submission.requestedTier} lane`,
            `Scope estimate ${submission.estimatedTier}`,
            submission.assigneeAccountId ? "Reviewer assigned" : "Awaiting assignment",
          ]}
          events={events.filter((event) => event.entityType === "ken-submission" && event.entityId === submission.id)}
        />
      ))}
      {categories.map((proposal) => (
        <SubmissionStatusCard
          key={proposal.id}
          entityType="category-proposal"
          entityId={proposal.id}
          title={proposal.name}
          status={proposal.reviewStatus}
          note={proposal.reviewNote}
          updatedAt={proposal.updatedAt}
          facts={[
            `Normalized slug ${proposal.slug}`,
            proposal.assigneeAccountId ? "Reviewer assigned" : "Awaiting assignment",
            proposal.mergedCategoryId ? `Merged into ${proposal.mergedCategoryId}` : "Independent proposal",
          ]}
          events={events.filter((event) => event.entityType === "category-proposal" && event.entityId === proposal.id)}
        />
      ))}
    </div>
  );
}

function SubmissionStatusCard({
  entityType,
  entityId,
  title,
  href,
  status,
  note,
  updatedAt,
  facts,
  events,
}: {
  entityType: ReviewEntityType;
  entityId: string;
  title: string;
  href?: string;
  status: string;
  note: string | null;
  updatedAt: string;
  facts: string[];
  events: ReviewEventRecord[];
}) {
  const canAppeal = status === "rejected" || status === "merged";
  return (
    <article className="audit-card submission-status-card">
      <div className="category-review-head">
        <div className="min-w-0">
          <div className="eyebrow">Updated {formatDateTime(updatedAt)}</div>
          <h3>{href ? <Link href={href}>{title}</Link> : title}</h3>
        </div>
        <span className={`status-chip is-${status}`}>{status.replaceAll("-", " ")}</span>
      </div>
      <div className="review-lane-summary">
        {facts.map((fact) => <span key={fact}>{fact}</span>)}
      </div>
      {note ? <p className="admin-hint"><strong>Public review note:</strong> {note}</p> : null}
      <details className="review-history">
        <summary>Public decision history ({events.length})</summary>
        <ol className="review-history-list">
          {events.map((event) => (
            <li key={event.id}>
              <div><strong>{event.action.replaceAll("-", " ")}</strong><span>{formatDateTime(event.createdAt)}</span></div>
              {event.publicNote ? <p>{event.publicNote}</p> : null}
            </li>
          ))}
        </ol>
      </details>
      {canAppeal ? <AppealForm entityType={entityType} entityId={entityId} /> : null}
    </article>
  );
}

function AppealForm({ entityType, entityId }: { entityType: ReviewEntityType; entityId: string }) {
  const [state, formAction, pending] = useActionState(appealReviewDecisionAction, initialActionState);
  return (
    <form action={formAction} className="form-grid border-t border-border pt-3">
      <input type="hidden" name="entityType" value={entityType} />
      <input type="hidden" name="entityId" value={entityId} />
      <label className="field-label">
        <span>Appeal the outcome</span>
        <textarea
          className="field"
          name="publicNote"
          rows={3}
          minLength={20}
          maxLength={2000}
          required
          placeholder="Identify a factual error, new evidence, conflict, or procedural issue. This explanation becomes part of the public decision history."
        />
      </label>
      <button className="cta-secondary cta-compact" type="submit" disabled={pending}>
        {pending ? "Submitting appeal" : "Submit public appeal"}
      </button>
      {state.message ? <p className={`alert ${state.status === "error" ? "alert-error" : "alert-success"}`}>{state.message}</p> : null}
    </form>
  );
}
