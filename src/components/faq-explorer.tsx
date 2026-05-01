"use client";

import { useMemo, useState } from "react";

import { SearchField } from "@/components/search-field";
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

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return entries.filter((entry) => {
      const matchesCategory = category === "all" || entry.category === category;
      if (!matchesCategory) return false;
      if (!normalized) return true;
      return [
        entry.question,
        entry.answer,
        categoryLabels[entry.category],
        ...entry.keywords,
      ].join(" ").toLowerCase().includes(normalized);
    });
  }, [category, entries, query]);

  return (
    <section className="panel faq-panel" aria-labelledby="faq-heading">
      <div className="section-heading">
        <div>
          <div className="eyebrow">FAQ</div>
          <h2 id="faq-heading">Search common KenMatch questions</h2>
        </div>
        <div className="faq-count">{filtered.length} answers</div>
      </div>
      <div className="faq-tools">
        <SearchField
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onClear={() => setQuery("")}
          placeholder="Search Kens, lanes, voting, sponsorship, privacy..."
          label="Search FAQ"
          className="search-field-board"
        />
        <div className="faq-category-row" aria-label="FAQ categories">
          <button type="button" className={`filter-chip-link ${category === "all" ? "is-active" : ""}`} onClick={() => setCategory("all")}>All</button>
          {categories.map((item) => (
            <button
              key={item}
              type="button"
              className={`filter-chip-link ${category === item ? "is-active" : ""}`}
              onClick={() => setCategory(item)}
            >
              {categoryLabels[item]}
            </button>
          ))}
        </div>
      </div>
      <div className="faq-list">
        {filtered.map((entry, index) => (
          <details key={entry.id} id={entry.id} className="faq-item interactive-surface" open={index < 3 && !query}>
            <summary>
              <span>{entry.question}</span>
              <span className="micro-pill">{categoryLabels[entry.category]}</span>
            </summary>
            <p>{entry.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
