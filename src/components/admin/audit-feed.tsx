import type { AuditLogRecord } from "@/lib/types";

function formatWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export function AdminAuditFeed({ entries }: { entries: AuditLogRecord[] }) {
  if (entries.length === 0) {
    return <p style={{ color: "var(--muted)" }}>No audit events yet.</p>;
  }
  return (
    <ul className="grid gap-2">
      {entries.map((entry) => (
        <li key={entry.id} className="audit-card">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <strong>{entry.action}</strong>
            <span className="text-xs" style={{ color: "var(--muted)" }}>
              {formatWhen(entry.createdAt)}
            </span>
          </div>
          <p style={{ color: "var(--ink-muted)", fontSize: "0.86rem" }}>{entry.detail}</p>
          {entry.metadata ? (
            <p style={{ color: "var(--muted)", fontSize: "0.72rem", fontFamily: "var(--font-mono)" }}>{entry.metadata}</p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
