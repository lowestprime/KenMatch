import type { Metadata } from "next";

import { listChangelogEntries } from "@/lib/db";

export const metadata: Metadata = {
  title: "Changelog",
  description: "Public KenMatch release notes covering product, data, security, and operations changes.",
};

export default async function ChangelogPage() {
  const entries = await listChangelogEntries(false, 30);
  return (
    <div className="page-stack">
      <section className="panel hero-panel">
        <span className="eyebrow">Changelog</span>
        <h1>What changed on KenMatch</h1>
        <p style={{ color: "var(--ink-muted)", maxWidth: "48rem" }}>
          Compact public release notes for the board, seed data, account surfaces, admin tooling, and sandbox disclosures. These notes describe product behavior, not live provider execution or live sponsor settlement.
        </p>
      </section>
      <section className="panel grid gap-3">
        {entries.length > 0 ? (
          <div className="changelog-list">
            {entries.map((entry) => (
              <article key={entry.id} className="changelog-card">
                <div className="changelog-date">{entry.entryDate}</div>
                <div className="changelog-body">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="tag">{entry.entryType}</span>
                    <h2>{entry.title}</h2>
                  </div>
                  <p>{entry.summary}</p>
                  {entry.details ? <p className="changelog-details">{entry.details}</p> : null}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p style={{ color: "var(--muted)" }}>No public changelog entries have been published yet.</p>
        )}
      </section>
    </div>
  );
}
