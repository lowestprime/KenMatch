import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { TaskBoardFilters } from "@/components/task-board-filters";
import { TaskCard } from "@/components/task-card";
import { getMarketplaceData } from "@/lib/db";
import {
  buildMarketplaceHref,
  DEFAULT_MARKETPLACE_SORT,
  normalizeMarketplacePage,
} from "@/lib/discovery";
import { KEN_DEFINITION } from "@/lib/faq";
import { getViewerProfileId } from "@/lib/session";
import { allocationTiers, sortOptions, taskStages } from "@/lib/types";
import type { MarketplaceFilters, SortOption } from "@/lib/types";
import { labelForStage } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Kens",
  description: "Browse, filter, pulse, and allocate voice to public Kens by category, lane, and run status.",
  openGraph: { title: "Kens | KenMatch", description: "Browse public Kens with visible ranking, funding context, checkpoints, and simulated run outputs." },
};

interface KensPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

type TierFilter = Exclude<MarketplaceFilters["tier"], undefined>;
type StageFilter = Exclude<MarketplaceFilters["stage"], undefined>;

export default async function KensPage({ searchParams }: KensPageProps) {
  const params = await searchParams;
  const viewerProfileId = await getViewerProfileId();
  const query = typeof params.q === "string" ? params.q : "";
  const category = typeof params.category === "string" ? params.category : "all";
  const tier: TierFilter = typeof params.tier === "string" && allocationTiers.includes(params.tier as (typeof allocationTiers)[number]) ? (params.tier as TierFilter) : "all";
  const stage: StageFilter = typeof params.stage === "string" && taskStages.includes(params.stage as (typeof taskStages)[number]) ? (params.stage as StageFilter) : "all";
  const sort: SortOption = typeof params.sort === "string" && sortOptions.includes(params.sort as SortOption) ? (params.sort as SortOption) : DEFAULT_MARKETPLACE_SORT;
  const requestedPage = normalizeMarketplacePage(typeof params.page === "string" ? params.page : undefined);
  const filters = { query, category, tier, stage, sort, page: requestedPage };
  const { tasks, categories, viewer, pageInfo, resultCounts } = await getMarketplaceData(viewerProfileId, filters);
  if (requestedPage !== pageInfo.page) {
    redirect(buildMarketplaceHref("/kens", { ...filters, page: pageInfo.page }));
  }
  const upcoming = tasks.filter((task) => task.stage === "voting" || task.stage === "scheduled").slice(0, 4);
  const firstResult = pageInfo.totalResults > 0 ? (pageInfo.page - 1) * pageInfo.pageSize + 1 : 0;
  const lastResult = Math.min(pageInfo.page * pageInfo.pageSize, pageInfo.totalResults);

  return (
    <div className="page-stack">
      <section className="panel hero-panel card-sheen space-y-4">
        <div className="eyebrow">Community feed</div>
        <h1 className="font-display text-4xl font-semibold text-foreground">Kens competing for sustained compute</h1>
        <p className="max-w-4xl text-lg leading-8 text-muted">
          {KEN_DEFINITION} Each card adds quick pulse signal, scarcer allocation-credit signal, simulated funding context, checkpoints, and run progress without implying live model execution.
        </p>
        <div className="metric-grid">
          <div className="metric-card"><div className="eyebrow">Active</div><div className="metric-value">{resultCounts.active}</div></div>
          <div className="metric-card"><div className="eyebrow">With demos</div><div className="metric-value">{resultCounts.withDemos}</div></div>
          <div className="metric-card"><div className="eyebrow">Partial/shipped</div><div className="metric-value">{resultCounts.shipped}</div></div>
        </div>
        <div className="rounded-[1.35rem] border border-border bg-background/55 p-5 text-sm leading-7 text-muted">
          {viewer ? `Signed in as ${viewer.name}. Pulse votes are fast; allocation credits are intentionally harder to concentrate.` : "You can read every Ken without an account. Signing in unlocks pulse votes, comments, allocation credits, Ken saving, and Ken submission."}
        </div>
      </section>

      <section className="board-layout">
        <div className="space-y-4">
          <TaskBoardFilters
            initialQuery={query}
            initialCategory={category}
            initialTier={tier}
            initialStage={stage}
            initialSort={sort}
            categories={categories}
          />

          <div className="panel board-summary-panel">
            <div className="board-summary-row text-sm text-muted">
              <div>{pageInfo.totalResults} Kens match. Showing {firstResult}-{lastResult}.</div>
              <div>Blocked Kens stay visible so the safety boundary is readable in public.</div>
            </div>
          </div>

          <div className="feed-list">
            {tasks.length > 0 ? tasks.map((task) => <TaskCard key={task.id} task={task} signedIn={Boolean(viewerProfileId)} />) : (
              <div className="panel space-y-3 text-center">
                <p className="font-display text-xl font-semibold text-foreground">No Kens match these filters</p>
                <p className="text-sm text-muted">Try broadening your search, choosing a different category, or clearing filters.</p>
                <Link href="/kens" className="cta-secondary cta-compact">Reset filters</Link>
              </div>
            )}
          </div>

          {pageInfo.totalPages > 1 ? (
            <nav className="panel marketplace-pagination" aria-label="Ken feed pages">
              {pageInfo.hasPreviousPage ? (
                <Link className="cta-secondary cta-compact" href={buildMarketplaceHref("/kens", { ...filters, page: pageInfo.page - 1 })} rel="prev">
                  Previous
                </Link>
              ) : <span />}
              <span className="marketplace-page-status" aria-live="polite">
                Page {pageInfo.page} of {pageInfo.totalPages}
              </span>
              {pageInfo.hasNextPage ? (
                <Link className="cta-secondary cta-compact" href={buildMarketplaceHref("/kens", { ...filters, page: pageInfo.page + 1 })} rel="next">
                  Next
                </Link>
              ) : <span />}
            </nav>
          ) : null}
        </div>

        <aside className="board-sidebar">
          <div className="panel space-y-4">
            <div className="eyebrow">How this board works</div>
            <div className="space-y-3 text-sm leading-7 text-muted">
              <p>Use pulse like a forum vote: quick support or concern. Use allocation credits when you want scarce voice to affect lane ranking.</p>
              <p>Sandbox demos are always labeled as simulations. Real funding and pledges are tracked separately on the backing page.</p>
              <p>Category marks identify the domain and lane. Kens only show project-specific art when an admin uploads a reviewed illustration with alt text.</p>
              <p>Kens can ship early, pause at a compute limit, continue running, or deliver partial artifacts. The status stays visible.</p>
            </div>
          </div>

          <div className="panel space-y-4">
            <div className="eyebrow">For potential backers</div>
            <div className="space-y-3 text-sm leading-7 text-muted">
              <p>Backers can fund a category, a Ken, or the safety reserve. They do not buy rank, release approvals, or extra voice.</p>
              <p>Good sponsorship fits are concrete: reproducible lab maps, dependency safety plans, evaluation harnesses, protocol scouts, and auditable engineering design work.</p>
            </div>
          </div>

          <div className="panel space-y-4">
            <div className="eyebrow">Coming soon</div>
            {upcoming.length > 0 ? upcoming.map((task) => (
              <div key={task.id} className="rounded-[1.2rem] border border-border bg-background/55 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-semibold text-foreground">{task.title}</div>
                  <span className="tag">{labelForStage(task.stage)}</span>
                </div>
                <p className="mt-2 text-sm leading-6 text-muted">{task.sampleOutcome}</p>
              </div>
            )) : <p className="text-sm text-muted">No upcoming Kens match these filters yet.</p>}
          </div>
        </aside>
      </section>
    </div>
  );
}
