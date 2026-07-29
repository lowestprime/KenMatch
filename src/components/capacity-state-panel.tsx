import type { CapacityStateResolution, EconomicsSummary } from "@/lib/types";

export function CapacityStatePanel({
  capacity,
  summary,
  compact = false,
}: {
  capacity: CapacityStateResolution;
  summary?: EconomicsSummary;
  compact?: boolean;
}) {
  return (
    <section
      className={`panel capacity-state-panel is-${capacity.state} ${compact ? "is-compact" : ""}`}
      aria-labelledby="capacity-state-title"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="eyebrow">Public funding and capacity state</div>
          <h2 id="capacity-state-title" className="font-display text-2xl font-semibold text-foreground">
            {capacity.policy.label}
          </h2>
          <p className="max-w-4xl text-sm leading-7 text-muted">{capacity.publicReason}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="tag">Effective: {capacity.state.replaceAll("-", " ")}</span>
          <span className="tag">Automatic: {capacity.automaticState.replaceAll("-", " ")}</span>
          <span className="tag">{capacity.source.replaceAll("-", " ")}</span>
        </div>
      </div>
      {summary ? (
        <div className="mt-4 grid gap-3 text-sm text-muted sm:grid-cols-3">
          <div className="stat-card"><span>Usable committed treasury</span><strong>${summary.committedUnrestrictedTreasuryUsd.toLocaleString()}</strong></div>
          <div className="stat-card"><span>Estimated coverage</span><strong>{summary.coverageMonths.toFixed(1)} months</strong></div>
          <div className="stat-card"><span>Protected safety reserve</span><strong>${summary.committedSafetyReserveUsd.toLocaleString()}</strong></div>
        </div>
      ) : null}
      {!compact ? (
        <div className="mt-4 grid gap-3 text-sm text-muted md:grid-cols-2">
          <div className="stat-card"><span>New launches</span><strong>{capacity.policy.newLaunches}</strong></div>
          <div className="stat-card"><span>Existing runs</span><strong>{capacity.policy.existingRuns}</strong></div>
          <div className="stat-card"><span>Protected work</span><strong>{capacity.policy.protectedWork}</strong></div>
          <div className="stat-card"><span>Recovery rule</span><strong>{capacity.policy.recovery}</strong></div>
        </div>
      ) : null}
      <p className="mt-4 text-xs leading-6 text-muted">
        Rank, queue position, public history, and audit records remain visible in every capacity state. Projected, simulated, category-restricted, Ken-restricted, and safety-reserve funds do not count as unrestricted launch coverage.
      </p>
    </section>
  );
}
