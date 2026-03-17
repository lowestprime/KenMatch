import Link from "next/link";

import { TaskPulsePanel } from "@/components/task-pulse-panel";
import { compactWords, formatCurrency, labelForStage, labelForTier } from "@/lib/utils";
import type { TaskSummary } from "@/lib/types";

interface TaskCardProps {
  task: TaskSummary;
}

const tierStyles: Record<TaskSummary["allocatedTier"], string> = {
  months: "bg-ink text-page",
  weeks: "bg-accent text-white",
  days: "bg-ember text-white",
  queued: "bg-page text-ink border border-line",
  blocked: "bg-red-100 text-red-900",
};

export function TaskCard({ task }: TaskCardProps) {
  return (
    <article className="panel card-sheen flex h-full flex-col gap-5">
      <div className="flex flex-wrap items-center gap-2">
        <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] ${tierStyles[task.allocatedTier]}`}>
          {labelForTier(task.allocatedTier)}
        </span>
        <span className="rounded-full border border-line px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-ink/65">
          {labelForStage(task.stage)}
        </span>
        <span className="rounded-full border border-line px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-ink/65">
          {task.categoryName}
        </span>
      </div>
      <div className="space-y-3">
        <div className="font-display text-2xl font-semibold text-ink">{task.title}</div>
        <p className="text-sm leading-7 text-ink/72">{compactWords(task.summary, 150)}</p>
      </div>
      <div className="grid gap-3 text-sm text-ink/72 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Quadratic votes" value={String(task.totalVotes)} />
        <Metric label="Discussion" value={String(task.discussionCount)} />
        <Metric label="Sponsor pool" value={formatCurrency(task.sponsorPoolUsd)} />
        <Metric label="Bond" value={String(task.qualityBondCredits)} />
      </div>
      <TaskPulsePanel
        taskId={task.id}
        slug={task.slug}
        initialValue={task.userTaskPulse}
        score={task.taskPulseScore}
        upvotes={task.positivePulseCount}
        downvotes={task.negativePulseCount}
        compact
      />
      <div className="mt-auto flex items-center justify-between gap-4 border-t border-line pt-4 text-sm text-ink/65">
        <div>
          <div>Proposed by {task.proposerName}</div>
          <div className="text-xs uppercase tracking-[0.16em] text-ink/45">rank {task.categoryRank ?? "-"} · {formatCurrency(task.budgetUsd)}</div>
        </div>
        <Link href={`/tasks/${task.slug}`} className="font-semibold text-accent transition hover:text-ink">
          Open proposal
        </Link>
      </div>
    </article>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-[0.2em] text-ink/45">{label}</div>
      <div className="mt-1 font-display text-xl font-semibold text-ink">{value}</div>
    </div>
  );
}
