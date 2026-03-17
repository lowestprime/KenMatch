import Link from "next/link";

import { compactWords, formatCurrency, labelForStage, labelForTier } from "@/lib/utils";
import type { TaskSummary } from "@/lib/types";

interface TaskCardProps {
  task: TaskSummary;
}

const tierStyles: Record<TaskSummary["allocatedTier"], string> = {
  months: "bg-ink text-paper",
  weeks: "bg-teal text-paper",
  days: "bg-ember text-paper",
  queued: "bg-white text-ink border border-ink/10",
  blocked: "bg-red-100 text-red-900",
};

export function TaskCard({ task }: TaskCardProps) {
  return (
    <article className="panel flex h-full flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] ${tierStyles[task.allocatedTier]}`}>
          {labelForTier(task.allocatedTier)}
        </span>
        <span className="rounded-full border border-ink/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-ink/65">
          {labelForStage(task.stage)}
        </span>
        <span className="rounded-full border border-ink/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-ink/65">
          {task.categoryName}
        </span>
      </div>
      <div className="space-y-3">
        <div className="font-display text-2xl font-semibold text-ink">{task.title}</div>
        <p className="text-sm leading-7 text-ink/72">{compactWords(task.summary, 130)}</p>
      </div>
      <div className="grid gap-3 text-sm text-ink/72 sm:grid-cols-3">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-ink/45">Quadratic votes</div>
          <div className="mt-1 font-display text-xl font-semibold text-ink">{task.totalVotes}</div>
        </div>
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-ink/45">Budget</div>
          <div className="mt-1 font-display text-xl font-semibold text-ink">{formatCurrency(task.budgetUsd)}</div>
        </div>
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-ink/45">Rank in category</div>
          <div className="mt-1 font-display text-xl font-semibold text-ink">{task.categoryRank ?? "-"}</div>
        </div>
      </div>
      <div className="mt-auto flex items-center justify-between gap-4 border-t border-ink/8 pt-4 text-sm text-ink/65">
        <span>Proposed by {task.proposerName}</span>
        <Link href={`/tasks/${task.slug}`} className="font-semibold text-teal transition hover:text-ink">
          Open proposal
        </Link>
      </div>
    </article>
  );
}