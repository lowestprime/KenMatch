import Link from "next/link";

import { formatCurrency, labelForStage, labelForTier } from "@/lib/utils";
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
    <article className="task-card fade-up">
      <div className="flex flex-wrap items-center gap-2">
        <span className={tierStyles[task.allocatedTier]}>{labelForTier(task.allocatedTier)}</span>
        <span className="tag">{labelForStage(task.stage)}</span>
        <span className="tag">{task.categoryName}</span>
      </div>
      <div className="space-y-3">
        <h3 className="font-display text-2xl font-semibold text-foreground">{task.title}</h3>
        <p className="text-sm leading-7 text-muted">{task.summary}</p>
      </div>
      <div className="grid gap-3 text-sm text-muted sm:grid-cols-2">
        <div className="stat-card"><span>Quadratic votes</span><strong>{task.totalVotes}</strong></div>
        <div className="stat-card"><span>Pulse score</span><strong>{task.taskPulseScore}</strong></div>
        <div className="stat-card"><span>Discussion</span><strong>{task.discussionCount}</strong></div>
        <div className="stat-card"><span>Budget lane</span><strong>{formatCurrency(task.budgetUsd)}</strong></div>
      </div>
      <div className="rounded-[1.3rem] border border-border bg-background/50 p-4 text-sm text-muted">
        <div className="font-medium text-foreground">Revenue and deployment path</div>
        <p className="mt-2 line-clamp-3">{task.enterprisePackaging}</p>
      </div>
      <div className="mt-auto flex items-center justify-between gap-4 border-t border-border pt-4 text-sm text-muted">
        <span>By {task.proposerName}</span>
        <Link href={`/tasks/${task.slug}`} className="font-semibold text-teal transition hover:text-foreground">
          Open proposal
        </Link>
      </div>
    </article>
  );
}
