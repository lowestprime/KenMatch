import Link from "next/link";

import { CategoryFilterChip, LaneFilterChip } from "@/components/filter-chip-link";
import { CapacityStatePanel } from "@/components/capacity-state-panel";
import { CategorySymbol } from "@/components/ken-visual";
import { KenLifecycleMap } from "@/components/ken-lifecycle-map";
import { getGovernanceData } from "@/lib/db";
import { getViewerProfileId } from "@/lib/session";
import { categoryFilterHref } from "@/lib/taxonomy";
import { CAPACITY_POLICIES, OBJECTIVE_SUBJECTIVE_DECISIONS, RUN_DECISION_DEFINITIONS } from "@/lib/run-governance";
import { stopDecisionCodes } from "@/lib/types";
import { buildPublicMetadata } from "@/lib/seo";
import { formatDateTime } from "@/lib/utils";

export const metadata = buildPublicMetadata({
  title: "Governance",
  description:
    "Inspect KenMatch allocation rules, reviewer boundaries, lifecycle checkpoints, visible blocked work, and reason-coded governance decisions.",
  path: "/governance",
});

const boardRoles = [
  {
    title: "Public contributors",
    label: "Allocation chamber",
    body: "Submit Kens, refine briefs, discuss tradeoffs, add evidence, pulse-vote, and spend scarce allocation credits. This is the broad Reddit/Stack Exchange-like signal layer, not a wealth gate.",
  },
  {
    title: "Verified reviewers",
    label: "Safety and validity council",
    body: "Review risk, evidence quality, reproducibility, and evaluation criteria. Their role is to filter unsafe or invalid work and set release conditions, not to secretly choose popular winners.",
  },
  {
    title: "Moderators and operators",
    label: "Process stewards",
    body: "Keep accounts, category proposals, maintenance, abuse controls, audits, and visible UI state working. Operational privileges should preserve public process rather than override public rank.",
  },
  {
    title: "Sponsors and backers",
    label: "Capacity support",
    body: "Fund compute, review, safety reserve, or category capacity. Backing may increase available resources, but it cannot buy votes, ranking power, release approval, or hidden priority.",
  },
];

