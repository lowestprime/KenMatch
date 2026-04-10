"use client";

import { useActionState } from "react";

import { initialActionState } from "@/app/action-state";
import { changePasswordAction, updateLicensingConsentAction, updateProfileAction } from "@/app/actions";
import type { ViewerSession } from "@/lib/types";

export function AccountSettingsPanels({ viewer }: { viewer: ViewerSession }) {
  return (
    <div className="section-grid" data-columns="2">
      <ProfileForm viewer={viewer} />
      <div className="space-y-6">
        <PasswordForm />
        <ConsentForm viewer={viewer} />
      </div>
    </div>
  );
}

function ProfileForm({ viewer }: { viewer: ViewerSession }) {
  const [state, action, isPending] = useActionState(updateProfileAction, initialActionState);
  const errorFor = (field: string) => state.fieldErrors?.[field];

  return (
    <form action={action} className="panel space-y-5">
      <div>
        <div className="eyebrow">Public profile</div>
        <h2 className="mt-2 font-display text-2xl font-semibold text-foreground">How you appear to others</h2>
      </div>
      <SettingsField label="Name" name="name" defaultValue={viewer.profile.name} error={errorFor("name")} disabled={isPending} />
      <SettingsField label="Role" name="role" defaultValue={viewer.profile.role} error={errorFor("role")} disabled={isPending} />
      <SettingsField label="Specialty" name="specialty" defaultValue={viewer.profile.specialty} error={errorFor("specialty")} disabled={isPending} />
      <SettingsField label="Bio" name="bio" as="textarea" rows={4} defaultValue={viewer.profile.bio} error={errorFor("bio")} disabled={isPending} />
      <button type="submit" className="cta-primary" disabled={isPending}>{isPending ? "Saving" : "Save profile"}</button>
      {state.message ? <p className={`text-sm ${state.status === "error" ? "text-red-500" : "text-teal"}`}>{state.message}</p> : null}
    </form>
  );
}

function PasswordForm() {
  const [state, action, isPending] = useActionState(changePasswordAction, initialActionState);
  const errorFor = (field: string) => state.fieldErrors?.[field];

  return (
    <form action={action} className="panel space-y-5">
      <div>
        <div className="eyebrow">Security</div>
        <h2 className="mt-2 font-display text-2xl font-semibold text-foreground">Change password</h2>
      </div>
      <SettingsField label="Current password" name="currentPassword" type="password" autoComplete="current-password" error={errorFor("currentPassword")} disabled={isPending} />
      <SettingsField label="New password" name="newPassword" type="password" autoComplete="new-password" error={errorFor("newPassword")} disabled={isPending} />
      <SettingsField label="Confirm new password" name="confirmNewPassword" type="password" autoComplete="new-password" error={errorFor("confirmNewPassword")} disabled={isPending} />
      <button type="submit" className="cta-primary" disabled={isPending}>{isPending ? "Changing" : "Change password"}</button>
      {state.message ? <p className={`text-sm ${state.status === "error" ? "text-red-500" : "text-teal"}`}>{state.message}</p> : null}
    </form>
  );
}

function ConsentForm({ viewer }: { viewer: ViewerSession }) {
  const [state, action, isPending] = useActionState(updateLicensingConsentAction, initialActionState);

  return (
    <form action={action} className="panel space-y-5">
      <div>
        <div className="eyebrow">Data preferences</div>
        <h2 className="mt-2 font-display text-2xl font-semibold text-foreground">Licensing consent</h2>
      </div>
      <label className="flex items-start gap-3 text-sm leading-7 text-muted">
        <input className="mt-1" type="checkbox" name="licensingConsent" value="allow-screened-licensing" defaultChecked={viewer.profile.attestation.includes("screened")} />
        <span>Allow my screened corrections and evaluation traces to be considered for future licensing programs. If left unchecked, contributions remain public-audit only.</span>
      </label>
      <button type="submit" className="cta-secondary" disabled={isPending}>{isPending ? "Saving" : "Update consent"}</button>
      {state.message ? <p className={`text-sm ${state.status === "error" ? "text-red-500" : "text-teal"}`}>{state.message}</p> : null}
    </form>
  );
}

function SettingsField({
  label,
  name,
  type = "text",
  as,
  rows = 3,
  autoComplete,
  defaultValue,
  error,
  disabled,
}: {
  label: string;
  name: string;
  type?: string;
  as?: "textarea";
  rows?: number;
  autoComplete?: string;
  defaultValue?: string;
  error?: string;
  disabled?: boolean;
}) {
  return (
    <label className="space-y-2 text-xs uppercase tracking-[0.22em] text-muted">
      {label}
      {as === "textarea" ? (
        <textarea name={name} rows={rows} className="field" autoComplete={autoComplete} defaultValue={defaultValue} disabled={disabled} />
      ) : (
        <input name={name} type={type} className="field" autoComplete={autoComplete} defaultValue={defaultValue} disabled={disabled} />
      )}
      {error ? <span className="text-red-500">{error}</span> : null}
    </label>
  );
}
