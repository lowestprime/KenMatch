"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import { initialActionState } from "@/app/action-state";
import { resendVerificationAction, signInAction, signUpAction } from "@/app/actions";
import { AbuseGuardFields } from "@/components/abuse-guard-fields";

export function AuthPanels() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [signInState, signInFormAction, signInPending] = useActionState(signInAction, initialActionState);
  const [signUpState, signUpFormAction, signUpPending] = useActionState(signUpAction, initialActionState);
  const [resendState, resendAction, resendPending] = useActionState(resendVerificationAction, initialActionState);
  const state = mode === "signin" ? signInState : signUpState;
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  return (
    <div className="panel grid gap-5">
      <div className="auth-switcher">
        <button type="button" className={mode === "signin" ? "is-active" : ""} onClick={() => setMode("signin")}>
          Sign in
        </button>
        <button type="button" className={mode === "signup" ? "is-active" : ""} onClick={() => setMode("signup")}>
          Create account
        </button>
      </div>

      <div className="alert">
        Accounts make public participation attributable. Reading stays open, while comments, votes, and submissions are tied to a visible identity, attestation review, and verified sign-in state.
      </div>

      {mode === "signin" ? (
        <form action={signInFormAction} className="form-grid">
          <Field label="Email" name="email" type="email" error={state.fieldErrors?.email} />
          <Field label="Password" name="password" type="password" error={state.fieldErrors?.password} />
          <AbuseGuardFields action="sign-in" siteKey={turnstileSiteKey} />
          <button className="cta-primary" type="submit" disabled={signInPending}>
            {signInPending ? "Signing in…" : "Sign in"}
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
                  {resendPending ? "Sending…" : "Resend link"}
                </button>
              </form>
              {resendState.message ? (
                <p className={`alert ${resendState.status === "error" ? "alert-error" : "alert-success"} mt-2`}>
                  {resendState.message}
                </p>
              ) : null}
            </details>
          </div>
        </form>
      ) : (
        <form action={signUpFormAction} className="form-grid">
          <div className="form-grid form-grid-two">
            <Field label="Name" name="name" error={state.fieldErrors?.name} />
            <Field label="Role" name="role" error={state.fieldErrors?.role} />
            <Field label="Specialty" name="specialty" error={state.fieldErrors?.specialty} />
            <Field label="Email" name="email" type="email" error={state.fieldErrors?.email} />
          </div>
          <Field label="Password" name="password" type="password" error={state.fieldErrors?.password} />
          <Field label="Confirm password" name="confirmPassword" type="password" error={state.fieldErrors?.confirmPassword} />
          <Field label="Bio" name="bio" as="textarea" rows={4} error={state.fieldErrors?.bio} />
          <label className="alert flex items-start gap-3">
            <input className="mt-1" type="checkbox" name="licensingConsent" value="allow-screened-licensing" />
            <span>
              Allow my screened corrections and evaluation traces to be considered for future licensing programs. If left unchecked, contributions remain public-audit only.
            </span>
          </label>
          <AbuseGuardFields action="sign-up" siteKey={turnstileSiteKey} />
          <button className="cta-primary" type="submit" disabled={signUpPending}>
            {signUpPending ? "Creating account…" : "Create account"}
          </button>
          <p className="text-xs text-muted">
            After signup we send a verification email. Click the link inside to activate your account.
          </p>
        </form>
      )}

      {state.message ? (
        <p className={`alert ${state.status === "error" ? "alert-error" : "alert-success"}`}>{state.message}</p>
      ) : null}
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
    <label className="field-label">
      <span>{label}</span>
      {as === "textarea" ? (
        <textarea name={name} rows={rows} className="field" />
      ) : (
        <input name={name} type={type} className="field" autoComplete={type === "password" ? "current-password" : undefined} />
      )}
      {error ? <span className="text-red-500 text-xs">{error}</span> : null}
    </label>
  );
}
