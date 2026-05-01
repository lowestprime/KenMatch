import type { ChangelogEntryRecord } from "@/lib/types";

export function ChangelogList({ entries }: { entries: ChangelogEntryRecord[] }) {
  if (entries.length === 0) {
    return <p className="text-muted">No public changelog entries have been published yet.</p>;
  }

  return (
    <div className="changelog-list">
      {entries.map((entry) => (
        <article key={entry.id} className="changelog-card interactive-surface">
          <div className="changelog-date">{entry.entryDate}</div>
          <div className="changelog-body">
            <div className="micro-pill">{entry.entryType}</div>
            <h2>{entry.title}</h2>
            <p>{entry.summary}</p>
            {entry.details ? <p className="changelog-details">{entry.details}</p> : null}
          </div>
        </article>
      ))}
    </div>
  );
}
