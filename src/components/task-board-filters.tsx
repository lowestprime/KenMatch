"use client";

import { usePathname, useRouter } from "next/navigation";
import { useDeferredValue, useEffect, useRef, useState, useTransition } from "react";

function buildTarget(pathname: string, query: string, category: string, tier: string, stage: string) {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  if (category && category !== "all") params.set("category", category);
  if (tier && tier !== "all") params.set("tier", tier);
  if (stage && stage !== "all") params.set("stage", stage);
  return params.size > 0 ? `${pathname}?${params.toString()}` : pathname;
}

export function TaskBoardFilters({ initialQuery, initialCategory, initialTier, initialStage, categories }: { initialQuery: string; initialCategory: string; initialTier: string; initialStage: string; categories: Array<{ slug: string; name: string }> }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState(initialCategory);
  const [tier, setTier] = useState(initialTier);
  const [stage, setStage] = useState(initialStage);
  const deferredQuery = useDeferredValue(query);
  const skipFirstDeferredSync = useRef(true);

  useEffect(() => {
    if (skipFirstDeferredSync.current) {
      skipFirstDeferredSync.current = false;
      return;
    }

    const target = buildTarget(pathname, deferredQuery.trim(), category, tier, stage);
    startTransition(() => router.replace(target));
  }, [category, deferredQuery, pathname, router, stage, tier]);

  return (
    <section className="panel filters-panel">
      <label className="flex-1 space-y-2 text-xs uppercase tracking-[0.22em] text-muted">
        Search Kens
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by title, category, problem, or service path" className="field" />
      </label>
      <FilterSelect label="Category" value={category} onChange={(next) => { setCategory(next); startTransition(() => router.replace(buildTarget(pathname, deferredQuery.trim(), next, tier, stage))); }}>
        <option value="all">All categories</option>
        {categories.map((categoryOption) => <option key={categoryOption.slug} value={categoryOption.slug}>{categoryOption.name}</option>)}
      </FilterSelect>
      <FilterSelect label="Lane" value={tier} onChange={(next) => { setTier(next); startTransition(() => router.replace(buildTarget(pathname, deferredQuery.trim(), category, next, stage))); }}>
        <option value="all">All lanes</option>
        <option value="months">Months</option>
        <option value="weeks">Weeks</option>
        <option value="days">Days</option>
        <option value="queued">Queued</option>
        <option value="blocked">Blocked</option>
      </FilterSelect>
      <FilterSelect label="Status" value={stage} onChange={(next) => { setStage(next); startTransition(() => router.replace(buildTarget(pathname, deferredQuery.trim(), category, tier, next))); }}>
        <option value="all">All statuses</option>
        <option value="review">Review</option>
        <option value="voting">Voting</option>
        <option value="scheduled">Scheduled</option>
        <option value="running">Running</option>
        <option value="shipped">Shipped</option>
        <option value="blocked">Blocked</option>
      </FilterSelect>
      <div className="pb-2 text-xs uppercase tracking-[0.22em] text-muted">{isPending ? "Refreshing" : "Live"}</div>
    </section>
  );
}

function FilterSelect({ label, value, onChange, children }: { label: string; value: string; onChange: (value: string) => void; children: React.ReactNode }) {
  return (
    <label className="space-y-2 text-xs uppercase tracking-[0.22em] text-muted">
      {label}
      <select value={value} onChange={(event) => onChange(event.target.value)} className="field min-w-[11rem]">
        {children}
      </select>
    </label>
  );
}
