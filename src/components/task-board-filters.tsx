"use client";

import { usePathname, useRouter } from "next/navigation";
import { useDeferredValue, useEffect, useRef, useState, useTransition } from "react";

interface TaskBoardFiltersProps {
  initialQuery: string;
  initialCategory: string;
  initialTier: string;
  initialStage: string;
  categories: Array<{ slug: string; name: string }>;
}

function buildTarget(pathname: string, query: string, category: string, tier: string, stage: string) {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  if (category && category !== "all") params.set("category", category);
  if (tier && tier !== "all") params.set("tier", tier);
  if (stage && stage !== "all") params.set("stage", stage);
  return params.size > 0 ? `${pathname}?${params.toString()}` : pathname;
}

export function TaskBoardFilters({
  initialQuery,
  initialCategory,
  initialTier,
  initialStage,
  categories,
}: TaskBoardFiltersProps) {
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
    startTransition(() => {
      router.replace(target);
    });
  }, [deferredQuery, category, tier, stage, pathname, router, startTransition]);

  return (
    <section className="panel flex flex-col gap-4 lg:flex-row lg:items-end">
      <label className="flex-1 space-y-2 text-xs uppercase tracking-[0.22em] text-ink/55">
        Search proposals
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by title, category, or problem"
          className="w-full rounded-[1.2rem] border border-ink/10 bg-white px-4 py-3 text-sm normal-case tracking-normal text-ink outline-none transition focus:border-teal"
        />
      </label>
      <label className="space-y-2 text-xs uppercase tracking-[0.22em] text-ink/55">
        Category
        <select
          value={category}
          onChange={(event) => {
            const next = event.target.value;
            setCategory(next);
            startTransition(() => {
              router.replace(buildTarget(pathname, deferredQuery.trim(), next, tier, stage));
            });
          }}
          className="min-w-[12rem] rounded-[1.2rem] border border-ink/10 bg-white px-4 py-3 text-sm normal-case tracking-normal text-ink outline-none transition focus:border-teal"
        >
          <option value="all">All categories</option>
          {categories.map((categoryOption) => (
            <option key={categoryOption.slug} value={categoryOption.slug}>
              {categoryOption.name}
            </option>
          ))}
        </select>
      </label>
      <label className="space-y-2 text-xs uppercase tracking-[0.22em] text-ink/55">
        Tier
        <select
          value={tier}
          onChange={(event) => {
            const next = event.target.value;
            setTier(next);
            startTransition(() => {
              router.replace(buildTarget(pathname, deferredQuery.trim(), category, next, stage));
            });
          }}
          className="min-w-[10rem] rounded-[1.2rem] border border-ink/10 bg-white px-4 py-3 text-sm normal-case tracking-normal text-ink outline-none transition focus:border-teal"
        >
          <option value="all">All tiers</option>
          <option value="months">Months</option>
          <option value="weeks">Weeks</option>
          <option value="days">Days</option>
          <option value="queued">Queued</option>
          <option value="blocked">Blocked</option>
        </select>
      </label>
      <label className="space-y-2 text-xs uppercase tracking-[0.22em] text-ink/55">
        Stage
        <select
          value={stage}
          onChange={(event) => {
            const next = event.target.value;
            setStage(next);
            startTransition(() => {
              router.replace(buildTarget(pathname, deferredQuery.trim(), category, tier, next));
            });
          }}
          className="min-w-[10rem] rounded-[1.2rem] border border-ink/10 bg-white px-4 py-3 text-sm normal-case tracking-normal text-ink outline-none transition focus:border-teal"
        >
          <option value="all">All stages</option>
          <option value="review">Review</option>
          <option value="voting">Voting</option>
          <option value="scheduled">Scheduled</option>
          <option value="running">Running</option>
          <option value="shipped">Shipped</option>
          <option value="blocked">Blocked</option>
        </select>
      </label>
      <div className="pb-2 text-xs uppercase tracking-[0.22em] text-ink/45">{isPending ? "Refreshing board" : "Board live"}</div>
    </section>
  );
}