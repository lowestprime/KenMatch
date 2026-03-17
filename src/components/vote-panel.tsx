"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useEffectEvent, useState } from "react";

import { initialActionState } from "@/app/action-state";
import { saveVoteAction } from "@/app/actions";
import { MAX_VOTES_PER_TASK, quadraticCost } from "@/lib/allocation";

export function VotePanel({ taskId, slug, initialVotes, availableCredits, disabled }: { taskId: string; slug: string; initialVotes: number; availableCredits: number; disabled?: boolean }) {
  const router = useRouter();
  const [voteCount, setVoteCount] = useState(initialVotes);
  const [rationale, setRationale] = useState("");
  const [state, formAction, isPending] = useActionState(saveVoteAction, initialActionState);
  const totalCost = quadraticCost(voteCount);
  const delta = totalCost - quadraticCost(initialVotes);
  const syncRefresh = useEffectEvent(() => {
    if (state.status === "success") {
      router.refresh();
    }
  });

  useEffect(() => {
    syncRefresh();
  }, [state.status]);

  return (
    <div className="panel space-y-5">
      <div>
        <div className="eyebrow">Quadratic voice</div>
        <h2 className="mt-2 font-display text-2xl font-semibold text-foreground">Allocate scarce merit credits</h2>
        <p className="mt-2 text-sm leading-7 text-muted">
          Concentrated support costs more than broad support. This keeps the board responsive to intensity without collapsing into pay-to-win ranking.
        </p>
      </div>
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="taskId" value={taskId} />
        <input type="hidden" name="slug" value={slug} />
        <input type="hidden" name="voteCount" value={voteCount} />
        <div className="metric-grid">
          <div className="metric-card"><div className="eyebrow">Votes here</div><div className="metric-value">{voteCount}</div></div>
          <div className="metric-card"><div className="eyebrow">Quadratic cost</div><div className="metric-value">{totalCost}</div></div>
          <div className="metric-card"><div className="eyebrow">Free after save</div><div className="metric-value">{availableCredits - Math.max(delta, 0)}</div></div>
        </div>
        <label className="space-y-2 text-xs uppercase tracking-[0.22em] text-muted">
          Support level
          <input type="range" min={0} max={MAX_VOTES_PER_TASK} step={1} value={voteCount} onChange={(event) => setVoteCount(Number(event.target.value))} className="w-full accent-[var(--color-teal)]" disabled={disabled || isPending} />
        </label>
        <label className="space-y-2 text-xs uppercase tracking-[0.22em] text-muted">
          Rationale
          <textarea name="rationale" value={rationale} onChange={(event) => setRationale(event.target.value)} rows={4} maxLength={280} placeholder="Why should this task receive scarce compute?" className="field" disabled={disabled || isPending} />
        </label>
        <button type="submit" disabled={disabled || isPending} className="cta-primary">
          {isPending ? "Saving allocation" : "Save allocation"}
        </button>
        {state.message ? <p className={`text-sm ${state.status === "error" ? "text-red-500" : "text-teal"}`}>{state.message}</p> : null}
      </form>
    </div>
  );
}
