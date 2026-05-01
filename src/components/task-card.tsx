import Link from "next/link";

import { CategoryFilterChip, LaneFilterChip } from "@/components/filter-chip-link";
import { KenVisual } from "@/components/ken-visual";
import { formatCurrency, formatDateTime, labelForStage } from "@/lib/utils";
import type { TaskSummary } from "@/lib/types";

export function TaskCard({ task }: { task: TaskSummary }) {
  const progress = task.runtimeHours > 0 ? Math.min(100, Math.round((task.computeHoursUsed / task.runtimeHours) * 100)) : 0;

  return (
    <article className="task-card task-feed-card fade-up interactive-surface">
        <div className="task-feed-rail" aria-label="Ken pulse summary">
          <div className="task-feed-score">{task.taskPulseScore > 0 ? `+${task.taskPulseScore}` : task.taskPulseScore}</div>
          <div className="task-feed-score-label">Pulse</div>
          <div className="task-feed-score-meta">{task.discussionCount} comments</div>
        </div>
        <div className="task-feed-body">
          <div className="task-card-header">
            <div className="flex flex-wrap items-center gap-2">
              <LaneFilterChip tier={task.allocatedTier} />
              <span className="tag">{labelForStage(task.stage)}</span>
              <CategoryFilterChip slug={task.categorySlug} label={task.categoryName} rank={task.categoryRank} />
            </div>
            <div className="task-card-meta">Updated {formatDateTime(task.lastActivityAt)}</div>
          </div>
          <div className="task-card-hero-row">
            <div className="task-card-copy">
              <div className="task-card-kicker">Proposed by {task.proposerName} · {formatDateTime(task.createdAt)}</div>
              <h3 className="task-card-title">
                <Link href={`/kens/${task.slug}`} aria-label={`Open ${task.title}`}>{task.title}</Link>
              </h3>
              <p className="task-card-summary">{task.summary}</p>
            </div>
            <Link href={`/kens/${task.slug}`} className="task-card-visual-link" aria-label={`Open ${task.title}`}>
              <KenVisual task={task} variant="card" />
            </Link>
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
            <Link href={`/kens/${task.slug}`} className="task-card-footer-meta task-card-open-link">
              Open thread for checkpoints and review.
            </Link>
          </div>
        </div>
    </article>
  );
}
