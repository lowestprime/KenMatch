"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import { initialActionState } from "@/app/action-state";
import { resendVerificationAction, signInAction, signUpAction } from "@/app/actions";
import { AbuseGuardFields } from "@/components/abuse-guard-fields";

export function AuthPanels({
  turnstileSiteKey,
}: {
  turnstileSiteKey?: string;
}) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [signInState, signInFormAction, signInPending] = useActionState(signInAction, initialActionState);
  const [signUpState, signUpFormAction, signUpPending] = useActionState(signUpAction, initialActionState);
  const [resendState, resendAction, resendPending] = useActionState(resendVerificationAction, initialActionState);
  const state = mode === "signin" ? signInState : signUpState;

  return (
    <div className="panel space-y-6">
      <div className="auth-switcher" role="tablist" aria-label="Authentication method">
        <button type="button" role="tab" aria-selected={mode === "signin"} className={mode === "signin" ? "is-active" : ""} onClick={() => setMode("signin")}>
          Sign in
        </button>
        <button type="button" role="tab" aria-selected={mode === "signup"} className={mode === "signup" ? "is-active" : ""} onClick={() => setMode("signup")}>
          Create account
        </button>
      </div>

      <div className="rounded-[1.3rem] border border-border bg-background/55 p-4 text-sm leading-7 text-muted">
        Your account makes your participation visible and accountable. Reading is always open — accounts are needed for voting, commenting, and proposing projects.
      </div>

      {mode === "signin" ? (
        <form action={signInFormAction} className="grid gap-4">
          <Field label="Email" name="email" type="email" autoComplete="email" required error={state.fieldErrors?.email} />
          <Field label="Password" name="password" type="password" autoComplete="current-password" required error={state.fieldErrors?.password} />
          <AbuseGuardFields action="sign-in" siteKey={turnstileSiteKey} />
          <button className="cta-primary" type="submit" disabled={signInPending}>
            {signInPending ? "Signing in" : "Sign in"}
          </button>
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
            <Link href="/forgot-password" className="underline">
              Forgot your password?
            </Link>
            <details>
              <summary className="cursor-pointer">Resend verification email</summary>
              <form action={resendAction} className="mt-3 flex flex-wrap items-center gap-2">
                <input
                  type="email"
                  name="email"
                  placeholder="you@example.com"
                  className="field"
                  style={{ flex: 1, minWidth: "14rem" }}
                  required
                />
                <button className="cta-secondary cta-compact" type="submit" disabled={resendPending}>
                  {resendPending ? "Sending" : "Resend link"}
                </button>
              </form>
              {resendState.message ? (
                <p className={`mt-2 text-xs ${resendState.status === "error" ? "text-red-500" : "text-teal"}`}>{resendState.message}</p>
              ) : null}
            </details>
          </div>
        </form>
      ) : (
        <form action={signUpFormAction} className="grid gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Name" name="name" autoComplete="name" required error={state.fieldErrors?.name} />
            <Field label="Role" name="role" autoComplete="organization-title" required error={state.fieldErrors?.role} />
            <Field label="Specialty" name="specialty" required error={state.fieldErrors?.specialty} />
            <Field label="Email" name="email" type="email" autoComplete="email" required error={state.fieldErrors?.email} />
          </div>
          <Field label="Password" name="password" type="password" autoComplete="new-password" required error={state.fieldErrors?.password} />
          <Field label="Confirm password" name="confirmPassword" type="password" autoComplete="new-password" required error={state.fieldErrors?.confirmPassword} />
          <Field label="Bio" name="bio" as="textarea" rows={4} required error={state.fieldErrors?.bio} />
          <div className="rounded-[1.2rem] border border-border bg-background/55 p-4 text-sm leading-7 text-muted">
            <label className="flex items-start gap-3">
              <input className="mt-1" type="checkbox" name="licensingConsent" value="allow-screened-licensing" />
              <span>
                Allow my screened corrections and evaluation traces to be considered for future licensing programs.
                If left unchecked, contributions remain public-audit only.
              </span>
            </label>
          </div>
          <AbuseGuardFields action="sign-up" siteKey={turnstileSiteKey} />
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
  autoComplete,
  required,
  error,
}: {
  label: string;
  name: string;
  type?: string;
  as?: "textarea";
  rows?: number;
  autoComplete?: string;
  required?: boolean;
  error?: string;
}) {
  return (
    <label className="space-y-2 text-xs uppercase tracking-[0.22em] text-muted">
      {label}
      {as === "textarea" ? (
        <textarea name={name} rows={rows} className="field" autoComplete={autoComplete} required={required} />
      ) : (
        <input name={name} type={type} className="field" autoComplete={autoComplete} required={required} />
      )}
      {error ? <span className="text-red-500">{error}</span> : null}
    </label>
  );
}
