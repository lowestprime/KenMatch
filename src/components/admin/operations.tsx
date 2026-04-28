"use client";

import { useActionState, useMemo, useState } from "react";

import { initialActionState } from "@/app/action-state";
import {
  removeTaskIllustrationAction,
  sendSmtpTestAction,
  updateMaintenanceAction,
  updateSmtpSettingsAction,
  uploadTaskIllustrationAction,
  upsertChangelogEntryAction,
} from "@/app/actions";
import type {
  AdminSmtpSettings,
  ChangelogEntryRecord,
  MaintenanceState,
  TaskIllustrationRecord,
  TaskSummary,
} from "@/lib/types";

function StatusMessage({ state }: { state: typeof initialActionState }) {
  if (!state.message) return null;
  return <p className={`alert ${state.status === "error" ? "alert-error" : "alert-success"}`}>{state.message}</p>;
}

export function AdminMaintenancePanel({ maintenance }: { maintenance: MaintenanceState }) {
  const [state, formAction, pending] = useActionState(updateMaintenanceAction, initialActionState);
  return (
    <form action={formAction} className="form-grid">
      <div className={`admin-hint ${maintenance.mode === "on" ? "alert-warn" : "alert-success"}`}>
        <strong>{maintenance.mode === "on" ? "Maintenance active." : "Public writes open."}</strong>{" "}
        Public pages show the maintenance notice only when this is enabled; admin, auth, account recovery, health, and assets remain reachable.
      </div>
      <label className="field-label">
        <span>Mode</span>
        <select name="mode" className="field" defaultValue={maintenance.mode}>
          <option value="off">Off - public site open</option>
          <option value="on">On - public maintenance page</option>
        </select>
      </label>
      <label className="field-label">
        <span>Public message</span>
        <textarea name="message" className="field" rows={3} defaultValue={maintenance.message} />
      </label>
      <label className="field-label">
        <span>Expected return text</span>
        <input name="expectedReturn" className="field" defaultValue={maintenance.expectedReturn} placeholder="Example: later today after database maintenance" />
      </label>
      <button type="submit" className="cta-primary cta-compact" disabled={pending}>
        {pending ? "Saving..." : "Save maintenance state"}
      </button>
      <p className="text-xs" style={{ color: "var(--muted)" }}>
        Last updated {new Date(maintenance.updatedAt).toLocaleString()}.
      </p>
      <StatusMessage state={state} />
    </form>
  );
}

export function AdminSmtpPanel({ smtp, isOwner }: { smtp: AdminSmtpSettings; isOwner: boolean }) {
  const [settingsState, settingsAction, settingsPending] = useActionState(updateSmtpSettingsAction, initialActionState);
  const [testState, testAction, testPending] = useActionState(sendSmtpTestAction, initialActionState);
  return (
    <div className="form-grid">
      <div className={`admin-hint ${smtp.source === "none" ? "alert-warn" : "alert-success"}`}>
        <strong>{smtp.source === "env" ? "SMTP comes from environment." : smtp.source === "database" ? "Database SMTP configured." : "SMTP not configured."}</strong>{" "}
        Environment variables have priority. Database SMTP is used only when env SMTP is absent, complete, and the encrypted password can be read.
      </div>
      {smtp.source === "none" ? (
        <div className="admin-hint">
          To store an SMTP password from the admin UI, set <code>KENMATCH_CONFIG_ENCRYPTION_KEY</code> on the server. Without it, the UI refuses to persist secrets.
        </div>
      ) : null}
      <form action={settingsAction} className="form-grid">
        <fieldset disabled={!isOwner || smtp.source === "env" || settingsPending} className="form-grid">
          <div className="form-grid form-grid-two">
            <label className="field-label">
              <span>SMTP host</span>
              <input name="host" className="field" defaultValue={smtp.source === "env" ? "" : smtp.host} placeholder="smtp.example.com" />
            </label>
            <label className="field-label">
              <span>Port</span>
              <input name="port" className="field" type="number" min={1} max={65535} defaultValue={smtp.source === "none" ? 587 : smtp.port} />
            </label>
          </div>
          <label className="toggle-row">
            <span>Use TLS/SSL immediately</span>
            <input name="secure" type="checkbox" defaultChecked={smtp.secure} />
          </label>
          <div className="form-grid form-grid-two">
            <label className="field-label">
              <span>Username</span>
              <input name="username" className="field" defaultValue={smtp.source === "env" ? "" : smtp.username} autoComplete="off" />
            </label>
            <label className="field-label">
              <span>From address</span>
              <input name="from" className="field" defaultValue={smtp.source === "env" ? "" : smtp.from} placeholder="KenMatch <no-reply@kmat.ch>" />
            </label>
          </div>
          <label className="field-label">
            <span>Password or app password</span>
            <input name="password" className="field" type="password" autoComplete="new-password" placeholder={smtp.passwordConfigured ? "Leave blank to keep stored password" : "Requires encryption key"} />
          </label>
          <label className="toggle-row">
            <span>Clear stored database password</span>
            <input name="clearPassword" type="checkbox" />
          </label>
          <button type="submit" className="cta-primary cta-compact">
            {settingsPending ? "Saving..." : "Save SMTP settings"}
          </button>
        </fieldset>
        {!isOwner ? <p className="text-xs text-muted">Only the owner can edit SMTP settings.</p> : null}
        <StatusMessage state={settingsState} />
      </form>
      <form action={testAction} className="form-grid">
        <label className="field-label">
          <span>Send test email to</span>
          <input name="recipient" className="field" type="email" placeholder="owner@example.com" disabled={!isOwner || testPending} />
        </label>
        <button type="submit" className="cta-secondary cta-compact" disabled={!isOwner || testPending || smtp.source === "none"}>
          {testPending ? "Testing..." : "Send SMTP test"}
        </button>
        <div className="admin-hint">
          Last validation: <strong>{smtp.lastTestStatus}</strong>
          {smtp.lastTestedAt ? ` at ${new Date(smtp.lastTestedAt).toLocaleString()}` : ""}.{" "}
          {smtp.lastTestMessage ? smtp.lastTestMessage : "No provider test has been recorded."}
        </div>
        <StatusMessage state={testState} />
      </form>
    </div>
  );
}

