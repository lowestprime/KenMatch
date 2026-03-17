import { getGovernanceData } from "@/lib/db";
import { getViewerProfileId } from "@/lib/session";
import { formatDate, labelForTier } from "@/lib/utils";

export default async function GovernancePage() {
  const viewerProfileId = await getViewerProfileId();
  const { governance, blockedTasks, categories, profiles } = await getGovernanceData(viewerProfileId);

  return (
    <div className="space-y-8">
      <section className="panel space-y-4">
        <div className="eyebrow">Governance</div>
        <h1 className="font-display text-4xl font-semibold text-foreground">Safety boundaries, checkpoint gates, and attributable identity</h1>
        <p className="max-w-4xl text-lg leading-8 text-muted">
          KenMatch keeps harmful work visible but blocked, makes release gates explicit, and ties meaningful participation to attributable contributor accounts rather than anonymous disposable power.
        </p>
      </section>

      <section className="section-grid" data-columns="2">
        <div className="panel space-y-4">
          <div className="eyebrow">Policy boundaries</div>
          <ul className="space-y-3 text-sm leading-7 text-muted">
            <li>Quadratic voice is earned and account-bound. Revenue funds compute but does not buy governance.</li>
            <li>Proposals can go public immediately, but execution remains gated behind safety review and checkpoint release conditions.</li>
            <li>Blocked work remains visible so the legitimacy boundary is inspectable rather than hidden.</li>
            <li>Checkpoint approvals create an explicit human-in-the-loop kill switch for long-running agentic work.</li>
          </ul>
        </div>
        <div className="panel space-y-4">
          <div className="eyebrow">Attestation ladder</div>
          <div className="grid gap-4">
            {profiles.slice(0, 6).map((profile) => (
              <div key={profile.id} className="rounded-[1.3rem] border border-border bg-background/55 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-semibold text-foreground">{profile.name}</div>
                    <div className="text-sm text-muted">{profile.role}</div>
                  </div>
                  <span className="tag">{profile.attestationLevel}</span>
                </div>
                <p className="mt-2 text-sm leading-7 text-muted">{profile.attestation}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="panel space-y-4">
          <div className="eyebrow">Recent governance log</div>
          {governance.map((event) => (
            <div key={event.id} className="rounded-[1.3rem] border border-border bg-background/55 p-5">
              <div className="flex items-center justify-between gap-3 text-xs uppercase tracking-[0.22em] text-muted">
                <span>{event.house.replace("-", " ")}</span>
                <span>{formatDate(event.createdAt)}</span>
              </div>
              <div className="mt-3 font-display text-xl font-semibold text-foreground">{event.title}</div>
              <p className="mt-2 text-sm leading-7 text-muted">{event.decision}</p>
              <p className="mt-2 text-sm leading-7 text-muted">Outcome: {event.outcome}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section-grid" data-columns="2">
        <div className="panel space-y-4">
          <div className="eyebrow">Visible blocked work</div>
          {blockedTasks.map((task) => (
            <div key={task.id} className="rounded-[1.3rem] border border-red-500/30 bg-red-500/10 p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="font-display text-xl font-semibold text-red-300">{task.title}</div>
                <span className="tier-chip is-blocked">{labelForTier(task.allocatedTier)}</span>
              </div>
              <p className="mt-2 text-sm leading-7 text-red-100/80">{task.problem}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="panel space-y-4">
        <div className="eyebrow">Category governance health</div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {categories.map((category) => (
            <div key={category.id} className="rounded-[1.3rem] border border-border bg-background/55 p-4 text-sm text-muted">
              <div className="font-display text-xl font-semibold text-foreground">{category.name}</div>
              <p className="mt-2">{category.description}</p>
              <div className="mt-3 text-xs uppercase tracking-[0.22em] text-muted">{category.eligibleCount} eligible · {category.runningCount} running · {category.shippedCount} shipped</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
