import { TaskBoardFilters } from "@/components/task-board-filters";
import { TaskCard } from "@/components/task-card";
import { getMarketplaceData } from "@/lib/db";
import { getViewerProfileId } from "@/lib/session";
import { allocationTiers, taskStages } from "@/lib/types";
import type { MarketplaceFilters } from "@/lib/types";

interface TasksPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

type TierFilter = Exclude<MarketplaceFilters["tier"], undefined>;
type StageFilter = Exclude<MarketplaceFilters["stage"], undefined>;

export default async function TasksPage({ searchParams }: TasksPageProps) {
  const params = await searchParams;
  const viewerProfileId = await getViewerProfileId();
  const query = typeof params.q === "string" ? params.q : "";
  const category = typeof params.category === "string" ? params.category : "all";
  const tier: TierFilter = typeof params.tier === "string" && allocationTiers.includes(params.tier as (typeof allocationTiers)[number]) ? (params.tier as TierFilter) : "all";
  const stage: StageFilter = typeof params.stage === "string" && taskStages.includes(params.stage as (typeof taskStages)[number]) ? (params.stage as StageFilter) : "all";
  const { tasks, categories, viewer } = await getMarketplaceData(viewerProfileId, { query, category, tier, stage });

  return (
    <div className="space-y-8">
      <section className="panel space-y-4">
        <div className="eyebrow">Marketplace</div>
        <h1 className="font-display text-4xl font-semibold text-foreground">Ranked proposals, visible blocked work, and realistic long-horizon AI examples</h1>
        <p className="max-w-4xl text-lg leading-8 text-muted">
          The board mixes public-interest operations, open infrastructure, science synthesis, and other continuous-compute workloads that real institutions and communities would actually want.
        </p>
        <div className="rounded-[1.35rem] border border-border bg-background/55 p-5 text-sm leading-7 text-muted">
          {viewer ? `Active contributor: ${viewer.name}. Pulse is broad curation; quadratic voice remains the scarce merit ledger.` : "Anonymous view. The marketplace remains fully readable without an account; participation requires attributable identity and session state."}
        </div>
      </section>

      <TaskBoardFilters initialQuery={query} initialCategory={category} initialTier={tier} initialStage={stage} categories={categories} />

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4 text-sm text-muted">
          <div>{tasks.length} proposals match the current filters.</div>
          <div>Blocked and queued tasks stay visible so governance remains inspectable instead of silently suppressive.</div>
        </div>
        <div className="section-grid" data-columns="3">
          {tasks.map((task) => <TaskCard key={task.id} task={task} />)}
        </div>
      </section>
    </div>
  );
}
