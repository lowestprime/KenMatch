import type { Metadata } from "next";
import { Suspense } from "react";

import { CheckoutBanner } from "@/components/checkout-banner";
import { SponsorForm } from "@/components/sponsor-form";
import { getEconomicsData, getMarketplaceData } from "@/lib/db";
import { getViewerProfileId } from "@/lib/session";
import { stripeEnabled } from "@/lib/stripe";
import { formatCurrency, formatDateTime, formatNumber, formatPercent } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Funding",
  description: "See how KenMatch is funded. Treasury balance, revenue streams, sponsor commitments, and public ledger entries.",
};

function labelForRestrictionScope(value: "general" | "category" | "ken" | "safety-reserve") {
  switch (value) {
    case "general":
      return "Shared treasury";
    case "category":
      return "Category-restricted";
    case "ken":
      return "Ken-restricted";
    case "safety-reserve":
      return "Safety reserve";
  }
}

function labelForFundingState(value: "simulated" | "projected" | "committed") {
  switch (value) {
    case "simulated":
      return "Simulated";
    case "projected":
      return "Projected";
    case "committed":
      return "Committed";
  }
}

export default async function EconomicsPage() {
  const viewerProfileId = await getViewerProfileId();
  const [{ summary, revenueStreams, treasuryEntries, fundedTasks, sponsorshipCommitments }, marketplace] = await Promise.all([
    getEconomicsData(viewerProfileId),
    getMarketplaceData(viewerProfileId, { query: "", category: "all", tier: "all", stage: "all" }),
  ]);

  const sponsorableKens = marketplace.tasks.slice(0, 12).map((task) => ({ id: task.id, title: task.title }));
  const sponsorableCategories = marketplace.categories.map((category) => ({ id: category.id, name: category.name }));
  const liveCheckoutEnabled = stripeEnabled();

  return (
    <div className="page-stack">
      <Suspense fallback={null}><CheckoutBanner /></Suspense>
      <section className="panel hero-panel card-sheen space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="eyebrow">Funding and treasury</div>
          <span className={`governor-badge ${summary.governorActive ? "is-active" : "is-healthy"}`}>
            {summary.governorActive
              ? `Governor active — adjusted treasury share ${summary.adjustedTreasurySharePercent}%`
              : `Coverage healthy — ${summary.adjustedTreasurySharePercent}% treasury share`}
          </span>
        </div>
        <h1 className="max-w-4xl font-display text-4xl font-semibold text-foreground sm:text-5xl">
          Back useful Kens with real money or clearly labeled sandbox funding, without selling influence.
        </h1>
        <p className="max-w-4xl text-lg leading-8 text-muted">
          KenMatch separates money from voice. Paid services, screened licensing, routing margin, and sponsorships can grow the treasury, but ranking stays on the public board and release still depends on checkpoints, safety review, and visible evidence.
        </p>
        <div className="signal-bar">
          <div className="flow-card">
            <div className="eyebrow">Coverage</div>
            <div className="metric-value">{summary.coverageMonths.toFixed(1)} mo</div>
            <div className="text-sm text-muted">{summary.coverageStatus} vs {summary.coverageTargetMonths.toFixed(0)} mo target</div>
          </div>
          <div className="flow-card">
            <div className="eyebrow">Committed treasury / month</div>
            <div className="metric-value">{formatCurrency(summary.committedTreasuryMonthlyUsd)}</div>
            <div className="text-sm text-muted">Actual recurring support</div>
          </div>
          <div className="flow-card">
            <div className="eyebrow">Projected sponsor commitments</div>
            <div className="metric-value">{formatCurrency(summary.sponsorCommitmentsUsd)}</div>
            <div className="text-sm text-muted">Visible, but not counted as committed</div>
          </div>
        </div>
      </section>

      <section className="metric-grid">
        {[
          ["Treasury balance", formatCurrency(summary.treasuryBalanceUsd)],
          ["Monthly public burn", formatCurrency(summary.monthlyPublicBurnUsd)],
          ["Coverage gap", formatCurrency(Math.round((summary.coverageGapMonths / Math.max(summary.coverageTargetMonths, 1)) * summary.monthlyPublicBurnUsd))],
          ["Restricted funding", formatCurrency(summary.restrictedFundingUsd)],
          ["Projected restricted", formatCurrency(summary.projectedRestrictedFundingUsd)],
          ["Sandbox funding", formatCurrency(summary.simulatedFundingUsd)],
          ["Safety reserve", formatCurrency(summary.safetyReserveUsd)],
          ["Verified streams", formatNumber(summary.verifiedFundingStreams)],
        ].map(([label, value]) => (
          <div key={label} className="metric-card">
            <div className="eyebrow">{label}</div>
            <div className="metric-value">{value}</div>
          </div>
        ))}
      </section>

      <section className="section-grid" data-columns="2">
        <SponsorForm
          categories={sponsorableCategories}
          kens={sponsorableKens}
          liveCheckoutEnabled={liveCheckoutEnabled}
        />
        <div className="panel space-y-4">
          <div className="eyebrow">Funding constitution</div>
          <h2 className="font-display text-3xl font-semibold text-foreground">What money can and cannot do here</h2>
          <div className="grid gap-4">
            {[
              ["Money can add supply", "Funds can support compute, safety review, moderation, and delivery support."],
              ["Money cannot buy voice", "Backers do not receive vote credits, ranking boosts, or release vetoes."],
              ["Restrictions stay visible", "Category, Ken, and safety-reserve restrictions stay visible in the public ledger."],
              ["Contributors keep consent", "Licensing flows require screened data and explicit contributor consent."],
            ].map(([title, copy]) => (
              <div key={title} className="rounded-[1.3rem] border border-border bg-background/55 p-5">
                <div className="font-display text-xl font-semibold text-foreground">{title}</div>
                <p className="mt-2 text-sm leading-7 text-muted">{copy}</p>
              </div>
            ))}
          </div>
          <div className="rounded-[1.3rem] border border-border bg-background/55 p-5">
            <div className="font-display text-xl font-semibold text-foreground">Treasury policy</div>
            <p className="mt-2 text-sm leading-7 text-muted">
              The board is healthiest once it keeps roughly {summary.coverageTargetMonths.toFixed(0)} months of public burn in reserve.
              When coverage dips, the economics view makes that shortfall visible instead of hiding it behind optimistic projections or vague sponsor promises.
            </p>
          </div>
        </div>
      </section>

      <section className="section-grid" data-columns="2">
        <div className="panel space-y-4">
          <div className="eyebrow">How the board keeps running</div>
          {revenueStreams.map((stream) => (
            <div key={stream.id} className="rounded-[1.3rem] border border-border bg-background/55 p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="font-display text-xl font-semibold text-foreground">{stream.name}</div>
                <span className="tag">{stream.status}</span>
              </div>
              <p className="mt-2 text-sm leading-7 text-muted">{stream.description}</p>
              <div className="mt-3 grid gap-3 text-sm text-muted sm:grid-cols-3">
                <div className="stat-card"><span>Monthly</span><strong>{formatCurrency(stream.monthlyRevenueUsd)}</strong></div>
                <div className="stat-card"><span>Treasury share</span><strong>{formatCurrency(stream.treasuryMonthlyUsd)}</strong></div>
                <div className="stat-card"><span>Founder share</span><strong>{formatCurrency(stream.founderMonthlyUsd)}</strong></div>
              </div>
              <div className="mt-4 grid gap-3 text-sm text-muted">
                <div className="stat-card"><span>Public covenant</span><strong>{stream.publicBenefitCovenant}</strong></div>
                <div className="stat-card"><span>Open vs paid boundary</span><strong>{stream.openDeliverableBoundary}</strong></div>
                <div className="stat-card"><span>Contributor dividend</span><strong>{formatPercent(stream.contributorDividendPercent / 100)}</strong></div>
              </div>
            </div>
          ))}
        </div>
        <div className="panel space-y-4">
          <div className="eyebrow">Backer commitments</div>
          {sponsorshipCommitments.length > 0 ? sponsorshipCommitments.map((commitment) => (
            <div key={commitment.id} className="rounded-[1.3rem] border border-border bg-background/55 p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="font-display text-xl font-semibold text-foreground">{commitment.sponsorName}</div>
                <div className="flex flex-wrap gap-2">
                  <span className="tag">{labelForFundingState(commitment.fundingState)}</span>
                  <span className="tag">{labelForRestrictionScope(commitment.restrictionScope)}</span>
                </div>
              </div>
              <p className="mt-2 text-sm leading-7 text-muted">{commitment.note}</p>
              <div className="mt-3 grid gap-3 text-sm text-muted sm:grid-cols-3">
                <div className="stat-card"><span>Amount</span><strong>{formatCurrency(commitment.amountUsd)}</strong></div>
                <div className="stat-card"><span>Status</span><strong>{commitment.status}</strong></div>
                <div className="stat-card"><span>Target</span><strong>{commitment.restrictionTargetLabel ?? "Shared treasury"}</strong></div>
              </div>
              <div className="mt-3 text-xs uppercase tracking-[0.22em] text-muted">
                Updated {formatDateTime(commitment.updatedAt)}
              </div>
            </div>
          )) : (
            <p className="text-sm text-muted">No sponsor commitments have been recorded yet.</p>
          )}
        </div>
      </section>

      <section className="section-grid" data-columns="2">
        <div className="panel space-y-4">
          <div className="eyebrow">Treasury ledger</div>
          {treasuryEntries.map((entry) => (
            <div key={entry.id} className="rounded-[1.3rem] border border-border bg-background/55 p-4 text-sm text-muted">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="font-semibold text-foreground">{entry.title}</div>
                <div className="flex flex-wrap gap-2">
                  <span className="tag">{entry.direction}</span>
                  <span className="tag">{labelForFundingState(entry.fundingState)}</span>
                </div>
              </div>
              <p className="mt-2 leading-7">{entry.description}</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <div className="stat-card"><span>Bucket</span><strong>{entry.bucket}</strong></div>
                <div className="stat-card"><span>Restriction</span><strong>{entry.restrictionMode === "restricted" ? entry.restrictionTargetLabel ?? labelForRestrictionScope(entry.restrictionScope) : "Unrestricted"}</strong></div>
                <div className="stat-card"><span>Amount</span><strong>{formatCurrency(entry.amountUsd)}</strong></div>
              </div>
              <div className="mt-3 text-xs uppercase tracking-[0.22em] text-muted">{formatDateTime(entry.createdAt)}</div>
            </div>
          ))}
        </div>
        <div className="panel space-y-4">
          <div className="eyebrow">Backed Kens</div>
          <div className="grid gap-4">
            {fundedTasks.map((task) => (
              <div key={task.id} className="rounded-[1.3rem] border border-border bg-background/55 p-5 text-sm text-muted">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-display text-xl font-semibold text-foreground">{task.title}</div>
                  <span className="tag">{formatCurrency(task.sponsorPoolUsd)}</span>
                </div>
                <p className="mt-2 leading-7">{task.sponsorAppeal}</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div className="stat-card"><span>Sandbox backing</span><strong>{formatCurrency(task.sandboxCapitalUsd)}</strong></div>
                  <div className="stat-card"><span>Pilot users</span><strong>{formatNumber(task.sandboxPilotUsers)}</strong></div>
                  <div className="stat-card"><span>Checkpoint target</span><strong>{task.checkpointApprovalTarget} approvals</strong></div>
                  <div className="stat-card"><span>Model stack</span><strong>{task.modelLineup.slice(0, 2).join(" + ") || "TBD"}</strong></div>
                </div>
                <div className="mt-3 rounded-[1rem] border border-border bg-panel/72 p-4">
                  <div className="eyebrow">Sample result</div>
                  <p className="mt-2 leading-7">{task.sampleOutcome}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