export function AdminChangelogPanel({ entries }: { entries: ChangelogEntryRecord[] }) {
  const [state, formAction, pending] = useActionState(upsertChangelogEntryAction, initialActionState);
  const latest = entries[0];
  return (
    <div className="form-grid">
      <form action={formAction} className="form-grid">
        <div className="form-grid form-grid-two">
          <label className="field-label">
            <span>Date</span>
            <input name="entryDate" className="field" type="date" defaultValue={latest?.entryDate ?? new Date().toISOString().slice(0, 10)} />
          </label>
          <label className="field-label">
            <span>Type</span>
            <select name="entryType" className="field" defaultValue={latest?.entryType ?? "feature"}>
              <option value="launch">Launch</option>
              <option value="feature">Feature</option>
              <option value="data">Data</option>
              <option value="security">Security</option>
              <option value="operations">Operations</option>
            </select>
          </label>
        </div>
        <label className="field-label">
          <span>Title</span>
          <input name="title" className="field" defaultValue={latest?.title ?? ""} />
        </label>
        <label className="field-label">
          <span>Summary</span>
          <textarea name="summary" className="field" rows={3} defaultValue={latest?.summary ?? ""} />
        </label>
        <label className="field-label">
          <span>Details</span>
          <textarea name="details" className="field" rows={4} defaultValue={latest?.details ?? ""} />
        </label>
        <label className="toggle-row">
          <span>Visible publicly</span>
          <input name="visible" type="checkbox" defaultChecked={latest?.visible ?? true} />
        </label>
        <button type="submit" className="cta-primary cta-compact" disabled={pending}>
          {pending ? "Saving..." : "Save changelog entry"}
        </button>
        <StatusMessage state={state} />
      </form>
      <div className="admin-dense-list">
        {entries.slice(0, 6).map((entry) => (
          <article key={entry.id} className="audit-card">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <strong>{entry.title}</strong>
              <span className="tag">{entry.entryType}</span>
            </div>
            <p className="text-sm" style={{ color: "var(--ink-muted)" }}>{entry.summary}</p>
            <p className="text-xs" style={{ color: "var(--muted)" }}>{entry.entryDate} · {entry.visible ? "public" : "hidden"}</p>
          </article>
        ))}
      </div>
    </div>
  );
}

export function AdminIllustrationPanel({
  tasks,
  illustrations,
}: {
  tasks: TaskSummary[];
  illustrations: TaskIllustrationRecord[];
}) {
  const [uploadState, uploadAction, uploadPending] = useActionState(uploadTaskIllustrationAction, initialActionState);
  const [removeState, removeAction, removePending] = useActionState(removeTaskIllustrationAction, initialActionState);
  const [selectedTaskId, setSelectedTaskId] = useState(tasks[0]?.id ?? "");
  const selected = useMemo(() => tasks.find((task) => task.id === selectedTaskId) ?? tasks[0] ?? null, [selectedTaskId, tasks]);
  const illustrationByTask = useMemo(() => new Map(illustrations.map((item) => [item.taskId, item])), [illustrations]);
  const current = selected ? illustrationByTask.get(selected.id) : null;
  return (
    <div className="form-grid">
      <div className="admin-hint">
        Uploaded Ken illustrations are optional, admin-controlled, and stored under the persisted data volume. PNG, JPEG, WebP, and GIF are accepted under 1.5 MB; SVG uploads are blocked. Deterministic visuals remain the fallback.
      </div>
      <form action={uploadAction} className="form-grid">
        <label className="field-label">
          <span>Ken</span>
          <select name="taskId" className="field" value={selectedTaskId} onChange={(event) => setSelectedTaskId(event.target.value)}>
            {tasks.map((task) => (
              <option key={task.id} value={task.id}>{task.title}</option>
            ))}
          </select>
        </label>
        <label className="field-label">
          <span>Alt text</span>
          <input name="altText" className="field" defaultValue={selected ? `Illustration for ${selected.title}` : ""} />
        </label>
        <label className="field-label">
          <span>Image file</span>
          <input name="illustration" className="field" type="file" accept="image/png,image/jpeg,image/webp,image/gif" />
        </label>
        <button type="submit" className="cta-primary cta-compact" disabled={uploadPending || !selected}>
          {uploadPending ? "Uploading..." : "Upload illustration"}
        </button>
        <StatusMessage state={uploadState} />
      </form>
      {current ? (
        <form action={removeAction} className="audit-card">
          <input type="hidden" name="taskId" value={current.taskId} />
          <input type="hidden" name="storagePath" value={current.storagePath ?? ""} />
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <strong>Current uploaded illustration</strong>
            <span className="tag">{current.mimeType}</span>
          </div>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            {current.altText} · {Math.round(current.sizeBytes / 1024)} KB · {current.width ?? "?"}×{current.height ?? "?"}
          </p>
          <button type="submit" className="cta-secondary cta-compact" disabled={removePending}>
            {removePending ? "Removing..." : "Remove uploaded illustration"}
          </button>
          <StatusMessage state={removeState} />
        </form>
      ) : (
        <p className="text-sm" style={{ color: "var(--muted)" }}>Selected Ken is using the deterministic visual fallback.</p>
      )}
    </div>
  );
}
