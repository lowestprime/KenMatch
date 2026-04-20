import type { VisitorRecord } from "@/lib/types";

function formatWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export function AdminVisitors({ visitors }: { visitors: VisitorRecord[] }) {
  if (visitors.length === 0) {
    return <p style={{ color: "var(--muted)" }}>No visitors recorded yet.</p>;
  }
  return (
    <ul className="grid gap-2">
      {visitors.map((visitor) => (
        <li key={visitor.id} className="audit-card">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <strong>{visitor.countryName ?? "Unknown region"}</strong>
            <span className="text-xs" style={{ color: "var(--muted)" }}>
              {formatWhen(visitor.lastSeenAt)}
            </span>
          </div>
          <p style={{ color: "var(--ink-muted)", fontSize: "0.82rem" }}>
            {[visitor.city, visitor.region].filter(Boolean).join(", ") || "Region metadata unavailable"}
          </p>
          <p style={{ color: "var(--muted)", fontSize: "0.76rem" }}>
            {visitor.pageViews} page view(s) · {visitor.accountCreated ? "created account" : "no account yet"}
          </p>
        </li>
      ))}
    </ul>
  );
}
