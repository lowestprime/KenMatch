"use client";

import { useActionState } from "react";

import { initialActionState } from "@/app/action-state";
import { resetPasswordAction } from "@/app/actions";

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState(resetPasswordAction, initialActionState);
  return (
    <form action={formAction} className="form-grid">
      <input type="hidden" name="token" value={token} />
      <label className="field-label">
        <span>New password</span>
        <input
          name="password"
          type="password"
          className="field"
          required
          autoComplete="new-password"
          minLength={12}
        />
      </label>
      <label className="field-label">
        <span>Confirm password</span>
        <input
          name="confirmPassword"
          type="password"
          className="field"
          required
          autoComplete="new-password"
          minLength={12}
        />
      </label>
      <button type="submit" className="cta-primary" disabled={pending}>
        {pending ? "Saving…" : "Save new password"}
      </button>
      {state.message ? (
        <p className={`alert ${state.status === "error" ? "alert-error" : "alert-success"}`}>{state.message}</p>
      ) : null}
    </form>
  );
}
