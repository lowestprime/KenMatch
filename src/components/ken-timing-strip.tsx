import { describeCountdown, describeElapsedSince, formatDateTime, formatHoursToHuman, labelForCompletionMode, progressPercent, remainingHours } from "@/lib/utils";
import type { TaskSummary } from "@/lib/types";

export function KenTimingStrip({ ken, compact = false }: { ken: TaskSummary; compact?: boolean }) {
  const progress = progressPercent(ken.startedAt, ken.expectedMaxEndAt);
  const remaining = remainingHours(ken.expectedMaxEndAt);
  const computeTarget = ken.runtimeHours;

  return (
    <section className={`timing-strip ${compact ? "is-compact" : ""}`}>
      <div className="timing-meta-row">
        <span className="micro-pill">Created {formatDateTime(ken.createdAt)}</span>
        <span className="micro-pill">Updated {formatDateTime(ken.lastActivityAt)}</span>
        <span className="micro-pill">{labelForCompletionMode(ken.completionMode)}</span>
      </div>
      <div className="timing-grid">
        <TimingStat label="Launch" value={describeCountdown(ken.launchAt)} meta={ken.launchAt ? formatDateTime(ken.launchAt) : "Pending"} />
        <TimingStat label="Run age" value={describeElapsedSince(ken.createdAt)} meta="since submission" />
        <TimingStat label="Compute" value={`${formatHoursToHuman(ken.computeHoursUsed)} used`} meta={remaining !== null ? `${formatHoursToHuman(remaining)} remaining` : "No cap yet"} />
      </div>
      <div className="progress-shell" aria-label="Ken compute progression">
        <div className="progress-label-row">
          <span>{ken.computeHoursUsed} / {computeTarget} runtime hours</span>
          <span>{progress}% window consumed</span>
        </div>
        <div className="progress-track">
          <span className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
      </div>
      {!compact ? <p className="timing-note">{ken.completionSummary}</p> : null}
    </section>
  );
}

function TimingStat({ label, value, meta }: { label: string; value: string; meta: string }) {
  return (
    <div className="timing-stat">
      <div className="timing-stat-label">{label}</div>
      <div className="timing-stat-value">{value}</div>
      <div className="timing-stat-meta">{meta}</div>
    </div>
  );
}

