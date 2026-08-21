import Link from "next/link";

import { RUN_DECISION_DEFINITIONS } from "@/lib/run-governance";
import type { TaskDetail } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";

export function RunQualityContract({ task }: { task: TaskDetail }) {
  const releaseDecision = task.runDecisions.find((decision) => decision.eventType === "release") ?? null;
  const stopDecision = task.runDecisions.find((decision) => decision.eventType === "stop") ?? null;
  const corrections = task.runDecisions.filter((decision) => decision.eventType === "correction");
  const artifactDecisions = task.runDecisions.filter((decision) => decision.artifactLabel);

  return (
    <section className="panel space-y-5" aria-labelledby="run-quality-title">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="eyebrow">Output quality contract</div>
          <h2 id="run-quality-title" className="mt-2 font-display text-2xl font-semibold text-foreground">
            Named deliverables, evidence gates, corrections, and explicit release
          </h2>
        </div>
        <span className={`status-chip ${releaseDecision ? "is-approved" : "is-pending"}`}>
          {releaseDecision
            ? RUN_DECISION_DEFINITIONS[releaseDecision.decisionCode].label
            : "Release decision pending"}
        </span>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <QualityList title="Named deliverables" items={task.deliverables} />
        <QualityList title="Acceptance criteria" items={task.evaluationCriteria} />
        <QualityList title="Provenance requirements" items={task.evidence} />
        <QualityList
          title="Rollback and failure boundary"
          items={[
            task.run?.rollbackPlan ?? "No compute run is open; rollback terms must be set before launch.",
            ...task.riskFlags,
          ]}
        />
      </div>

      <div className="run-quality-stats text-sm text-muted">
        <div className="stat-card run-quality-stat">
          <span>Checkpoint gates</span>
          <strong>{task.checkpoints.length > 0 ? `${task.checkpoints.filter((item) => item.releaseStatus === "approved").length}/${task.checkpoints.length} approved` : "Not opened"}</strong>
        </div>
        <div className="stat-card run-quality-stat">
          <span>Corrections</span>
          <strong>{corrections.length > 0 ? `${corrections.length} recorded` : "None recorded"}</strong>
        </div>
        <div className="stat-card run-quality-stat">
          <span>Stop state</span>
          <strong>{stopDecision ? RUN_DECISION_DEFINITIONS[stopDecision.decisionCode].label : "No stop decision"}</strong>
        </div>
      </div>

      <div className="space-y-3">
        <div className="eyebrow">Decision and artifact history</div>
        {task.runDecisions.length > 0 ? task.runDecisions.map((decision) => (
          <article key={decision.id} className="audit-card">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="font-display text-lg font-semibold text-foreground">
                  {RUN_DECISION_DEFINITIONS[decision.decisionCode].label}
                </div>
                <div className="text-xs uppercase tracking-[0.18em] text-muted">
                  {decision.eventType} · {decision.actorRole} · {formatDateTime(decision.createdAt)}
                </div>
              </div>
              {decision.checkpointId ? <span className="tag">Checkpoint {decision.checkpointId}</span> : null}
            </div>
            <p className="mt-3 text-sm leading-7 text-muted">{decision.publicReason}</p>
            {decision.artifactLabel ? (
              <div className="mt-3 grid gap-3 text-sm text-muted md:grid-cols-2">
                <div className="stat-card">
                  <span>Artifact</span>
                  <strong>
                    {decision.artifactUrl ? (
                      decision.artifactUrl.startsWith("/") ? (
                        <Link href={decision.artifactUrl}>{decision.artifactLabel}</Link>
                      ) : (
                        <a href={decision.artifactUrl} target="_blank" rel="noopener noreferrer">{decision.artifactLabel}</a>
                      )
                    ) : decision.artifactLabel}
                  </strong>
                </div>
                <div className="stat-card">
                  <span>Digest</span>
                  <strong className="break-all font-mono text-xs">{decision.artifactDigest ?? "No digest recorded"}</strong>
                </div>
              </div>
            ) : null}
          </article>
        )) : (
          <p className="text-sm leading-7 text-muted">
            No checkpoint, correction, stop, or release decision has been recorded. The Ken cannot silently disappear: any lifecycle change requires an append-only public decision.
          </p>
        )}
      </div>

      {artifactDecisions.length === 0 && task.runUpdates.length > 0 ? (
        <p className="admin-hint">
          Run updates describe work in progress, but none is a release decision. A reviewer must record an artifact URL or SHA-256 digest before final or partial release.
        </p>
      ) : null}
    </section>
  );
}

function QualityList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-[1.3rem] border border-border bg-background/55 p-5">
      <div className="font-display text-lg font-semibold text-foreground">{title}</div>
      <ul className="mt-3 space-y-2 text-sm leading-7 text-muted">
        {items.map((item) => <li key={item} className="flex gap-3"><span className="list-accent-dot mt-2 size-2 rounded-full" /><span>{item}</span></li>)}
      </ul>
    </div>
  );
}
