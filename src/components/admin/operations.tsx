"use client";

import { useActionState, useMemo, useState } from "react";

import { initialActionState } from "@/app/action-state";
import {
  removeTaskIllustrationAction,
  recordRunDecisionAction,
  sendSmtpTestAction,
  updateCapacityOverrideAction,
  updateMaintenanceAction,
  updateSmtpSettingsAction,
  uploadTaskIllustrationAction,
  upsertChangelogEntryAction,
} from "@/app/actions";
import type {
  AdminSmtpSettings,
  CapacityStateResolution,
  ChangelogEntryRecord,
  CheckpointDetail,
  MaintenanceState,
  RunDecisionEventRecord,
  TaskIllustrationRecord,
  TaskSummary,
} from "@/lib/types";
import { RUN_DECISION_DEFINITIONS } from "@/lib/run-governance";

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

export function AdminCapacityPanel({ capacity }: { capacity: CapacityStateResolution }) {
  const [state, formAction, pending] = useActionState(updateCapacityOverrideAction, initialActionState);
  return (
    <div className="form-grid">
      <div className={`admin-hint ${capacity.state === "normal" ? "alert-success" : "alert-warn"}`}>
        <strong>{capacity.policy.label}.</strong>{" "}
        Automatic treasury state: {capacity.automaticState.replaceAll("-", " ")}. Effective source: {capacity.source.replaceAll("-", " ")}.
      </div>
      <div className="grid gap-2 text-sm" style={{ color: "var(--muted)" }}>
        <p><strong style={{ color: "var(--ink)" }}>New launches:</strong> {capacity.policy.newLaunches}</p>
        <p><strong style={{ color: "var(--ink)" }}>Existing runs:</strong> {capacity.policy.existingRuns}</p>
        <p><strong style={{ color: "var(--ink)" }}>Protected work:</strong> {capacity.policy.protectedWork}</p>
      </div>
      <form action={formAction} className="form-grid">
        <label className="field-label">
          <span>Control mode</span>
          <select name="mode" className="field" defaultValue={capacity.override.mode}>
            <option value="automatic">Automatic - coverage based</option>
            <option value="manual">Manual - stricter only</option>
          </select>
        </label>
        <label className="field-label">
          <span>Manual restriction</span>
          <select name="manualState" className="field" defaultValue={capacity.override.manualState ?? capacity.state}>
            <option value="normal">Normal capacity</option>
            <option value="constrained">Constrained capacity</option>
            <option value="new-launches-paused">New launches paused</option>
            <option value="critical-maintenance-only">Critical maintenance only</option>
          </select>
        </label>
        <label className="field-label">
          <span>Public reason for manual restriction</span>
          <textarea
            name="publicReason"
            className="field"
            rows={3}
            defaultValue={capacity.override.publicReason}
            placeholder="Explain the provider, safety, or operating constraint. This reason is public."
          />
        </label>
        <button type="submit" className="cta-primary cta-compact" disabled={pending}>
          {pending ? "Saving..." : "Save capacity control"}
        </button>
        <p className="text-xs" style={{ color: "var(--muted)" }}>
          Manual control cannot relax a more restrictive automatic state. Clear it by returning to automatic mode.
        </p>
        <StatusMessage state={state} />
      </form>
    </div>
  );
}

