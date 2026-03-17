import { ProposalForm } from "@/components/proposal-form";
import { getHomeData } from "@/lib/db";
import { getSessionProfileId } from "@/lib/session";

export default async function SubmitPage() {
  const activeProfileId = await getSessionProfileId();
  const { categories } = getHomeData(activeProfileId);

  return (
    <div className="space-y-8">
      <section className="panel space-y-4">
        <div className="eyebrow">Proposal intake</div>
        <h1 className="font-display text-4xl font-semibold text-ink">Submit a task for safety review and public ranking</h1>
        <p className="max-w-4xl text-lg leading-8 text-ink/72">
          The conception docs emphasize structure over vibes. This form makes that concrete: explicit problem framing,
          deliverables, evaluation criteria, risks, and evidence anchors before a proposal can ask for scarce compute.
        </p>
      </section>
      <ProposalForm categories={categories} />
    </div>
  );
}