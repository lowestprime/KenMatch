import { getGovernanceData } from "@/lib/db";
import { getSessionProfileId } from "@/lib/session";
import { compactWords, formatDate, labelForTier } from "@/lib/utils";

export default async function GovernancePage() {
  const activeProfileId = await getSessionProfileId();
  const { governance, tasks, categories } = getGovernanceData(activeProfileId);
  const blocked = tasks.filter((task) => task.allocatedTier === "blocked");

  return (
    <div className="space-y-8">
      <section className="panel space-y-4">
        <div className="eyebrow">Governance</div>
        <h1 className="font-display text-4xl font-semibold text-ink">Safety constraints, public rationale, and visible allocation rules</h1>
        <p className="max-w-4xl text-lg leading-8 text-ink/72">
          KenMatch is opinionated about legitimacy: who can vote, what can be blocked, and why a task sits in months,
          weeks, days, or queue should all be inspectable from the outside.
        </p>
      </section>

      <section className="section-grid" data-columns="2">
        <div className="panel space-y-4">
          <div>
            <div className="eyebrow">Policy boundaries</div>
            <h2 className="mt-2 font-display text-2xl font-semibold text-ink">What the prototype enforces</h2>
          </div>
          <ul className="space-y-3 text-sm leading-7 text-ink/68">
            <li>Proposals start in review and do not receive compute until the safety council clears them.</li>
            <li>Blocked tasks remain visible, with their rationale, instead of disappearing into opaque moderation.</li>
            <li>Quadratic voice is earned per contributor profile; there is no purchase path in the product model.</li>
            <li>The public prototype follows the conception document exactly: top 3 months, next 10 weeks, next 100 days per category.</li>
          </ul>
        </div>
        <div className="panel space-y-4">
          <div>
            <div className="eyebrow">Category status</div>
            <h2 className="mt-2 font-display text-2xl font-semibold text-ink">Current board composition</h2>
          </div>
          <div className="grid gap-4">
            {categories.map((category) => (
              <div key={category.id} className="rounded-[1.3rem] border border-ink/8 bg-white/72 p-5">
                <div className="font-display text-xl font-semibold text-ink">{category.name}</div>
                <p className="mt-2 text-sm leading-7 text-ink/68">{category.description}</p>
                <div className="mt-3 text-xs uppercase tracking-[0.22em] text-ink/45">
                  {category.eligibleCount} eligible · {category.runningCount} running · {category.shippedCount} shipped
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-grid" data-columns="2">
        <div className="panel space-y-4">
          <div>
            <div className="eyebrow">Recent governance log</div>
            <h2 className="mt-2 font-display text-2xl font-semibold text-ink">Public record of council and chamber actions</h2>
          </div>
          <div className="space-y-4">
            {governance.map((event) => (
              <div key={event.id} className="rounded-[1.3rem] border border-ink/8 bg-white/72 p-5">
                <div className="flex items-center justify-between gap-3 text-xs uppercase tracking-[0.22em] text-ink/45">
                  <span>{event.house.replace("-", " ")}</span>
                  <span>{formatDate(event.createdAt)}</span>
                </div>
                <div className="mt-3 font-display text-xl font-semibold text-ink">{event.title}</div>
                <p className="mt-2 text-sm leading-7 text-ink/68">{event.decision}</p>
                <p className="mt-2 text-sm leading-7 text-ink/68">Outcome: {compactWords(event.outcome, 160)}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="panel space-y-4">
          <div>
            <div className="eyebrow">Blocked work</div>
            <h2 className="mt-2 font-display text-2xl font-semibold text-ink">Visible denials instead of silent deletions</h2>
          </div>
          <div className="space-y-4">
            {blocked.map((task) => (
              <div key={task.id} className="rounded-[1.3rem] border border-red-200 bg-red-50/80 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-display text-xl font-semibold text-red-900">{task.title}</div>
                  <span className="rounded-full bg-red-900 px-3 py-1 text-xs uppercase tracking-[0.22em] text-red-50">
                    {labelForTier(task.allocatedTier)}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-7 text-red-900/78">{task.problem}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}