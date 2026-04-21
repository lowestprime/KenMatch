import Link from "next/link";

import { KenSandboxStrip } from "@/components/ken-sandbox-strip";
import { KenTimingStrip } from "@/components/ken-timing-strip";
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
              <span className="tag">{task.categoryName}</span>
            </div>
            <div className="task-card-meta">Updated {formatDateTime(task.lastActivityAt)}</div>
          </div>
          <div className="space-y-2">
            <div className="task-card-kicker">Posted by {task.proposerName} · Created {formatDateTime(task.createdAt)}</div>
            <h3 className="task-card-title">{task.title}</h3>
            <p className="text-sm leading-7 text-muted">{task.summary}</p>
          </div>
          <div className="grid gap-3 text-sm text-muted sm:grid-cols-4">
            <div className="stat-card"><span>Voice</span><strong>{task.totalVotes}</strong></div>
            <div className="stat-card"><span>Backers</span><strong>{task.supporterCount}</strong></div>
            <div className="stat-card"><span>Pilot users</span><strong>{task.sandboxPilotUsers}</strong></div>
            <div className="stat-card"><span>Sponsor pool</span><strong>{formatCurrency(task.sponsorPoolUsd)}</strong></div>
          </div>
          <KenSandboxStrip ken={task} compact />
          <KenTimingStrip ken={task} compact />
          <div className="task-card-callout">
            <div className="eyebrow">Who else could use this</div>
            <p className="mt-2 line-clamp-3 text-sm leading-7 text-muted">{task.enterprisePackaging}</p>
          </div>
          <div className="task-card-footer">
            <span className="task-card-footer-meta line-clamp-3">{task.sampleOutcome}</span>
          </div>
        </div>
      </article>
    </Link>
  );
}
