"use client";

import { useActionState } from "react";

import { initialActionState } from "@/app/action-state";
import { forgotPasswordAction } from "@/app/actions";

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(forgotPasswordAction, initialActionState);
  return (
    <form action={formAction} className="form-grid">
      <label className="field-label">
        <span>Email</span>
        <input name="email" type="email" className="field" required autoComplete="email" />
      </label>
      <button type="submit" className="cta-primary" disabled={pending}>
        {pending ? "Sending reset link…" : "Send reset link"}
      </button>
      {state.message ? (
        <p className={`alert ${state.status === "error" ? "alert-error" : "alert-success"}`}>{state.message}</p>
      ) : null}
    </form>
  );
}
