import type { VisitorRecord, VisitorStats } from "@/lib/types";

function formatWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export function AdminVisitors({ visitors, stats }: { visitors: VisitorRecord[]; stats: VisitorStats }) {
  if (visitors.length === 0) {
    return <p style={{ color: "var(--muted)" }}>No visitors recorded yet.</p>;
  }
  return (
    <div className="grid gap-3">
      <div className="admin-stat-grid">
        <span><strong>{stats.totalUnique}</strong> total</span>
        <span><strong>{stats.recent24h}</strong> 24h</span>
        <span><strong>{stats.recent7d}</strong> 7d</span>
        <span><strong>{stats.accountCreated}</strong> accounts</span>
      </div>
      <div className="admin-table" role="table" aria-label="Unique visitors">
        <div className="admin-table-row is-header" role="row">
          <span role="columnheader">Region</span>
          <span role="columnheader">Views</span>
          <span role="columnheader">Account</span>
          <span role="columnheader">Last seen</span>
        </div>
        {visitors.map((visitor) => (
          <div key={visitor.id} className="admin-table-row" role="row">
            <span role="cell">
              <strong>{visitor.countryName ?? "Unknown"}</strong>
              <small>{[visitor.city, visitor.region].filter(Boolean).join(", ") || "Approximate region unavailable"}</small>
            </span>
            <span role="cell">{visitor.pageViews}</span>
            <span role="cell">{visitor.accountCreated ? "Yes" : "No"}</span>
            <span role="cell">{formatWhen(visitor.lastSeenAt)}</span>
          </div>
        ))}
      </div>
      <p className="text-xs" style={{ color: "var(--muted)" }}>
        Showing the latest {visitors.length} visitors. Raw visitor hashes are intentionally not shown; this table is for operational awareness, not personal tracking.
      </p>
    </div>
  );
}
