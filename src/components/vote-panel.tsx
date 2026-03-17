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
        <div className="eyebrow">Quadratic voice</div>
        <h2 className="mt-3 font-display text-2xl font-semibold text-ink">Allocate earned credits</h2>
        <p className="mt-2 text-sm leading-7 text-ink/68">
          KenMatch uses quadratic voting: the cost of concentrated support rises non-linearly, so intense preference is
          expressible without turning the board into a pure wealth proxy.
        </p>
      </div>
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="taskId" value={taskId} />
        <input type="hidden" name="slug" value={slug} />
        <input type="hidden" name="voteCount" value={voteCount} />
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-[1.2rem] border border-ink/10 bg-white px-4 py-4">
            <div className="text-xs uppercase tracking-[0.22em] text-ink/45">Your votes here</div>
            <div className="mt-2 font-display text-3xl font-semibold text-ink">{voteCount}</div>
          </div>
          <div className="rounded-[1.2rem] border border-ink/10 bg-white px-4 py-4">
            <div className="text-xs uppercase tracking-[0.22em] text-ink/45">Quadratic cost</div>
            <div className="mt-2 font-display text-3xl font-semibold text-ink">{totalCost}</div>
          </div>
          <div className="rounded-[1.2rem] border border-ink/10 bg-white px-4 py-4">
            <div className="text-xs uppercase tracking-[0.22em] text-ink/45">Remaining if saved</div>
            <div className="mt-2 font-display text-3xl font-semibold text-ink">{availableCredits - Math.max(delta, 0)}</div>
          </div>
        </div>
        <label className="space-y-2 text-xs uppercase tracking-[0.22em] text-ink/55">
          Support level
          <input
            type="range"
            min={0}
            max={MAX_VOTES_PER_TASK}
            step={1}
            value={voteCount}
            onChange={(event) => setVoteCount(Number(event.target.value))}
            className="w-full accent-teal"
          />
        </label>
        <div className="flex items-center justify-between text-sm text-ink/62">
          <span>0 means withdraw support.</span>
          <span>Max per task: {MAX_VOTES_PER_TASK} votes</span>
        </div>
        <label className="space-y-2 text-xs uppercase tracking-[0.22em] text-ink/55">
          Rationale
          <textarea
            name="rationale"
            value={rationale}
            onChange={(event) => setRationale(event.target.value)}
            rows={4}
            maxLength={280}
            placeholder="Why should this task receive scarce compute?"
            className="w-full rounded-[1.2rem] border border-ink/10 bg-white px-4 py-3 text-sm normal-case tracking-normal text-ink outline-none transition focus:border-teal"
          />
        </label>
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex rounded-full bg-ink px-5 py-3 text-sm font-semibold text-paper transition hover:bg-teal disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Saving vote" : "Save allocation"}
        </button>
        {state.message ? (
          <p className={`text-sm ${state.status === "error" ? "text-red-700" : "text-teal"}`}>{state.message}</p>
        ) : null}
      </form>
    </div>
  );
}