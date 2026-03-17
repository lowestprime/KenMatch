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
        <h1 className="font-display text-4xl font-semibold text-ink">Submit a task for safety review, public curation, and treasury-backed ranking</h1>
        <p className="max-w-4xl text-lg leading-8 text-ink/72">
          The upgraded intake flow now captures the missing conception primitives directly: explicit problem framing, evaluation criteria, a visible proposal bond, and room for later commercial packaging without compromising the public allocation layer.
        </p>
      </section>
      <ProposalForm categories={categories} />
    </div>
  );
}
