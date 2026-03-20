import { TaskBoardFilters } from "@/components/task-board-filters";
import { TaskCard } from "@/components/task-card";
import { getMarketplaceData } from "@/lib/db";
import { getViewerProfileId } from "@/lib/session";
import { allocationTiers, taskStages } from "@/lib/types";
import type { MarketplaceFilters } from "@/lib/types";

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
  const { tasks, categories, viewer } = await getMarketplaceData(viewerProfileId, { query, category, tier, stage });

  return (
    <div className="page-stack">
      <section className="panel space-y-4">
        <div className="eyebrow">Ken board</div>
        <h1 className="font-display text-4xl font-semibold text-foreground">Browse active, queued, shipped, and blocked Kens</h1>
        <p className="max-w-4xl text-lg leading-8 text-muted">
          The board spans everyday services, public-interest workflows, open tools, science support, and creative work. Every Ken stays visible with timestamps, funding context, and run status.
        </p>
        <div className="rounded-[1.35rem] border border-border bg-background/55 p-5 text-sm leading-7 text-muted">
          {viewer ? `Signed in as ${viewer.name}. Quick public voting is separate from scarce voice credits.` : "You can read every Ken without an account. Signing in unlocks public votes, comments, and submission."}
        </div>
      </section>

      <TaskBoardFilters initialQuery={query} initialCategory={category} initialTier={tier} initialStage={stage} categories={categories} />

      <section className="space-y-4">
        <div className="board-summary-row text-sm text-muted">
          <div>{tasks.length} Kens match the current filters.</div>
          <div>Blocked Kens remain visible so safety boundaries and governance choices stay legible.</div>
        </div>
        <div className="section-grid" data-columns="3">
          {tasks.map((task) => <TaskCard key={task.id} task={task} />)}
        </div>
      </section>
    </div>
  );
}
