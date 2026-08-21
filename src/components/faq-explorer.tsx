"use client";

import { useEffect, useMemo, useState } from "react";

import { SearchField } from "@/components/search-field";
import { filterFAQEntries } from "@/lib/faq";
import type { FAQEntry } from "@/lib/types";

const categoryLabels: Record<FAQEntry["category"], string> = {
  basics: "Basics",
  participation: "Participation",
  allocation: "Allocation",
  backing: "Backing",
  safety: "Safety",
  privacy: "Privacy",
  operations: "Operations",
};

export function FAQExplorer({ entries }: { entries: FAQEntry[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<FAQEntry["category"] | "all">("all");

  const categories = useMemo(() => {
    return Array.from(new Set(entries.map((entry) => entry.category)));
  }, [entries]);

  const filtered = useMemo(
    () => filterFAQEntries(entries, query, category),
    [category, entries, query],
  );
  const hasFilters = Boolean(query.trim() || category !== "all");

  useEffect(() => {
    function readLocation() {
      const params = new URLSearchParams(window.location.search);
      const nextQuery = params.get("q") ?? "";
      const requestedCategory = params.get("category");
      const nextCategory = categories.includes(requestedCategory as FAQEntry["category"])
        ? requestedCategory as FAQEntry["category"]
        : "all";
      setQuery(nextQuery);
      setCategory(nextCategory);

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
  }, [categories]);

  function updateLocation(nextQuery: string, nextCategory: FAQEntry["category"] | "all") {
    const url = new URL(window.location.href);
    if (nextQuery.trim()) url.searchParams.set("q", nextQuery.trim());
    else url.searchParams.delete("q");
    if (nextCategory !== "all") url.searchParams.set("category", nextCategory);
    else url.searchParams.delete("category");
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  }

  function updateQuery(nextQuery: string) {
    setQuery(nextQuery);
    updateLocation(nextQuery, category);
  }

  function updateCategory(nextCategory: FAQEntry["category"] | "all") {
    setCategory(nextCategory);
    updateLocation(query, nextCategory);
  }

  function reset() {
    setQuery("");
    setCategory("all");
    updateLocation("", "all");
    document.getElementById("faq-search")?.focus();
  }

  return (
    <section className="panel faq-panel" aria-labelledby="faq-heading">
      <div className="section-heading">
        <div>
          <div className="eyebrow">FAQ</div>
          <h2 id="faq-heading">Search common KenMatch questions</h2>
        </div>
        <div className="faq-count" aria-live="polite">{filtered.length} of {entries.length} answers</div>
      </div>
      <div className="faq-tools">
        <SearchField
          id="faq-search"
          value={query}
          onChange={(event) => updateQuery(event.target.value)}
          onClear={() => updateQuery("")}
          placeholder="Search Kens, lanes, voting, sponsorship, privacy..."
          label="Search FAQ"
          className="search-field-board"
        />
        <div className="faq-category-row" aria-label="FAQ categories">
          <button type="button" className={`filter-chip-link ${category === "all" ? "is-active" : ""}`} onClick={() => updateCategory("all")}>All</button>
          {categories.map((item) => (
            <button
              key={item}
              type="button"
              className={`filter-chip-link ${category === item ? "is-active" : ""}`}
              onClick={() => updateCategory(item)}
            >
              {categoryLabels[item]}
            </button>
          ))}
          <button
            type="button"
            className="cta-secondary cta-compact faq-reset"
            onClick={reset}
            disabled={!hasFilters}
          >
            Reset
          </button>
        </div>
      </div>
      <div className="faq-list">
        {filtered.map((entry, index) => (
          <details
            key={entry.id}
            id={entry.id}
            className="faq-item interactive-surface anchor-target"
            open={index < 3 && !hasFilters ? true : undefined}
            tabIndex={-1}
          >
            <summary>
              <span>{entry.question}</span>
              <span className="micro-pill">{categoryLabels[entry.category]}</span>
            </summary>
            <p>{entry.answer}</p>
            <div className="faq-answer-meta">
              <a className="text-link" href={`#${entry.id}`}>Link to this answer</a>
              {entry.sources?.length ? (
                <span className="faq-sources">
                  Sources:
                  {entry.sources.map((source) => (
                    <a key={source.url} href={source.url} target="_blank" rel="noopener noreferrer">
                      {source.label}
                    </a>
                  ))}
                  <span>retrieved {entry.sources[0].retrievedAt}</span>
                </span>
              ) : null}
            </div>
          </details>
        ))}
        {filtered.length === 0 ? (
          <div className="empty-state" role="status">
            <strong>No matching answers</strong>
            <span>Try a broader phrase or reset the FAQ filters.</span>
            <button type="button" className="cta-secondary cta-compact" onClick={reset}>Reset FAQ</button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
