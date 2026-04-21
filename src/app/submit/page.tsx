import type { Metadata } from "next";
import Link from "next/link";

import { CategoryProposalForm } from "@/components/category-proposal-form";
import { ProposalForm } from "@/components/proposal-form";
import { getHomeData } from "@/lib/db";
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
          Strong Kens make the public benefit, the evidence base, the risks, the delivery path, and the audit trail clear before they ask for scarce compute.
        </p>
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
