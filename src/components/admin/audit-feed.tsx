"use client";

import { useMemo, useState } from "react";

import type { AuditLogRecord } from "@/lib/types";

function formatWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export function AdminAuditFeed({ entries }: { entries: AuditLogRecord[] }) {
  const [query, setQuery] = useState("");
  const [action, setAction] = useState("all");
  const [limit, setLimit] = useState(25);
  const actions = useMemo(() => ["all", ...Array.from(new Set(entries.map((entry) => entry.action))).sort()], [entries]);
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return entries
      .filter((entry) => action === "all" || entry.action === action)
      .filter((entry) => {
        if (!needle) return true;
        return `${entry.action} ${entry.detail} ${redactMetadata(entry.metadata)}`.toLowerCase().includes(needle);
      })
      .slice(0, limit);
  }, [action, entries, limit, query]);
  if (entries.length === 0) {
    return <p style={{ color: "var(--muted)" }}>No audit events yet.</p>;
  }
  return (
    <div className="grid gap-3">
      <div className="admin-filter-row">
        <label className="field-label">
          <span>Filter</span>
          <input className="field" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search action or detail" />
        </label>
        <label className="field-label">
          <span>Action</span>
          <select className="field" value={action} onChange={(event) => setAction(event.target.value)}>
            {actions.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
        <label className="field-label">
          <span>Limit</span>
          <select className="field" value={limit} onChange={(event) => setLimit(Number(event.target.value))}>
            {[10, 25, 50, 100].map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
      </div>
      <ul className="grid gap-2">
      {filtered.map((entry) => (
        <li key={entry.id} className="audit-card">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <strong>{entry.action}</strong>
            <span className="text-xs" style={{ color: "var(--muted)" }}>
              {formatWhen(entry.createdAt)}
            </span>
          </div>
          <p style={{ color: "var(--ink-muted)", fontSize: "0.86rem" }}>{entry.detail}</p>
          {entry.metadata ? (
            <p style={{ color: "var(--muted)", fontSize: "0.72rem", fontFamily: "var(--font-mono)" }}>{redactMetadata(entry.metadata)}</p>
          ) : null}
        </li>
      ))}
      </ul>
      <p className="text-xs" style={{ color: "var(--muted)" }}>{filtered.length} of {entries.length} events shown. Metadata is redacted before display.</p>
    </div>
  );
}

function redactMetadata(value: string | null) {
  if (!value) return "";
  return value
    .replace(/"?(token|password|secret|pass|authorization|cookie)"?\s*:\s*"[^"]*"/gi, '"$1":"[redacted]"')
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[email]")
    .slice(0, 700);
}