export function AdminRunDecisionPanel({
  tasks,
  checkpoints,
  decisions,
}: {
  tasks: TaskSummary[];
  checkpoints: CheckpointDetail[];
  decisions: RunDecisionEventRecord[];
}) {
  const [state, formAction, pending] = useActionState(recordRunDecisionAction, initialActionState);
  const [taskId, setTaskId] = useState(tasks[0]?.id ?? "");
  const [eventType, setEventType] = useState<RunDecisionEventRecord["eventType"]>("checkpoint");
  const taskCheckpoints = useMemo(() => checkpoints.filter((checkpoint) => checkpoint.taskId === taskId), [checkpoints, taskId]);
  const decisionOptions = useMemo(
    () => Object.entries(RUN_DECISION_DEFINITIONS).filter(([, definition]) => definition.eventType === eventType),
    [eventType],
  );
  const titleByTask = useMemo(() => new Map(tasks.map((task) => [task.id, task.title])), [tasks]);

  return (
    <div className="form-grid">
      <div className="admin-hint">
        Decisions are append-only. Stop and release decisions update the public lifecycle state; every status change keeps the reason, actor, time, and artifact trace.
      </div>
      <form action={formAction} className="form-grid">
        <label className="field-label">
          <span>Ken</span>
          <select name="taskId" className="field" value={taskId} onChange={(event) => setTaskId(event.target.value)}>
            {tasks.map((task) => <option key={task.id} value={task.id}>{task.title}</option>)}
          </select>
        </label>
        <div className="form-grid form-grid-two">
          <label className="field-label">
            <span>Event type</span>
            <select
              name="eventType"
              className="field"
              value={eventType}
              onChange={(event) => setEventType(event.target.value as RunDecisionEventRecord["eventType"])}
            >
              <option value="checkpoint">Checkpoint decision</option>
              <option value="correction">Correction</option>
              <option value="stop">Stop or redirect</option>
              <option value="release">Release decision</option>
            </select>
          </label>
          <label className="field-label">
            <span>Reason code</span>
            <select name="decisionCode" className="field" key={eventType} defaultValue={decisionOptions[0]?.[0]}>
              {decisionOptions.map(([code, definition]) => <option key={code} value={code}>{definition.label}</option>)}
            </select>
          </label>
        </div>
        <label className="field-label">
          <span>Checkpoint</span>
          <select name="checkpointId" className="field" defaultValue="" key={taskId}>
            <option value="">{eventType === "checkpoint" ? "Choose a required checkpoint" : "No checkpoint / whole run"}</option>
            {taskCheckpoints.map((checkpoint) => <option key={checkpoint.id} value={checkpoint.id}>{checkpoint.label}</option>)}
          </select>
        </label>
        <label className="field-label">
          <span>Public reason</span>
          <textarea name="publicReason" className="field" rows={4} minLength={20} required />
        </label>
        <div className="form-grid form-grid-two">
          <label className="field-label">
            <span>Artifact label</span>
            <input name="artifactLabel" className="field" placeholder="Required for release decisions" />
          </label>
          <label className="field-label">
            <span>Artifact URL</span>
            <input name="artifactUrl" className="field" placeholder="/artifacts/... or https://..." />
          </label>
        </div>
        <label className="field-label">
          <span>SHA-256 artifact digest</span>
          <input name="artifactDigest" className="field" placeholder="sha256:64 hexadecimal characters" />
        </label>
        <button type="submit" className="cta-primary cta-compact" disabled={pending || !taskId}>
          {pending ? "Recording..." : "Record append-only decision"}
        </button>
        <StatusMessage state={state} />
      </form>
      <div className="admin-dense-list">
        {decisions.slice(0, 8).map((decision) => (
          <article key={decision.id} className="audit-card">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <strong>{RUN_DECISION_DEFINITIONS[decision.decisionCode].label}</strong>
              <span className="tag">{decision.eventType}</span>
            </div>
            <p className="text-sm" style={{ color: "var(--ink-muted)" }}>{decision.publicReason}</p>
            <p className="text-xs" style={{ color: "var(--muted)" }}>
              {titleByTask.get(decision.taskId) ?? decision.taskId} · {new Date(decision.createdAt).toLocaleString()}
            </p>
          </article>
        ))}
      </div>
    </div>
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
        Uploaded Ken illustrations are optional, admin-controlled, and stored under the persisted data volume. PNG, JPEG, WebP, and GIF are accepted under 1.5 MB; SVG uploads are blocked. The public category/lane symbol remains the fallback.
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
        <p className="text-sm" style={{ color: "var(--muted)" }}>Selected Ken is using its category/lane symbol.</p>
      )}
    </div>
  );
}
