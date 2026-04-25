"use client";

import { useActionState, useState } from "react";

import { initialActionState } from "@/app/action-state";
import { decideCategoryProposalAction } from "@/app/actions";
import type { CategoryProposalRecord } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";

export function AdminCategoryProposals({ items }: { items: CategoryProposalRecord[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-muted">No category proposals have been submitted yet.</p>;
  }

  return (
    <div className="admin-grid">
      {items.map((proposal) => (
        <CategoryProposalReview key={proposal.id} proposal={proposal} />
      ))}
    </div>
  );
}

function CategoryProposalReview({ proposal }: { proposal: CategoryProposalRecord }) {
  const [state, action, pending] = useActionState(decideCategoryProposalAction, initialActionState);
  const [decision, setDecision] = useState(proposal.reviewStatus);

  return (
    <article className="audit-card category-review-card">
      <div className="category-review-head">
        <div>
          <div className="eyebrow">Submitted {formatDateTime(proposal.createdAt)}</div>
          <h3>{proposal.name}</h3>
          <p className="text-sm text-muted">Proposed by {proposal.proposerName ?? proposal.proposerProfileId}</p>
        </div>
        <span className={`status-chip is-${proposal.reviewStatus}`}>{proposal.reviewStatus}</span>
      </div>
      <p className="text-sm leading-7 text-muted">{proposal.description}</p>
      <p className="text-sm leading-7 text-muted"><strong>Value:</strong> {proposal.publicBenefit}</p>
      <div className="category-guidelines">
        {proposal.exampleKens.map((example) => <span key={example} className="guideline-item">{example}</span>)}
      </div>
      <form action={action} className="form-grid">
        <input type="hidden" name="proposalId" value={proposal.id} />
        <label className="field-label">
          <span>Decision</span>
          <select className="field" name="reviewStatus" value={decision} onChange={(event) => setDecision(event.target.value as typeof proposal.reviewStatus)}>
            <option value="pending">Pending</option>
            <option value="approved">Approve and add category</option>
            <option value="rejected">Reject</option>
          </select>
        </label>
        <label className="field-label">
          <span>Review note</span>
          <textarea className="field" name="reviewNote" rows={3} defaultValue={proposal.reviewNote ?? ""} placeholder="Optional public or internal review note." />
        </label>
        <button type="submit" className="cta-secondary cta-compact" disabled={pending}>
          {pending ? "Saving" : "Save decision"}
        </button>
        {state.message ? (
          <p className={`alert ${state.status === "error" ? "alert-error" : "alert-success"}`}>{state.message}</p>
        ) : null}
      </form>
    </article>
  );
}
