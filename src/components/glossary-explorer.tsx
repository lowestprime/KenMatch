"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { SearchField } from "@/components/search-field";
import {
  filterGlossaryEntries,
  glossaryStatuses,
  type GlossaryEntry,
  type GlossaryStatus,
} from "@/lib/glossary";

const statusLabels: Record<GlossaryStatus, string> = {
  operational: "Operational",
  sandbox: "Sandbox",
  proposed: "Proposed",
  external: "External dependency",
};

export function GlossaryExplorer({ entries }: { entries: GlossaryEntry[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<GlossaryStatus | "all">("all");
  const filtered = useMemo(
    () => filterGlossaryEntries(entries, query, status),
    [entries, query, status],
  );
  const hasFilters = Boolean(query.trim() || status !== "all");

  useEffect(() => {
    function readLocation() {
      const params = new URLSearchParams(window.location.search);
      const requestedStatus = params.get("status");
      setQuery(params.get("q") ?? "");
      setStatus(glossaryStatuses.includes(requestedStatus as GlossaryStatus)
        ? requestedStatus as GlossaryStatus
        : "all");

      const id = decodeURIComponent(window.location.hash.slice(1));
      if (!id) return;
      window.requestAnimationFrame(() => {
        const target = document.getElementById(id);
        if (target instanceof HTMLDetailsElement) target.open = true;
        if (target instanceof HTMLElement) {
          target.scrollIntoView({ block: "start" });
          target.focus({ preventScroll: true });
        }
      });
    }

    readLocation();
    window.addEventListener("popstate", readLocation);
    window.addEventListener("hashchange", readLocation);
    return () => {
      window.removeEventListener("popstate", readLocation);
      window.removeEventListener("hashchange", readLocation);
    };
  }, []);

  function updateLocation(nextQuery: string, nextStatus: GlossaryStatus | "all") {
    const url = new URL(window.location.href);
    if (nextQuery.trim()) url.searchParams.set("q", nextQuery.trim());
    else url.searchParams.delete("q");
    if (nextStatus !== "all") url.searchParams.set("status", nextStatus);
    else url.searchParams.delete("status");
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  }

  function updateQuery(nextQuery: string) {
    setQuery(nextQuery);
    updateLocation(nextQuery, status);
  }

  function updateStatus(nextStatus: GlossaryStatus | "all") {
    setStatus(nextStatus);
    updateLocation(query, nextStatus);
  }

  function reset() {
    setQuery("");
    setStatus("all");
    updateLocation("", "all");
    document.getElementById("glossary-search")?.focus();
  }

  return (
    <section className="panel glossary-panel" aria-labelledby="glossary-heading">
      <div className="section-heading">
        <div>
          <div className="eyebrow">Operational definitions</div>
          <h2 id="glossary-heading">Search the KenMatch rulebook</h2>
        </div>
        <div className="faq-count" aria-live="polite">{filtered.length} of {entries.length} terms</div>
      </div>

      <div className="faq-tools">
        <SearchField
          id="glossary-search"
          value={query}
          onChange={(event) => updateQuery(event.target.value)}
          onClear={() => updateQuery("")}
          placeholder="Search credits, lanes, checkpoints, evidence..."
          label="Search glossary"
          className="search-field-board"
        />
        <div className="faq-category-row" aria-label="Glossary implementation status">
          <button type="button" className={`filter-chip-link ${status === "all" ? "is-active" : ""}`} onClick={() => updateStatus("all")}>
            All
          </button>
          {glossaryStatuses.map((item) => (
            <button
              key={item}
              type="button"
              className={`filter-chip-link glossary-status-${item} ${status === item ? "is-active" : ""}`}
              onClick={() => updateStatus(item)}
            >
              {statusLabels[item]}
            </button>
          ))}
          <button type="button" className="cta-secondary cta-compact faq-reset" onClick={reset} disabled={!hasFilters}>
            Reset
          </button>
        </div>
      </div>

      <div className="glossary-list">
        {filtered.map((entry, index) => (
          <details
            key={entry.id}
            id={entry.id}
            className="glossary-item interactive-surface anchor-target"
            open={index < 2 && !hasFilters ? true : undefined}
            tabIndex={-1}
          >
            <summary>
              <span>
                <strong>{entry.label}</strong>
                <span>{entry.plainDefinition}</span>
              </span>
              <span className={`micro-pill glossary-status-${entry.status}`}>{statusLabels[entry.status]}</span>
            </summary>
            <div className="glossary-detail-grid">
              <div>
                <h3>Operational definition</h3>
                <p>{entry.operationalDefinition}</p>
              </div>
              <div>
                <h3>Governing rules</h3>
                <ul>
                  {entry.governingRules.map((rule) => <li key={rule}>{rule}</li>)}
                </ul>
              </div>
              <div>
                <h3>Implemented in</h3>
                <ul className="code-path-list">
                  {entry.implementation.map((path) => <li key={path}><code>{path}</code></li>)}
                </ul>
              </div>
              <div>
                <h3>Related terms</h3>
                <div className="glossary-related">
                  {entry.relatedTerms.map((id) => (
                    <a key={id} href={`#${id}`}>{entries.find((candidate) => candidate.id === id)?.label ?? id}</a>
                  ))}
                </div>
              </div>
            </div>
            <div className="faq-answer-meta">
              <Link className="text-link" href={entry.route}>Open relevant public route</Link>
              <a className="text-link" href={`#${entry.id}`}>Link to this term</a>
            </div>
          </details>
        ))}
        {filtered.length === 0 ? (
          <div className="empty-state" role="status">
            <strong>No matching terms</strong>
            <span>Try a broader phrase or reset the glossary filters.</span>
            <button type="button" className="cta-secondary cta-compact" onClick={reset}>Reset glossary</button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
