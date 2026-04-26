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
        <div className="eyebrow">Pulse vote</div>
        <h2 className="mt-2 font-display text-2xl font-semibold text-foreground">Forum-style signal</h2>
        <p className="mt-2 text-sm leading-7 text-muted">
          Pulse is the fast Reddit-like signal. Allocation credits stay separate and cost more as one account concentrates voice on one Ken.
        </p>
      </div>
      <form action={formAction} className="grid gap-3">
        <input type="hidden" name="taskId" value={taskId} />
        <input type="hidden" name="slug" value={slug} />
        <div className="pulse-compact-row">
          <PulseButton label={`▲ ${positivePulseCount}`} current={userPulse === 1} value={userPulse === 1 ? 0 : 1} disabled={disabled || isPending} />
          <strong>{positivePulseCount - negativePulseCount > 0 ? `+${positivePulseCount - negativePulseCount}` : positivePulseCount - negativePulseCount}</strong>
          <PulseButton label={`▼ ${negativePulseCount}`} current={userPulse === -1} value={userPulse === -1 ? 0 : -1} disabled={disabled || isPending} />
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
