"use client";

import { useActionState } from "react";

import { initialActionState } from "@/app/action-state";
import { saveTaskPulseAction } from "@/app/actions";

export function TaskPulsePanel({
  taskId,
  slug,
  userPulse,
  positivePulseCount,
  negativePulseCount,
  disabled,
  disabledMessage,
}: {
  taskId: string;
  slug: string;
  userPulse: number;
  positivePulseCount: number;
  negativePulseCount: number;
  disabled?: boolean;
  disabledMessage?: string;
}) {
  const [state, formAction, isPending] = useActionState(saveTaskPulseAction, initialActionState);

  return (
    <div className="panel space-y-4">
      <div>
        <div className="eyebrow">Quick pulse</div>
        <h2 className="mt-2 font-display text-2xl font-semibold text-foreground">Fast upvotes and downvotes for the public feed</h2>
        <p className="mt-2 text-sm leading-7 text-muted">
          Anyone with an approved participation state can leave an upvote or downvote. It is the fast community signal and stays separate from the slower priority-credit system.
        </p>
      </div>
      <form action={formAction} className="grid gap-3">
        <input type="hidden" name="taskId" value={taskId} />
        <input type="hidden" name="slug" value={slug} />
        <div className="grid gap-3 sm:grid-cols-2">
          <PulseButton label="Upvote" current={userPulse === 1} value={userPulse === 1 ? 0 : 1} disabled={disabled || isPending} />
          <PulseButton label="Downvote" current={userPulse === -1} value={userPulse === -1 ? 0 : -1} disabled={disabled || isPending} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2 text-sm text-muted">
          <div className="stat-card">
            <span>Upvotes</span>
            <strong>{positivePulseCount}</strong>
          </div>
          <div className="stat-card">
            <span>Downvotes</span>
            <strong>{negativePulseCount}</strong>
          </div>
        </div>
        {disabled ? <p className="text-sm text-muted">{disabledMessage ?? "Sign in to vote publicly on this Ken."}</p> : null}
        {state.message ? <p className={`text-sm ${state.status === "error" ? "text-red-500" : "text-teal"}`}>{state.message}</p> : null}
      </form>
    </div>
  );
}

function PulseButton({ label, value, current, disabled }: { label: string; value: number; current: boolean; disabled?: boolean }) {
  return (
    <button className={`pulse-button ${current ? "is-active" : ""}`} type="submit" name="value" value={String(value)} disabled={disabled}>
      {label}
    </button>
  );
}
