"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

interface SearchResult {
  type: "ken" | "profile" | "governance" | "category";
  id: string;
  title: string;
  subtitle: string;
  href: string;
}

export function SearchPalette({ kens, profiles, governance, categories }: {
  kens: Array<{ slug: string; title: string; summary: string; categoryName: string }>;
  profiles: Array<{ id: string; name: string; role: string; specialty: string }>;
  governance: Array<{ id: string; title: string; decision: string; house: string }>;
  categories: Array<{ slug: string; name: string; description: string }>;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const toggle = useCallback(() => {
    setOpen((v) => {
      if (!v) setTimeout(() => inputRef.current?.focus(), 50);
      return !v;
    });
    setQuery("");
  }, []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        toggle();
      }
      if (e.key === "Escape" && open) {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, toggle]);

  const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
  const results: SearchResult[] = [];

  if (tokens.length > 0) {
    for (const ken of kens) {
      const hay = `${ken.title} ${ken.summary} ${ken.categoryName}`.toLowerCase();
      if (tokens.every((t) => hay.includes(t))) {
        results.push({ type: "ken", id: ken.slug, title: ken.title, subtitle: ken.categoryName, href: `/kens/${ken.slug}` });
      }
      if (results.length >= 8) break;
    }
    for (const p of profiles) {
      const hay = `${p.name} ${p.role} ${p.specialty}`.toLowerCase();
      if (tokens.every((t) => hay.includes(t))) {
        results.push({ type: "profile", id: p.id, title: p.name, subtitle: `${p.role} · ${p.specialty}`, href: `/profiles/${p.id}` });
      }
      if (results.length >= 12) break;
    }
    for (const g of governance) {
      const hay = `${g.title} ${g.decision} ${g.house}`.toLowerCase();
      if (tokens.every((t) => hay.includes(t))) {
        results.push({ type: "governance", id: g.id, title: g.title, subtitle: g.house.replace("-", " "), href: "/governance" });
      }
      if (results.length >= 15) break;
    }
    for (const c of categories) {
      const hay = `${c.name} ${c.description}`.toLowerCase();
      if (tokens.every((t) => hay.includes(t))) {
        results.push({ type: "category", id: c.slug, title: c.name, subtitle: c.description.slice(0, 80), href: `/kens?category=${c.slug}` });
      }
      if (results.length >= 18) break;
    }
  }

  if (!open) {
    return (
      <button type="button" onClick={toggle} className="cta-secondary cta-compact" aria-label="Search (Ctrl+K)" title="Search (Ctrl+K)">
        ⌘K Search
      </button>
    );
  }

  return (
    <div className="search-overlay" onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }} role="dialog" aria-label="Search">
      <div className="search-palette">
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search projects, people, governance, categories..."
          className="search-palette-input"
          type="search"
          autoComplete="off"
        />
        {results.length > 0 ? (
          <div className="search-palette-results">
            {results.map((r) => (
              <Link key={`${r.type}-${r.id}`} href={r.href} className="search-palette-result" onClick={() => setOpen(false)}>
                <span className="search-palette-type">{r.type}</span>
                <span className="search-palette-title">{r.title}</span>
                <span className="search-palette-subtitle">{r.subtitle}</span>
              </Link>
            ))}
          </div>
        ) : tokens.length > 0 ? (
          <div className="search-palette-empty">No results found. Try different keywords.</div>
        ) : null}
        <div className="search-palette-hint">Esc to close · Enter to navigate</div>
      </div>
    </div>
  );
}