export default async function GovernancePage() {
  const viewerProfileId = await getViewerProfileId();
  const { governance, blockedTasks, categories, profiles, capacity } = await getGovernanceData(viewerProfileId);

  return (
    <div className="page-stack long-reading-route">
      <section className="panel space-y-4 hero-panel">
        <div className="eyebrow">Governance and safety</div>
        <h1 className="font-display text-4xl font-semibold text-foreground">Public board roles, visible review states, and accountable participation</h1>
        <p className="max-w-4xl text-lg leading-8 text-muted">
          KenMatch uses “board” to mean the visible public operating surface where proposals, evidence, votes, safety checks, sponsor context, and checkpoint decisions can be inspected. It is not a private committee with hidden authority to buy, bury, or secretly select winners.
        </p>
      </section>

      <KenLifecycleMap
        id="decision-path"
        density="compact"
        eyebrow="Public decision path"
        title="Every allocation decision leaves a visible next step"
      />

      <CapacityStatePanel capacity={capacity} />

      <section className="panel protocol-panel">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Board composition</span>
            <h2>Roles are deliberately narrow and auditable</h2>
          </div>
        </div>
        <div className="ecosystem-grid">
          {boardRoles.map((role) => (
            <article key={role.title} className="ecosystem-card">
              <span className="micro-pill">{role.label}</span>
              <strong>{role.title}</strong>
              <p>{role.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section-grid" data-columns="2">
        <div className="panel space-y-4 governance-rules-panel">
          <div className="eyebrow">Ground rules</div>
          <div className="governance-rule-grid">
            {[
              ["Voice", "Account-bound and attestation-aware. Money can support compute, but it cannot buy rank."],
              ["Board scope", "The public board coordinates signal, review, and checkpoints; it does not create private control over public Kens."],
              ["Safety", "Blocked Kens stay visible so people can inspect where the boundary is drawn and why public curiosity cannot override harm review."],
              ["Checkpoints", "Approvals create real stop, pause, and rollback points during long runs, with decisions recorded for later audit."],
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

      <section id="capacity-policy" className="panel space-y-5 scroll-mt-28">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Capacity state machine</span>
            <h2>Funding constraints change execution, not public rank or history</h2>
          </div>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {Object.values(CAPACITY_POLICIES).map((policy) => (
            <article key={policy.state} className={`audit-card capacity-policy-card is-${policy.state}`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <strong className="font-display text-xl text-foreground">{policy.label}</strong>
                <span className="tag">{policy.state}</span>
              </div>
              <p className="mt-2 text-sm leading-7 text-muted">{policy.summary}</p>
              <dl className="mt-3 grid gap-3 text-sm text-muted">
                <div className="stat-card"><dt>New runs</dt><dd><strong>{policy.newLaunches}</strong></dd></div>
                <div className="stat-card"><dt>Existing runs</dt><dd><strong>{policy.existingRuns}</strong></dd></div>
                <div className="stat-card"><dt>Protected work</dt><dd><strong>{policy.protectedWork}</strong></dd></div>
                <div className="stat-card"><dt>Recovery</dt><dd><strong>{policy.recovery}</strong></dd></div>
              </dl>
            </article>
          ))}
        </div>
        <p className="admin-hint">
          Automatic policy uses committed unrestricted compute coverage. Projected, simulated, category-restricted, Ken-restricted, and safety-reserve balances cannot make the state look healthier. An owner or admin may impose a stricter public override, but cannot use one to bypass a more restrictive automatic floor.
        </p>
      </section>

      <section id="run-quality" className="section-grid scroll-mt-28" data-columns="2">
        <div className="panel space-y-4">
          <div className="eyebrow">Output quality contract</div>
          <h2 className="font-display text-2xl font-semibold text-foreground">A progress note is not a release decision</h2>
          <p className="text-sm leading-7 text-muted">
            Every run begins with named deliverables, acceptance criteria, provenance requirements, checkpoint gates, and rollback terms. Public artifacts retain a URL or SHA-256 digest. Corrections, failed or partial states, reviewer decisions, and final release are append-only events; a Ken cannot silently disappear or change status without a public reason.
          </p>
          <div className="grid gap-3 text-sm text-muted">
            {[
              ["Before launch", "Named scope, deliverables, acceptance checks, sources, compute cap, checkpoint cadence, and rollback plan."],
              ["During the run", "Checkpoint decisions, evidence, artifact traces, corrections, holds, and reviewer redirects."],
              ["At closure", "A reason-coded stop and explicit final, partial, rejected, or rolled-back release decision."],
            ].map(([label, copy]) => (
              <div key={label} className="stat-card"><span>{label}</span><strong>{copy}</strong></div>
            ))}
          </div>
        </div>
        <div className="panel space-y-4">
          <div className="eyebrow">Stop contract</div>
          <h2 className="font-display text-2xl font-semibold text-foreground">Ten visible reasons can stop or redirect a run</h2>
          <div className="grid gap-3">
            {stopDecisionCodes.map((code) => {
              const definition = RUN_DECISION_DEFINITIONS[code];
              return (
                <div key={code} className="governance-rule-card">
                  <strong>{definition.label}</strong>
                  <span>{definition.description}</span>
                </div>
              );
            })}
          </div>
          <p className="text-sm leading-7 text-muted">
            A stop event preserves available evidence and names the actor, time, public reason, checkpoint, and artifact trace. Successful early completion and useful partial delivery remain distinct from failure.
          </p>
        </div>
      </section>

      <section id="decision-matrix" className="panel space-y-5 scroll-mt-28">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Decision matrix</span>
            <h2>Software-enforced facts stay separate from human judgment</h2>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="decision-matrix-table min-w-[760px]">
            <thead>
              <tr>
                <th scope="col">Decision</th>
                <th scope="col">Mode</th>
                <th scope="col">Accountability</th>
              </tr>
            </thead>
            <tbody>
              {OBJECTIVE_SUBJECTIVE_DECISIONS.map((row) => (
                <tr key={row.decision}>
                  <th scope="row">{row.decision}</th>
                  <td><span className="tag">{row.mode}</span></td>
                  <td>{row.accountability}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="admin-hint">
          A reviewer decision does not become objective merely because software stores it. Subjective decisions retain the reviewer, evidence, public reason, recusal boundary, and appeal path.
        </p>
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
                <Link href={`/kens/${task.slug}`} className="font-display text-xl font-semibold text-red-300">{task.title}</Link>
                <LaneFilterChip tier={task.allocatedTier} />
              </div>
              <p className="mt-2 text-sm leading-7 text-red-100/80">{task.problem}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <CategoryFilterChip slug={task.categorySlug} label={task.categoryName} />
              </div>
            </div>
          )) : <p className="text-sm text-muted">No Kens are currently blocked. Blocked Kens appear here so the safety boundary is always visible.</p>}
        </div>
      </section>

      <section className="panel space-y-4">
        <div className="eyebrow">Category health</div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {categories.map((category) => (
            <Link key={category.id} href={categoryFilterHref(category.slug)} className="category-summary-card interactive-surface text-sm text-muted">
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
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
