"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useEffectEvent } from "react";

import { initialActionState, saveTaskPulseVoteAction } from "@/app/actions";

interface TaskPulsePanelProps {
  taskId: string;
  slug: string;
  initialValue: number;
  score: number;
  upvotes: number;
  downvotes: number;
  compact?: boolean;
}

export function TaskPulsePanel({ taskId, slug, initialValue, score, upvotes, downvotes, compact = false }: TaskPulsePanelProps) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(saveTaskPulseVoteAction, initialActionState);
  const syncRefresh = useEffectEvent(() => {
    if (state.status === "success") {
      router.refresh();
    }
  });

  useEffect(() => {
    syncRefresh();
  }, [state.status]);

  const shellClass = compact ? "rounded-[1.2rem] border border-line bg-panel/82 p-3" : "rounded-[1.4rem] border border-line bg-panel/88 p-4";
  const valueLabel = score > 0 ? `+${score}` : String(score);

  return (
    <form action={formAction} className={`${shellClass} space-y-3`}>
      <input type="hidden" name="taskId" value={taskId} />
      <input type="hidden" name="slug" value={slug} />
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-[0.68rem] uppercase tracking-[0.22em] text-ink/50">Public signal</div>
          <div className="mt-1 font-display text-2xl font-semibold text-ink">{valueLabel}</div>
        </div>
        <div className="text-right text-xs uppercase tracking-[0.18em] text-ink/45">
          <div>{upvotes} up</div>
          <div>{downvotes} down</div>
        </div>
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          name="value"
          value={initialValue === 1 ? 0 : 1}
          disabled={isPending}
          className={`flex-1 rounded-full border px-4 py-2 text-sm font-semibold transition ${
            initialValue === 1
              ? "border-accent bg-accent text-white"
              : "border-line bg-transparent text-ink hover:border-accent hover:text-accent"
          }`}
        >
          ▲ Upvote
        </button>
        <button
          type="submit"
          name="value"
          value={initialValue === -1 ? 0 : -1}
          disabled={isPending}
          className={`flex-1 rounded-full border px-4 py-2 text-sm font-semibold transition ${
            initialValue === -1
              ? "border-ember bg-ember text-white"
              : "border-line bg-transparent text-ink hover:border-ember hover:text-ember"
          }`}
        >
          ▼ Downvote
        </button>
      </div>
      {state.message ? <p className={`text-xs ${state.status === "error" ? "text-red-700" : "text-accent"}`}>{state.message}</p> : null}
    </form>
  );
}
