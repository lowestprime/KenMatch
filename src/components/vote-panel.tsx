"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useEffectEvent, useState } from "react";

import { initialActionState, saveVoteAction } from "@/app/actions";
import { MAX_VOTES_PER_TASK, quadraticCost } from "@/lib/allocation";

interface VotePanelProps {
  taskId: string;
  slug: string;
  initialVotes: number;
  availableCredits: number;
}

export function VotePanel({ taskId, slug, initialVotes, availableCredits }: VotePanelProps) {
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
        <div className="eyebrow">Allocation voice</div>
        <h2 className="mt-3 font-display text-2xl font-semibold text-ink">Allocate scarce compute, not popularity points</h2>
        <p className="mt-2 text-sm leading-7 text-ink/68">
          Quadratic voice expresses intensity while making concentration expensive. Public upvotes shape curation; this panel shapes who actually gets days, weeks, and months of compute.
        </p>
      </div>
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="taskId" value={taskId} />
        <input type="hidden" name="slug" value={slug} />
        <input type="hidden" name="voteCount" value={voteCount} />
        <div className="grid gap-3 sm:grid-cols-3">
          <Metric label="Votes here" value={String(voteCount)} />
          <Metric label="Quadratic cost" value={String(totalCost)} />
          <Metric label="Remaining if saved" value={String(availableCredits - Math.max(delta, 0))} />
        </div>
        <div className="rounded-[1.4rem] border border-line bg-page/72 p-5">
          <div className="flex items-center justify-between gap-3 text-xs uppercase tracking-[0.22em] text-ink/52">
            <span>Support level</span>
            <span>Max {MAX_VOTES_PER_TASK}</span>
          </div>
          <input
            type="range"
            min={0}
            max={MAX_VOTES_PER_TASK}
            step={1}
            value={voteCount}
            onChange={(event) => setVoteCount(Number(event.target.value))}
            className="mt-5 w-full accent-accent"
          />
          <div className="mt-3 flex justify-between text-xs text-ink/52">
            <span>0 = withdraw</span>
            <span>{voteCount > initialVotes ? `+${voteCount - initialVotes} more concentrated votes` : "No extra concentration"}</span>
          </div>
        </div>
        <label className="space-y-2 text-xs uppercase tracking-[0.22em] text-ink/55">
          Allocation rationale
          <textarea
            name="rationale"
            value={rationale}
            onChange={(event) => setRationale(event.target.value)}
            rows={4}
            maxLength={280}
            placeholder="Why should this task receive scarce compute rather than just discussion attention?"
            className="w-full rounded-[1.2rem] border border-line bg-page/75 px-4 py-3 text-sm normal-case tracking-normal text-ink outline-none transition focus:border-accent"
          />
        </label>
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex rounded-full bg-ink px-5 py-3 text-sm font-semibold text-page transition hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Saving allocation" : "Save allocation"}
        </button>
        {state.message ? <p className={`text-sm ${state.status === "error" ? "text-red-700" : "text-accent"}`}>{state.message}</p> : null}
      </form>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.2rem] border border-line bg-page/72 px-4 py-4">
      <div className="text-xs uppercase tracking-[0.22em] text-ink/45">{label}</div>
      <div className="mt-2 font-display text-3xl font-semibold text-ink">{value}</div>
    </div>
  );
}
