import { TaskBoardFilters } from "@/components/task-board-filters";
import { TaskCard } from "@/components/task-card";
import { getMarketplaceData } from "@/lib/db";
import { getViewerProfileId } from "@/lib/session";
import { allocationTiers, taskStages } from "@/lib/types";
import type { MarketplaceFilters } from "@/lib/types";
import { labelForStage } from "@/lib/utils";

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
  const activeCount = tasks.filter((task) => task.stage === "running" || task.stage === "scheduled").length;
  const sandboxCount = tasks.filter((task) => task.sandboxCapitalUsd > 0).length;
  const creativeCount = tasks.filter((task) => task.categorySlug === "creative-works").length;
  const upcoming = tasks.filter((task) => task.stage === "voting" || task.stage === "scheduled").slice(0, 4);

  return (
    <div className="page-stack">
      <section className="panel hero-panel card-sheen space-y-4">
        <div className="eyebrow">Community feed</div>
        <h1 className="font-display text-4xl font-semibold text-foreground">Browse the Kens people would actually want to use, back, and talk about.</h1>
        <p className="max-w-4xl text-lg leading-8 text-muted">
          KenMatch is a public feed for helpful AI runs: saving money at home, making smoke days easier to handle, helping clinics and advocates move faster, protecting open tools, and giving creative groups better starter kits. Every Ken stays visible with timestamps, funding context, run progress, and public discussion.
        </p>
        <div className="metric-grid">
          <div className="metric-card"><div className="eyebrow">Active or queued</div><div className="metric-value">{activeCount}</div></div>
          <div className="metric-card"><div className="eyebrow">Sandbox demos</div><div className="metric-value">{sandboxCount}</div></div>
          <div className="metric-card"><div className="eyebrow">Creative Kens</div><div className="metric-value">{creativeCount}</div></div>
        </div>
        <div className="rounded-[1.35rem] border border-border bg-background/55 p-5 text-sm leading-7 text-muted">
          {viewer ? `Signed in as ${viewer.name}. Quick pulse votes are public and fast; priority credits stay separate and harder to spend.` : "You can read every Ken without an account. Signing in unlocks public votes, comments, and Ken submission."}
        </div>
      </section>

      <section className="board-layout">
        <div className="space-y-4">
          <TaskBoardFilters initialQuery={query} initialCategory={category} initialTier={tier} initialStage={stage} categories={categories} />

          <div className="panel board-summary-panel">
            <div className="board-summary-row text-sm text-muted">
              <div>{tasks.length} Kens match the current filters.</div>
              <div>Blocked Kens stay visible so the safety boundary is readable in public.</div>
            </div>
          </div>

          <div className="feed-list">
            {tasks.map((task) => <TaskCard key={task.id} task={task} />)}
          </div>
        </div>

        <aside className="board-sidebar">
          <div className="panel space-y-4">
            <div className="eyebrow">How this board works</div>
            <div className="space-y-3 text-sm leading-7 text-muted">
              <p>Pulse voting is the fast public signal. Priority voice is the slower, limited credit system used for real allocation pressure.</p>
              <p>Sandbox funding and simulated results are labeled as simulations. Real sponsorship and treasury support are shown separately on the funding page.</p>
              <p>Kens can ship early, stall at the compute limit, or stay partially complete if that is the honest outcome.</p>
            </div>
          </div>

          <div className="panel space-y-4">
            <div className="eyebrow">What sponsors see</div>
            <div className="space-y-3 text-sm leading-7 text-muted">
              <p>Backers can fund a category, a Ken, or the safety reserve. They do not buy rank, release approvals, or extra voice.</p>
              <p>Good sponsorship fits are simple to explain: more saved bills, faster appeal packets, clearer smoke-day guidance, safer software, or better creative tools.</p>
            </div>
          </div>

          <div className="panel space-y-4">
            <div className="eyebrow">Up next</div>
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
