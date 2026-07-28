import type { Metadata } from "next";
import Link from "next/link";

import { listPublicReviewOutcomes } from "@/lib/db";
import { formatDateTime } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Public review outcomes",
  description: "Reason-coded, append-only public outcomes for Ken and category intake decisions on KenMatch.",
};

export default async function PublicReviewOutcomesPage() {
  const outcomes = await listPublicReviewOutcomes(150);
  return (
    <div className="page-stack">
      <section className="panel hero-panel">
        <div className="eyebrow">Moderation without silent deletion</div>
        <h1>Public review outcomes</h1>
        <p className="max-w-4xl text-lg leading-8 text-muted">
          Final and public-facing intake actions keep a timestamp, reason, status transition, and responsible reviewer. Private safety or personal information is excluded; challenged records and appeals remain visible where safe.
        </p>
      </section>
      <section className="panel grid gap-3">
        {outcomes.length > 0 ? (
          <ol className="review-outcome-list">
            {outcomes.map((outcome) => (
              <li key={outcome.id} id={outcome.id} className="audit-card">
                <div className="category-review-head">
                  <div className="min-w-0">
                    <div className="eyebrow">{outcome.entityType.replaceAll("-", " ")} · {formatDateTime(outcome.createdAt)}</div>
                    <h2 className="font-display text-xl font-semibold"><Link href={outcome.href}>{outcome.entityLabel}</Link></h2>
                  </div>
                  <span className={`status-chip is-${outcome.toStatus ?? outcome.action}`}>{(outcome.toStatus ?? outcome.action).replaceAll("-", " ")}</span>
                </div>
                <p className="text-sm leading-7 text-muted">{outcome.publicNote}</p>
                <p className="text-xs text-muted">
                  {outcome.fromStatus ?? "new"} → {outcome.toStatus ?? "unchanged"} · reviewer {outcome.actorName ?? "system"}
                </p>
              </li>
            ))}
          </ol>
        ) : (
          <div className="empty-state">
            <strong>No public review outcomes yet.</strong>
            <span>New intake decisions will appear here after a reviewer records a public reason.</span>
          </div>
        )}
      </section>
    </div>
  );
}
