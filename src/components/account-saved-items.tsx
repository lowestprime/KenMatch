"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

interface SavedKenItem {
  id: string;
  slug: string;
  title: string;
  summary: string;
}

interface SavedDiscussionItem {
  id: string;
  itemType: string;
  itemId: string;
  title: string;
  subtitle: string;
  url: string;
  createdAt: string;
}

type SavedMode = "all" | "kens" | "discussion" | "comments";

export function AccountSavedItems({ kens, discussion }: { kens: SavedKenItem[]; discussion: SavedDiscussionItem[] }) {
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<SavedMode>("all");
  const normalized = query.trim().toLowerCase();
  const items = useMemo(() => {
    const kenItems = kens.map((ken) => ({
      key: `ken-${ken.id}`,
      type: "ken" as const,
      title: ken.title,
      subtitle: "Saved Ken",
      body: ken.summary,
      href: `/kens/${ken.slug}`,
    }));
    const discussionItems = discussion.map((item) => ({
      key: `${item.itemType}-${item.itemId}`,
      type: item.itemType === "discussion_comment" ? "comment" as const : "discussion" as const,
      title: item.title,
      subtitle: item.subtitle,
      body: item.subtitle,
      href: item.url,
    }));
    return [...kenItems, ...discussionItems]
      .filter((item) => mode === "all" || item.type === mode || (mode === "discussion" && item.type === "comment"))
      .filter((item) => !normalized || `${item.title} ${item.subtitle} ${item.body}`.toLowerCase().includes(normalized));
  }, [discussion, kens, mode, normalized]);

  return (
    <section className="panel grid gap-3">
      <div className="section-heading">
        <div>
          <span className="eyebrow">Saved library</span>
          <h2>Saved Kens, discussion posts, and comments</h2>
        </div>
        <Link className="cta-secondary cta-compact" href="/discuss?sort=saved">Open saved discussion</Link>
      </div>
      <div className="saved-library-controls">
        <label className="field-label saved-library-search">
          <span>Search saved items</span>
          <input className="field" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search titles, summaries, comments, or topics…" />
        </label>
        <div className="hero-actions" role="tablist" aria-label="Saved item filters">
          {([
            ["all", "All"],
            ["kens", "Kens"],
            ["discussion", "Discussion"],
            ["comments", "Comments"],
          ] as const).map(([value, label]) => (
            <button key={value} type="button" className={`filter-chip ${mode === value ? "is-active" : ""}`} onClick={() => setMode(value)}>
              {label}
            </button>
          ))}
        </div>
      </div>
      {items.length === 0 ? (
        <p style={{ color: "var(--muted)" }}>
          No saved items match this view yet. Save Kens from the Feed or save discussion posts/comments while browsing Discussion.
        </p>
      ) : (
        <div className="saved-grid">
          {items.map((item) => (
            <article key={item.key} className="saved-community-card">
              <div className="discussion-meta"><span>{item.subtitle}</span></div>
              <Link href={item.href} className="font-display"><strong>{item.title}</strong></Link>
              {item.body ? <p style={{ color: "var(--muted)", marginTop: ".35rem" }}>{item.body}</p> : null}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
