import Link from "next/link";

import { KenVisual } from "@/components/ken-visual";
import { formatCurrency, formatDateTime, labelForStage, labelForTier } from "@/lib/utils";
import type { TaskSummary } from "@/lib/types";

const tierStyles: Record<TaskSummary["allocatedTier"], string> = {
  months: "tier-chip is-months",
  weeks: "tier-chip is-weeks",
  days: "tier-chip is-days",
  queued: "tier-chip is-queued",
  blocked: "tier-chip is-blocked",
};

export function TaskCard({ task }: { task: TaskSummary }) {
  const progress = task.runtimeHours > 0 ? Math.min(100, Math.round((task.computeHoursUsed / task.runtimeHours) * 100)) : 0;
  const rankLabel = task.categoryRank ? `#${task.categoryRank} in ${task.categoryName}` : task.categoryName;

  return (
    <Link href={`/kens/${task.slug}`} className="task-card-link" aria-label={`Open ${task.title}`}>
      <article className="task-card task-feed-card fade-up">
        <div className="task-feed-rail" aria-label="Ken pulse summary">
          <div className="task-feed-score">{task.taskPulseScore > 0 ? `+${task.taskPulseScore}` : task.taskPulseScore}</div>
          <div className="task-feed-score-label">Pulse</div>
          <div className="task-feed-score-meta">{task.discussionCount} comments</div>
        </div>
        <div className="task-feed-body">
          <div className="task-card-header">
            <div className="flex flex-wrap items-center gap-2">
              <span className={tierStyles[task.allocatedTier]}>{labelForTier(task.allocatedTier)}</span>
              <span className="tag">{labelForStage(task.stage)}</span>
              <span className="tag">{rankLabel}</span>
            </div>
            <div className="task-card-meta">Updated {formatDateTime(task.lastActivityAt)}</div>
          </div>
          <div className="task-card-hero-row">
            <div className="task-card-copy">
              <div className="task-card-kicker">Proposed by {task.proposerName} · {formatDateTime(task.createdAt)}</div>
              <h3 className="task-card-title">{task.title}</h3>
              <p className="task-card-summary">{task.summary}</p>
            </div>
            <KenVisual task={task} variant="card" />
          </div>

          <div className="task-card-stat-grid">
            <div className="stat-card"><span>Voice</span><strong>{task.totalVotes}</strong></div>
            <div className="stat-card"><span>Backers</span><strong>{task.supporterCount}</strong></div>
            <div className="stat-card"><span>Pilot users</span><strong>{task.sandboxPilotUsers}</strong></div>
            <div className="stat-card"><span>Sponsor pool</span><strong>{formatCurrency(task.sponsorPoolUsd)}</strong></div>
          </div>

          <div className="task-card-run-line" aria-label="Ken run progress">
            <div>
              <strong>{task.completionSummary}</strong>
              <span>{task.computeHoursUsed} / {task.runtimeHours} sandbox runtime hours</span>
            </div>
            <div className="task-card-progress" aria-hidden="true">
              <span style={{ width: `${progress}%` }} />
            </div>
          </div>

          <div className="task-card-footer">
            <span className="task-card-footer-meta">Sandbox metrics only · not real capital or vendor bills.</span>
            <span className="task-card-footer-meta">Open thread for checkpoints and review.</span>
          </div>
        </div>
      </article>
    </Link>
  );
}
