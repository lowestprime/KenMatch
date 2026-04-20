"use client";

import { useActionState } from "react";

import { initialActionState } from "@/app/action-state";
import { requestVerificationAction } from "@/app/actions";
import type { VerificationStatus } from "@/lib/types";

function statusBadgeClass(status: VerificationStatus) {
  switch (status) {
    case "approved":
      return "verification-badge is-approved";
    case "pending":
      return "verification-badge is-pending";
    case "rejected":
      return "verification-badge is-rejected";
    default:
      return "verification-badge";
  }
}

function statusLabel(status: VerificationStatus) {
  switch (status) {
    case "approved":
      return "Verified";
    case "pending":
      return "Review in progress";
    case "rejected":
      return "Request declined";
    default:
      return "Unverified";
  }
}

export function VerificationPanel({
  status,
  note,
  requestedAt,
}: {
  status: VerificationStatus;
  note: string | null;
  requestedAt: string | null;
}) {
  const [state, formAction, pending] = useActionState(requestVerificationAction, initialActionState);
  const canSubmit = status === "none" || status === "rejected";
  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="eyebrow">Identity verification</span>
          <h2>Prove ownership & build trust</h2>
        </div>
        <span className={statusBadgeClass(status)}>{statusLabel(status)}</span>
      </div>
      <ol className="grid gap-2" style={{ color: "var(--ink-muted)", fontSize: "0.92rem" }}>
        <li>
          <strong>Step 1.</strong> Confirm your email address. Unverified accounts can&apos;t submit new Kens.
        </li>
        <li>
          <strong>Step 2.</strong> Describe your identity, affiliation, and at least one verifiable link (ORCID, institutional page, GitHub, or published paper).
        </li>
        <li>
          <strong>Step 3.</strong> Administrators review submissions and may request additional evidence. Approval grants a visible verification badge and additional participation headroom.
        </li>
      </ol>
      {note ? (
        <p className="alert">
          Previous submission: {note}
          {requestedAt ? ` · ${new Date(requestedAt).toLocaleString()}` : null}
        </p>
      ) : null}
      {canSubmit ? (
        <form action={formAction} className="form-grid">
          <label className="field-label">
            <span>Verification note</span>
            <textarea
              className="field"
              name="note"
              rows={4}
              placeholder="Name, affiliation, and verifiable references (e.g. ORCID URL, institutional email, GitHub)."
            />
          </label>
          <button type="submit" className="cta-primary cta-compact" disabled={pending}>
            {pending ? "Submitting…" : "Submit verification request"}
          </button>
          {state.message ? (
            <p className={`alert ${state.status === "error" ? "alert-error" : "alert-success"}`}>{state.message}</p>
          ) : null}
        </form>
      ) : (
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          Contact an administrator if you need to update your verification status.
        </p>
      )}
    </div>
  );
}
