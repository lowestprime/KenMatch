"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

import { SearchField } from "@/components/search-field";
import {
  buildMarketplaceHref,
  DEFAULT_MARKETPLACE_SORT,
  hasActiveMarketplaceFilters,
  type MarketplaceQueryState,
} from "@/lib/discovery";

export function TaskBoardFilters({ initialQuery, initialCategory, initialTier, initialStage, initialSort, categories }: { initialQuery: string; initialCategory: string; initialTier: string; initialStage: string; initialSort: string; categories: Array<{ slug: string; name: string }> }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const initialState = {
    query: initialQuery,
    category: initialCategory,
    tier: initialTier,
    stage: initialStage,
    sort: initialSort,
    page: 1,
  } as MarketplaceQueryState;
  const [filters, setFilters] = useState(initialState);
  const filtersRef = useRef(initialState);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTargetRef = useRef(buildMarketplaceHref(pathname, initialState));

  useEffect(() => {
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
      searchTimerRef.current = null;
    }
    const next = {
      query: initialQuery,
      category: initialCategory,
      tier: initialTier,
      stage: initialStage,
      sort: initialSort,
      page: 1,
    } as MarketplaceQueryState;
    filtersRef.current = next;
    lastTargetRef.current = buildMarketplaceHref(pathname, next);
    // RSC navigation and browser history are the external source of truth for these controls.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFilters(next);
  }, [initialCategory, initialQuery, initialSort, initialStage, initialTier, pathname]);

  useEffect(() => () => {
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }
  }, []);

  function cancelScheduledSearch() {
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
      searchTimerRef.current = null;
    }
  }

  function navigate(next: MarketplaceQueryState) {
    filtersRef.current = next;
    setFilters(next);
    const target = buildMarketplaceHref(pathname, next);
    if (target === lastTargetRef.current) {
      return;
    }
    lastTargetRef.current = target;
    startTransition(() => router.replace(target));
  }

  function updateQuery(nextQuery: string) {
    const next = { ...filtersRef.current, query: nextQuery, page: 1 };
    filtersRef.current = next;
    setFilters(next);
    cancelScheduledSearch();
    searchTimerRef.current = setTimeout(() => {
      searchTimerRef.current = null;
      navigate(filtersRef.current);
    }, 260);
  }

  function updateSelect(key: "category" | "tier" | "stage" | "sort", value: string) {
    cancelScheduledSearch();
    navigate({ ...filtersRef.current, [key]: value, page: 1 } as MarketplaceQueryState);
  }

  function resetFilters() {
    cancelScheduledSearch();
    navigate({
      query: "",
      category: "all",
      tier: "all",
      stage: "all",
      sort: DEFAULT_MARKETPLACE_SORT,
      page: 1,
    });
    requestAnimationFrame(() => searchInputRef.current?.focus());
  }

  const filtersActive = hasActiveMarketplaceFilters(filters);

  return (
    <section className="panel filters-panel">
      <label className="filter-search-label">
        <span>Search Kens</span>
        <SearchField
          inputRef={searchInputRef}
          value={filters.query}
          onChange={(event) => updateQuery(event.target.value)}
          onClear={() => {
            cancelScheduledSearch();
            navigate({ ...filtersRef.current, query: "", page: 1 });
            requestAnimationFrame(() => searchInputRef.current?.focus());
          }}
          placeholder="Search by title, use case, model, sponsor fit, or category"
          label="Search Kens"
          className="search-field-board"
        />
      </label>
      <FilterSelect label="Category" value={filters.category} onChange={(next) => updateSelect("category", next)}>
        <option value="all">All categories</option>
        {categories.map((categoryOption) => <option key={categoryOption.slug} value={categoryOption.slug}>{categoryOption.name}</option>)}
      </FilterSelect>
      <FilterSelect label="Lane" value={filters.tier} onChange={(next) => updateSelect("tier", next)}>
        <option value="all">All lanes</option>
        <option value="months">Months</option>
        <option value="weeks">Weeks</option>
        <option value="days">Days</option>
        <option value="queued">Queued</option>
        <option value="blocked">Blocked</option>
      </FilterSelect>
      <FilterSelect label="Status" value={filters.stage} onChange={(next) => updateSelect("stage", next)}>
        <option value="all">All statuses</option>
        <option value="review">Review</option>
        <option value="voting">Voting</option>
        <option value="scheduled">Scheduled</option>
        <option value="running">Running</option>
        <option value="shipped">Shipped</option>
        <option value="blocked">Blocked</option>
      </FilterSelect>
      <FilterSelect label="Sort" value={filters.sort} onChange={(next) => updateSelect("sort", next)}>
        <option value="active">Discovery (default)</option>
        <option value="pulse">Broad pulse</option>
        <option value="voice">Voice</option>
        <option value="recent">Recent activity</option>
        <option value="newest">Newest first</option>
      </FilterSelect>
      <div className="filter-actions">
        <button type="button" className="cta-secondary cta-compact filter-reset" onClick={resetFilters} disabled={!filtersActive || isPending}>
          Reset filters
        </button>
        <div className="filter-live-state" role="status" aria-live="polite">{isPending ? "Refreshing" : "Live"}</div>
      </div>
    </section>
  );
}

function FilterSelect({ label, value, onChange, children }: { label: string; value: string; onChange: (value: string) => void; children: React.ReactNode }) {
  return (
    <label className="space-y-2 text-xs uppercase tracking-[0.22em] text-muted">
      {label}
      <select value={value} onChange={(event) => onChange(event.target.value)} className="field filter-select-field">
        {children}
      </select>
    </label>
  );
}
