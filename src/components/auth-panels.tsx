"use client";

import { useActionState, useState } from "react";

import { initialActionState } from "@/app/action-state";
import { signInAction, signUpAction } from "@/app/actions";

export function AuthPanels() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [signInState, signInFormAction, signInPending] = useActionState(signInAction, initialActionState);
  const [signUpState, signUpFormAction, signUpPending] = useActionState(signUpAction, initialActionState);
  const state = mode === "signin" ? signInState : signUpState;

  return (
    <div className="panel space-y-6">
      <div className="auth-switcher">
        <button type="button" className={mode === "signin" ? "is-active" : ""} onClick={() => setMode("signin")}>
          Sign in
        </button>
        <button type="button" className={mode === "signup" ? "is-active" : ""} onClick={() => setMode("signup")}>
          Create account
        </button>
      </div>

      <div className="rounded-[1.3rem] border border-border bg-background/55 p-4 text-sm leading-7 text-muted">
        Accounts make public participation attributable. Reading stays open, while comments, votes, and submissions are tied to a visible identity, attestation review, and an account-backed sign-in state.
      </div>

      {mode === "signin" ? (
        <form action={signInFormAction} className="grid gap-4">
          <Field label="Email" name="email" type="email" error={state.fieldErrors?.email} />
          <Field label="Password" name="password" type="password" error={state.fieldErrors?.password} />
          <button className="cta-primary" type="submit" disabled={signInPending}>
            {signInPending ? "Signing in" : "Sign in"}
          </button>
        </form>
      ) : (
        <form action={signUpFormAction} className="grid gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Name" name="name" error={state.fieldErrors?.name} />
            <Field label="Role" name="role" error={state.fieldErrors?.role} />
            <Field label="Specialty" name="specialty" error={state.fieldErrors?.specialty} />
            <Field label="Email" name="email" type="email" error={state.fieldErrors?.email} />
          </div>
          <Field label="Password" name="password" type="password" error={state.fieldErrors?.password} />
          <Field label="Bio" name="bio" as="textarea" rows={4} error={state.fieldErrors?.bio} />
          <button className="cta-primary" type="submit" disabled={signUpPending}>
            {signUpPending ? "Creating account" : "Create account"}
          </button>
        </form>
      )}

      {state.message ? <p className={`text-sm ${state.status === "error" ? "text-red-500" : "text-teal"}`}>{state.message}</p> : null}
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  as,
  rows = 3,
  error,
}: {
  label: string;
  name: string;
  type?: string;
  as?: "textarea";
  rows?: number;
  error?: string;
}) {
  return (
    <label className="space-y-2 text-xs uppercase tracking-[0.22em] text-muted">
      {label}
      {as === "textarea" ? (
        <textarea name={name} rows={rows} className="field" />
      ) : (
        <input name={name} type={type} className="field" />
      )}
      {error ? <span className="text-red-500">{error}</span> : null}
    </label>
  );
}

