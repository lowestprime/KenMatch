import Link from "next/link";

import { ProposalForm } from "@/components/proposal-form";
import { getHomeData } from "@/lib/db";
import { getViewerSession } from "@/lib/session";

export default async function SubmitPage() {
  const viewer = await getViewerSession();
  const { categories } = await getHomeData(viewer?.profile.id);

  return (
    <div className="space-y-8">
      <section className="panel space-y-4">
        <div className="eyebrow">Proposal intake</div>
<<<<<<< HEAD
        <h1 className="font-display text-4xl font-semibold text-foreground">Submit a task for public ranking, safety review, and checkpointed execution</h1>
        <p className="max-w-4xl text-lg leading-8 text-muted">
          The conception brief is explicit: structure matters. Proposals should make public benefit, deliverables, evaluation criteria, risks, packaging path, and data value legible before they ask for scarce compute.
=======
        <h1 className="font-display text-4xl font-semibold text-ink">Submit a task for safety review, public curation, and treasury-backed ranking</h1>
        <p className="max-w-4xl text-lg leading-8 text-ink/72">
          The upgraded intake flow now captures the missing conception primitives directly: explicit problem framing, evaluation criteria, a visible proposal bond, and room for later commercial packaging without compromising the public allocation layer.
>>>>>>> origin/main
        </p>
      </section>
      {viewer ? (
        <ProposalForm categories={categories} />
      ) : (
        <div className="panel space-y-4">
          <div className="font-display text-2xl font-semibold text-foreground">Sign in required</div>
          <p className="text-sm leading-7 text-muted">Submission carries a quality bond and attributable governance trail, so anonymous proposal posting is intentionally disabled.</p>
          <Link href="/auth" className="cta-primary inline-flex">Sign in or create account</Link>
        </div>
      )}
    </div>
  );
}
