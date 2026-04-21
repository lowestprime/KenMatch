"use client";

import Link from "next/link";
import { createPortal } from "react-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent } from "react";

import { searchAction } from "@/app/actions";
import type { SearchResultItem } from "@/lib/types";

function useCommandKey(onOpen: () => void) {
  useEffect(() => {
    function handler(event: globalThis.KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        onOpen();
      }
      if (event.key === "/" && event.target instanceof HTMLElement) {
        const tag = event.target.tagName;
        if (tag !== "INPUT" && tag !== "TEXTAREA" && !event.target.isContentEditable) {
          event.preventDefault();
          onOpen();
        }
      }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onOpen]);
}

export function SearchCommand() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [mounted, setMounted] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useCommandKey(() => setOpen(true));

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setResults([]);
      setActiveIndex(0);
      document.body.classList.remove("search-open");
    } else {
      document.body.classList.add("search-open");
      window.requestAnimationFrame(() => inputRef.current?.focus());
    }
    return () => document.body.classList.remove("search-open");
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    const debounce = window.setTimeout(async () => {
      setLoading(true);
      try {
        const response = await searchAction(query.trim());
        if (!controller.signal.aborted) {
          setResults(response);
          setActiveIndex(0);
        }
      } catch {
        if (!controller.signal.aborted) setResults([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 120);
    return () => {
      controller.abort();
      window.clearTimeout(debounce);
    };
  }, [query, open]);

  useEffect(() => {
    if (!open) return;
    function closeOnEscape(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  const items = useMemo(() => results.slice(0, 20), [results]);

  const overlay = open ? (
    <div className="search-overlay" role="dialog" aria-modal="true" aria-label="Sitewide search">
      <button
        type="button"
        className="search-backdrop"
        onClick={() => setOpen(false)}
        aria-label="Close search"
      />
      <div className="search-shell">
        <div className="search-input-row">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            ref={inputRef}
            className="search-input"
            placeholder="Search Kens, people, and governance..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={handleKey}
            autoComplete="off"
            spellCheck={false}
          />
          <kbd className="search-kbd" aria-hidden="true">Esc</kbd>
        </div>
        <div className="search-results" role="listbox" aria-label="Search results">
          {loading ? (
            <div className="search-empty">Searching...</div>
          ) : items.length === 0 ? (
            <div className="search-empty">
              {query.trim() ? "No matches. Try a different keyword." : "Search Kens, contributors, rules, and backing."}
            </div>
          ) : (
            items.map((item, idx) => (
              <Link
                key={`${item.type}-${item.id}`}
                href={item.url}
                className={`search-result${idx === activeIndex ? " is-active" : ""}`}
                onClick={() => setOpen(false)}
                role="option"
                aria-selected={idx === activeIndex}
              >
                <span className="search-result-kind">{item.type}</span>
                <span className="search-result-title">{item.title}</span>
                {item.subtitle ? <span className="search-result-subtitle">{item.subtitle}</span> : null}
              </Link>
            ))
          )}
        </div>
        <div className="search-footer">
          <span>up/down to move</span>
          <span>enter to open</span>
          <span>esc to close</span>
        </div>
      </div>
    </div>
  ) : null;

  function handleKey(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((idx) => Math.min(items.length - 1, idx + 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((idx) => Math.max(0, idx - 1));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const item = items[activeIndex];
      if (item) {
        setOpen(false);
        window.location.href = item.url;
      }
    }
  }

  return (
    <>
      <button
        type="button"
        className="search-trigger"
        onClick={() => setOpen(true)}
        aria-label="Open search"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <span>Search</span>
      </button>
      {mounted && overlay ? createPortal(overlay, document.body) : null}
    </>
  );
}
