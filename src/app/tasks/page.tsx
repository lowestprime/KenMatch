import { TaskBoardFilters } from "@/components/task-board-filters";
import { TaskCard } from "@/components/task-card";
import { getMarketplaceData } from "@/lib/db";
import { getSessionProfileId } from "@/lib/session";
import { allocationTiers, taskStages } from "@/lib/types";
import type { MarketplaceFilters } from "@/lib/types";

interface TasksPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

type TierFilter = Exclude<MarketplaceFilters["tier"], undefined>;
type StageFilter = Exclude<MarketplaceFilters["stage"], undefined>;

export default async function TasksPage({ searchParams }: TasksPageProps) {
  const params = await searchParams;
  const activeProfileId = await getSessionProfileId();
  const query = typeof params.q === "string" ? params.q : "";
  const category = typeof params.category === "string" ? params.category : "all";
  const tier: TierFilter =
    typeof params.tier === "string" && allocationTiers.includes(params.tier as (typeof allocationTiers)[number])
      ? (params.tier as TierFilter)
      : "all";
  const stage: StageFilter =
    typeof params.stage === "string" && taskStages.includes(params.stage as (typeof taskStages)[number])
      ? (params.stage as StageFilter)
      : "all";
  const { tasks, categories, activeProfile } = getMarketplaceData(activeProfileId, { query, category, tier, stage });

  return (
    <div className="space-y-8">
      <section className="panel space-y-4">
        <div className="eyebrow">Marketplace</div>
        <h1 className="font-display text-4xl font-semibold text-ink">Ranked proposals and compute lanes</h1>
        <p className="max-w-4xl text-lg leading-8 text-ink/72">
          Every task below is derived from the vision documents: structured proposals, transparent ranking, visible safety
          status, and tier placement that follows the raw months/weeks/days protocol.
        </p>
        <div className="rounded-[1.4rem] border border-ink/10 bg-white/70 p-5 text-sm leading-7 text-ink/68">
          Active voter: <span className="font-semibold text-ink">{activeProfile.name}</span> with
          <span className="font-semibold text-ink"> {activeProfile.availableCredits}</span> credits free.
        </div>
      </section>

      <TaskBoardFilters
        initialQuery={query}
        initialCategory={category}
        initialTier={tier}
        initialStage={stage}
        categories={categories}
      />

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4 text-sm text-ink/62">
          <div>{tasks.length} proposals match the current board filters.</div>
          <div>Queued tasks remain visible even when they have not yet cleared review or reached the vote threshold.</div>
        </div>
        <div className="section-grid" data-columns="3">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      </section>
    </div>
  );
}