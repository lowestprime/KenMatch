import type { Metadata } from "next";

import { CategorySymbol } from "@/components/ken-visual";
import { getGovernanceData } from "@/lib/db";
import { getViewerProfileId } from "@/lib/session";
import { formatDateTime, labelForTier } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Governance",
  description: "Visible review states, checkpoint gates, attestation levels, blocked work, and governance decisions on KenMatch.",
};

export default async function GovernancePage() {
  const viewerProfileId = await getViewerProfileId();
  const { governance, blockedTasks, categories, profiles } = await getGovernanceData(viewerProfileId);

  return (
    <div className="page-stack">
      <section className="panel space-y-4">
        <div className="eyebrow">Governance and safety</div>
        <h1 className="font-display text-4xl font-semibold text-foreground">Visible review states, checkpoint gates, and accountable participation</h1>
        <p className="max-w-4xl text-lg leading-8 text-muted">
          KenMatch keeps launch decisions, blocked work, and contributor standing visible. The goal is a legible public process for deciding what should, and should not, receive sustained compute.
        </p>
      </section>

      <section className="section-grid" data-columns="2">
        <div className="panel space-y-4 governance-rules-panel">
          <div className="eyebrow">Ground rules</div>
          <div className="governance-rule-grid">
            {[
              ["Voice", "Account-bound and attestation-aware. Money can support compute, but it cannot buy rank."],
              ["Launch", "Public review is allowed; sustained runs require explicit release conditions."],
              ["Safety", "Blocked Kens stay visible so people can inspect where the boundary is drawn."],
              ["Checkpoints", "Approvals create real stop, pause, and rollback points during long runs."],
            ].map(([label, copy]) => (
              <div key={label} className="governance-rule-card">
                <strong>{label}</strong>
                <span>{copy}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="panel space-y-4 governance-list-panel">
          <div className="eyebrow">Attestation ladder</div>
          <div className="grid gap-4">
            {profiles.slice(0, 6).map((profile) => (
              <div key={profile.id} className="rounded-[1.3rem] border border-border bg-background/55 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-semibold text-foreground">{profile.name}</div>
                    <div className="text-sm text-muted">{profile.role}</div>
                  </div>
                  <span className="tag">{profile.attestationLevel}</span>
                </div>
                <p className="mt-2 text-sm leading-7 text-muted">{profile.attestationNote}</p>
                <p className="mt-2 text-sm leading-7 text-muted">{profile.participationNote}</p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs uppercase tracking-[0.22em] text-muted">
                  <span className="tag">{profile.attestationStatus}</span>
                  <span className="tag">Sybil risk {profile.sybilRisk}</span>
                  <span className="tag">Voice cap {profile.effectiveVoiceCredits}</span>
                  <span className="tag">Reviewed {formatDateTime(profile.attestationReviewedAt)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-grid" data-columns="2">
        <div className="panel space-y-4 governance-list-panel">
          <div className="eyebrow">Recent governance log</div>
          {governance.length > 0 ? governance.map((event) => (
            <div key={event.id} className="rounded-[1.3rem] border border-border bg-background/55 p-5">
              <div className="flex items-center justify-between gap-3 text-xs uppercase tracking-[0.22em] text-muted">
                <span>{event.house.replace("-", " ")}</span>
                <span>{formatDateTime(event.createdAt)}</span>
              </div>
              <div className="mt-3 font-display text-xl font-semibold text-foreground">{event.title}</div>
              <p className="mt-2 text-sm leading-7 text-muted">{event.decision}</p>
              <p className="mt-2 text-sm leading-7 text-muted">Outcome: {event.outcome}</p>
            </div>
          )) : <p className="text-sm text-muted">No governance decisions have been recorded yet.</p>}
        </div>
        <div className="panel space-y-4">
          <div className="eyebrow">Visible blocked Kens</div>
          {blockedTasks.length > 0 ? blockedTasks.map((task) => (
            <div key={task.id} className="rounded-[1.3rem] border border-red-500/30 bg-red-500/10 p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="font-display text-xl font-semibold text-red-300">{task.title}</div>
                <span className="tier-chip is-blocked">{labelForTier(task.allocatedTier)}</span>
              </div>
              <p className="mt-2 text-sm leading-7 text-red-100/80">{task.problem}</p>
            </div>
          )) : <p className="text-sm text-muted">No Kens are currently blocked. Blocked Kens appear here so the safety boundary is always visible.</p>}
        </div>
      </section>

      <section className="panel space-y-4">
        <div className="eyebrow">Category health</div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {categories.map((category) => (
            <div key={category.id} className="rounded-[1.3rem] border border-border bg-background/55 p-4 text-sm text-muted">
              <div className="flex items-center gap-3">
                <CategorySymbol
                  categorySlug={category.slug}
                  categoryName={category.name}
                  tier="queued"
                  stage={category.runningCount > 0 ? "running" : category.shippedCount > 0 ? "shipped" : "review"}
                  variant="inline"
                />
                <div className="font-display text-xl font-semibold text-foreground">{category.name}</div>
              </div>
              <p className="mt-2">{category.description}</p>
              <div className="mt-3 text-xs uppercase tracking-[0.22em] text-muted">{category.eligibleCount} eligible · {category.runningCount} running · {category.shippedCount} shipped</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
