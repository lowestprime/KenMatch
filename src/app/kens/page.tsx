import type { Metadata } from "next";

import { TaskBoardFilters } from "@/components/task-board-filters";
import { TaskCard } from "@/components/task-card";
import { getMarketplaceData } from "@/lib/db";
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
  const sort: SortOption = typeof params.sort === "string" && sortOptions.includes(params.sort as SortOption) ? (params.sort as SortOption) : "pulse";
  const { tasks, categories, viewer } = await getMarketplaceData(viewerProfileId, { query, category, tier, stage, sort });
  const activeCount = tasks.filter((task) => task.stage === "running" || task.stage === "scheduled").length;
  const sandboxCount = tasks.filter((task) => task.sandboxCapitalUsd > 0).length;
  const shippedCount = tasks.filter((task) => task.stage === "shipped").length;
  const upcoming = tasks.filter((task) => task.stage === "voting" || task.stage === "scheduled").slice(0, 4);

  return (
    <div className="page-stack">
      <section className="panel hero-panel card-sheen space-y-4">
        <div className="eyebrow">Community feed</div>
        <h1 className="font-display text-4xl font-semibold text-foreground">Kens competing for sustained compute</h1>
        <p className="max-w-4xl text-lg leading-8 text-muted">
          Each card is a public proposal with a quick pulse score, scarcer allocation-credit signal, simulated funding context, checkpoints, and run progress. The visual panel encodes category, lane, status, checkpoint progress, and sandbox-demo state without implying live model execution.
        </p>
        <div className="metric-grid">
          <div className="metric-card"><div className="eyebrow">Active</div><div className="metric-value">{activeCount}</div></div>
          <div className="metric-card"><div className="eyebrow">With demos</div><div className="metric-value">{sandboxCount}</div></div>
          <div className="metric-card"><div className="eyebrow">Partial/shipped</div><div className="metric-value">{shippedCount}</div></div>
        </div>
        <div className="rounded-[1.35rem] border border-border bg-background/55 p-5 text-sm leading-7 text-muted">
          {viewer ? `Signed in as ${viewer.name}. Pulse votes are fast; allocation credits are intentionally harder to concentrate.` : "You can read every Ken without an account. Signing in unlocks pulse votes, comments, allocation credits, and Ken submission."}
        </div>
      </section>

      <section className="board-layout">
        <div className="space-y-4">
          <TaskBoardFilters initialQuery={query} initialCategory={category} initialTier={tier} initialStage={stage} initialSort={sort} categories={categories} />

          <div className="panel board-summary-panel">
            <div className="board-summary-row text-sm text-muted">
              <div>{tasks.length} Kens match the current filters.</div>
              <div>Blocked Kens stay visible so the safety boundary is readable in public.</div>
            </div>
          </div>

          <div className="feed-list">
            {tasks.length > 0 ? tasks.map((task) => <TaskCard key={task.id} task={task} />) : (
              <div className="panel space-y-3 text-center">
                <p className="font-display text-xl font-semibold text-foreground">No Kens match these filters</p>
                <p className="text-sm text-muted">Try broadening your search, choosing a different category, or clearing filters.</p>
              </div>
            )}
          </div>
        </div>

        <aside className="board-sidebar">
          <div className="panel space-y-4">
            <div className="eyebrow">How this board works</div>
            <div className="space-y-3 text-sm leading-7 text-muted">
              <p>Use pulse like a forum vote: quick support or concern. Use allocation credits when you want scarce voice to affect lane ranking.</p>
              <p>Sandbox demos are always labeled as simulations. Real funding and pledges are tracked separately on the backing page.</p>
              <p>Visual indicators summarize domain, lane, checkpoint progress, and run state. They are deterministic status illustrations, not generated result imagery.</p>
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
