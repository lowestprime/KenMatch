import type { Metadata } from "next";
import Link from "next/link";

import { CategoryProposalForm } from "@/components/category-proposal-form";
import { ProposalForm } from "@/components/proposal-form";
import { KEN_LIFECYCLE_STAGES, SUBMISSION_APPROVAL_CRITERIA, TOKEN_ASSIGNMENT_RULES } from "@/lib/allocation-policy";
import { getHomeData } from "@/lib/db";
import { KEN_DEFINITION } from "@/lib/faq";
import { getViewerSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "Propose a Ken",
  description: "Submit a new Ken for public review, voting, and checkpointed launch on KenMatch.",
};

export default async function SubmitPage() {
  const viewer = await getViewerSession();
  const { categories } = await getHomeData(viewer?.profile.id);

  return (
    <div className="page-stack">
      <section className="panel space-y-4">
        <div className="eyebrow">Ken intake</div>
        <h1 className="font-display text-4xl font-semibold text-foreground">Submit a Ken for review, public ranking, and checkpointed launch</h1>
        <p className="max-w-4xl text-lg leading-8 text-muted">
          {KEN_DEFINITION} Strong submissions make the public benefit, evidence base, risks, delivery path, incentive alignment, and audit trail clear before they ask for scarce compute.
        </p>
      </section>

      <section className="section-grid" data-columns="3">
        <div className="panel space-y-3">
          <div className="eyebrow">Approval gate</div>
          <h2 className="font-display text-2xl font-semibold text-foreground">What reviewers check</h2>
          <ol className="criteria-list">
            {SUBMISSION_APPROVAL_CRITERIA.slice(0, 4).map((criterion) => <li key={criterion}>{criterion}</li>)}
          </ol>
        </div>
        <div className="panel space-y-3">
          <div className="eyebrow">Run stages</div>
          <h2 className="font-display text-2xl font-semibold text-foreground">How work proceeds</h2>
          <div className="policy-list compact-policy-list">
            {KEN_LIFECYCLE_STAGES.slice(0, 5).map((stage) => (
              <div key={stage.id} className="policy-row interactive-surface"><strong>{stage.label}</strong><p>{stage.summary}</p></div>
            ))}
          </div>
        </div>
        <div className="panel space-y-3">
          <div className="eyebrow">Credit incentives</div>
          <h2 className="font-display text-2xl font-semibold text-foreground">How useful work earns voice</h2>
          <div className="policy-list compact-policy-list">
            {TOKEN_ASSIGNMENT_RULES.slice(2).map((rule) => (
              <div key={rule.id} className="policy-row interactive-surface"><strong>{rule.label}</strong><p>{rule.criteria}</p></div>
            ))}
          </div>
        </div>
      </section>

      {viewer ? (
        <>
          <ProposalForm categories={categories} />
          <CategoryProposalForm />
        </>
      ) : (
        <div className="panel space-y-4">
          <div className="font-display text-2xl font-semibold text-foreground">Sign in required</div>
          <p className="text-sm leading-7 text-muted">Submitting a Ken creates a public review record and a bond-backed accountability trail, so anonymous intake is intentionally disabled.</p>
          <Link href="/auth" className="cta-primary inline-flex">Sign in or create account</Link>
        </div>
      )}
    </div>
  );
}
