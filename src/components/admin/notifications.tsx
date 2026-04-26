"use client";

import { useActionState } from "react";

import { initialActionState } from "@/app/action-state";
import { updateNotificationSettingsAction } from "@/app/actions";
import type { AdminNotificationSettings } from "@/lib/types";

export function AdminNotifications({ settings }: { settings: AdminNotificationSettings }) {
  const [state, formAction, pending] = useActionState(updateNotificationSettingsAction, initialActionState);
  return (
    <form action={formAction} className="form-grid">
      <div className="admin-hint">
        <strong>Dispatch scope.</strong> These settings control server-side email alerts. First-visit alerts fire once per salted visitor hash, while signups, verification requests, and Ken submissions are always audit logged even if email is disabled.
      </div>
      <label className="field-label">
        <span>Recipient emails (comma or newline separated)</span>
        <textarea
          name="recipientEmails"
          className="field"
          rows={2}
          defaultValue={settings.recipientEmails.join("\n")}
        />
      </label>
      <div className="grid gap-2">
        <ToggleRow
          name="notifyOnSignup"
          label="Email on new account signup"
          defaultChecked={settings.notifyOnSignup}
        />
        <ToggleRow
          name="notifyOnFirstVisit"
          label="Email on first visit from a new unique IP"
          defaultChecked={settings.notifyOnFirstVisit}
        />
        <ToggleRow
          name="notifyOnVerificationRequest"
          label="Email on identity verification requests"
          defaultChecked={settings.notifyOnVerificationRequest}
        />
        <ToggleRow
          name="notifyOnProposal"
          label="Email when a new Ken is submitted"
          defaultChecked={settings.notifyOnProposal}
        />
        <ToggleRow
          name="dailyDigest"
          label="Send daily digest summary"
          defaultChecked={settings.dailyDigest}
        />
      </div>
      <button type="submit" className="cta-primary cta-compact" disabled={pending}>
        {pending ? "Saving…" : "Save notification preferences"}
      </button>
      <p className="text-xs" style={{ color: "var(--muted)" }}>
        Last updated {new Date(settings.updatedAt).toLocaleString()}.
      </p>
      {state.message ? (
        <p className={`alert ${state.status === "error" ? "alert-error" : "alert-success"}`}>{state.message}</p>
      ) : null}
    </form>
  );
}

function ToggleRow({
  name,
  label,
  defaultChecked,
}: {
  name: string;
  label: string;
  defaultChecked: boolean;
}) {
  return (
    <label className="toggle-row">
      <span>{label}</span>
      <input type="checkbox" name={name} defaultChecked={defaultChecked} />
    </label>
  );
}
