import { getGovernanceData } from "@/lib/db";
<<<<<<< HEAD
import { getViewerProfileId } from "@/lib/session";
import { formatDate, labelForTier } from "@/lib/utils";

export default async function GovernancePage() {
  const viewerProfileId = await getViewerProfileId();
  const { governance, blockedTasks, categories, profiles } = await getGovernanceData(viewerProfileId);
=======
import { getSessionProfileId } from "@/lib/session";
import { compactWords, formatCurrency, formatDate, labelForTier } from "@/lib/utils";

export default async function GovernancePage() {
  const activeProfileId = await getSessionProfileId();
  const { governance, tasks, categories, economics } = getGovernanceData(activeProfileId);
  const blocked = tasks.filter((task) => task.allocatedTier === "blocked");
>>>>>>> origin/main

  return (
    <div className="space-y-8">
      <section className="panel space-y-4">
        <div className="eyebrow">Governance</div>
<<<<<<< HEAD
        <h1 className="font-display text-4xl font-semibold text-foreground">Safety boundaries, checkpoint gates, and attributable identity</h1>
        <p className="max-w-4xl text-lg leading-8 text-muted">
          KenMatch keeps harmful work visible but blocked, makes release gates explicit, and ties meaningful participation to attributable contributor accounts rather than anonymous disposable power.
=======
        <h1 className="font-display text-4xl font-semibold text-ink">Safety constraints, public rationale, and visible allocation rules</h1>
        <p className="max-w-4xl text-lg leading-8 text-ink/72">
          KenMatch is opinionated about legitimacy: who can vote, what can be blocked, how bonds behave, and why a task sits in months, weeks, days, or queue should all be inspectable from the outside.
>>>>>>> origin/main
        </p>
      </section>

      <section className="section-grid" data-columns="2">
        <div className="panel space-y-4">
<<<<<<< HEAD
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
=======
          <div>
            <div className="eyebrow">Policy boundaries</div>
            <h2 className="mt-2 font-display text-2xl font-semibold text-ink">What the prototype enforces</h2>
          </div>
          <ul className="space-y-3 text-sm leading-7 text-ink/68">
            <li>Proposals start in review, can collect public discussion immediately, and do not receive compute until the safety council clears them.</li>
            <li>Blocked tasks remain visible with their denial rationale instead of disappearing into opaque moderation.</li>
            <li>Quadratic allocation voice is earned per contributor profile; there is no purchase path in the product model.</li>
            <li>Proposal bonds are posted in the same non-purchasable voice credits, creating a public quality stake.</li>
            <li>Checkpoint releases show community approval status before a new compute tranche is released.</li>
          </ul>
        </div>
        <div className="panel space-y-4">
          <div>
            <div className="eyebrow">Institutional structure</div>
            <h2 className="mt-2 font-display text-2xl font-semibold text-ink">Governance houses and treasury logic</h2>
          </div>
          <div className="grid gap-4">
            <div className="rounded-[1.3rem] border border-line bg-page/72 p-5">
              <div className="font-display text-xl font-semibold text-ink">Safety council</div>
              <p className="mt-2 text-sm leading-7 text-ink/68">Screens prohibited dual-use work, sets monitor conditions, and keeps a visible denial ledger.</p>
            </div>
            <div className="rounded-[1.3rem] border border-line bg-page/72 p-5">
              <div className="font-display text-xl font-semibold text-ink">Allocation chamber</div>
              <p className="mt-2 text-sm leading-7 text-ink/68">Uses quadratic voice to commit scarce compute, while public pulse votes and comments shape quality before the spend.</p>
            </div>
            <div className="rounded-[1.3rem] border border-line bg-page/72 p-5">
              <div className="font-display text-xl font-semibold text-ink">Treasury</div>
              <p className="mt-2 text-sm leading-7 text-ink/68">Current modeled treasury balance is {formatCurrency(economics.treasuryBalanceUsd)} with {formatCurrency(economics.treasuryMonthlyUsd)} in monthly inflow.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section-grid" data-columns="2">
        <div className="panel space-y-4">
          <div>
            <div className="eyebrow">Category status</div>
            <h2 className="mt-2 font-display text-2xl font-semibold text-ink">Current board composition</h2>
          </div>
          <div className="grid gap-4">
            {categories.map((category) => (
              <div key={category.id} className="rounded-[1.3rem] border border-line bg-page/72 p-5">
                <div className="font-display text-xl font-semibold text-ink">{category.name}</div>
                <p className="mt-2 text-sm leading-7 text-ink/68">{category.description}</p>
                <div className="mt-3 text-xs uppercase tracking-[0.22em] text-ink/45">
                  {category.eligibleCount} eligible · {category.runningCount} running · {category.shippedCount} shipped
>>>>>>> origin/main
                </div>
                <p className="mt-2 text-sm leading-7 text-muted">{profile.attestation}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="panel space-y-4">
<<<<<<< HEAD
          <div className="eyebrow">Recent governance log</div>
          {governance.map((event) => (
            <div key={event.id} className="rounded-[1.3rem] border border-border bg-background/55 p-5">
              <div className="flex items-center justify-between gap-3 text-xs uppercase tracking-[0.22em] text-muted">
                <span>{event.house.replace("-", " ")}</span>
                <span>{formatDate(event.createdAt)}</span>
=======
          <div>
            <div className="eyebrow">Recent governance log</div>
            <h2 className="mt-2 font-display text-2xl font-semibold text-ink">Public record of council and chamber actions</h2>
          </div>
          <div className="space-y-4">
            {governance.map((event) => (
              <div key={event.id} className="rounded-[1.3rem] border border-line bg-page/72 p-5">
                <div className="flex items-center justify-between gap-3 text-xs uppercase tracking-[0.22em] text-ink/45">
                  <span>{event.house.replace("-", " ")}</span>
                  <span>{formatDate(event.createdAt)}</span>
                </div>
                <div className="mt-3 font-display text-xl font-semibold text-ink">{event.title}</div>
                <p className="mt-2 text-sm leading-7 text-ink/68">{event.decision}</p>
                <p className="mt-2 text-sm leading-7 text-ink/68">Outcome: {compactWords(event.outcome, 170)}</p>
>>>>>>> origin/main
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
<<<<<<< HEAD
          <div className="eyebrow">Visible blocked work</div>
          {blockedTasks.map((task) => (
            <div key={task.id} className="rounded-[1.3rem] border border-red-500/30 bg-red-500/10 p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="font-display text-xl font-semibold text-red-300">{task.title}</div>
                <span className="tier-chip is-blocked">{labelForTier(task.allocatedTier)}</span>
=======
          <div>
            <div className="eyebrow">Blocked work</div>
            <h2 className="mt-2 font-display text-2xl font-semibold text-ink">Visible denials instead of silent deletions</h2>
          </div>
          <div className="space-y-4">
            {blocked.map((task) => (
              <div key={task.id} className="rounded-[1.3rem] border border-red-200 bg-red-50/80 p-5 dark:border-red-900/60 dark:bg-red-950/30">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-display text-xl font-semibold text-red-900 dark:text-red-100">{task.title}</div>
                  <span className="rounded-full bg-red-900 px-3 py-1 text-xs uppercase tracking-[0.22em] text-red-50">
                    {labelForTier(task.allocatedTier)}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-7 text-red-900/78 dark:text-red-100/80">{task.problem}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="panel space-y-4">
          <div>
            <div className="eyebrow">Identity and attestation</div>
            <h2 className="mt-2 font-display text-2xl font-semibold text-ink">Sybil resistance shows up as attestable voice, not anonymous spend</h2>
          </div>
          <div className="space-y-4">
            {tasks.slice(0, 4).map((task) => (
              <div key={task.id} className="rounded-[1.3rem] border border-line bg-page/72 p-5">
                <div className="font-display text-xl font-semibold text-ink">{task.proposerName}</div>
                <p className="mt-2 text-sm leading-7 text-ink/68">Current proposer for <span className="font-semibold text-ink">{task.title}</span>. Their bond and downstream vote influence are constrained by an attested profile instead of money.</p>
>>>>>>> origin/main
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
