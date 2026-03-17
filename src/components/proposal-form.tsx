"use client";

import { useActionState } from "react";

import { initialActionState } from "@/app/action-state";
import { createProposalAction } from "@/app/actions";

export function ProposalForm({ categories, disabled }: { categories: Array<{ slug: string; name: string }>; disabled?: boolean }) {
  const [state, formAction, isPending] = useActionState(createProposalAction, initialActionState);
  const errorFor = (field: string) => state.fieldErrors?.[field];

  return (
    <form action={formAction} className="panel grid gap-5">
      <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
<<<<<<< HEAD
        <Field name="title" label="Proposal title" rows={1} placeholder="Specific, outcome-oriented title" error={errorFor("title")} disabled={disabled || isPending} />
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="space-y-2 text-xs uppercase tracking-[0.22em] text-muted">
            Category
            <select name="categorySlug" className="field" disabled={disabled || isPending}>
=======
        <label className="space-y-2 text-xs uppercase tracking-[0.22em] text-ink/55">
          Proposal title
          <input
            name="title"
            placeholder="Specific, outcome-oriented title"
            className="w-full rounded-[1.2rem] border border-line bg-page/75 px-4 py-3 text-sm normal-case tracking-normal text-ink outline-none transition focus:border-accent"
          />
          {errorFor("title") ? <span className="text-red-700">{errorFor("title")}</span> : null}
        </label>
        <div className="grid gap-5 sm:grid-cols-3">
          <label className="space-y-2 text-xs uppercase tracking-[0.22em] text-ink/55 sm:col-span-1">
            Category
            <select name="categorySlug" className="w-full rounded-[1.2rem] border border-line bg-page/75 px-4 py-3 text-sm normal-case tracking-normal text-ink outline-none transition focus:border-accent">
>>>>>>> origin/main
              {categories.map((category) => (
                <option key={category.slug} value={category.slug}>{category.name}</option>
              ))}
            </select>
          </label>
<<<<<<< HEAD
          <label className="space-y-2 text-xs uppercase tracking-[0.22em] text-muted">
            Requested tier
            <select name="requestedTier" className="field" disabled={disabled || isPending}>
=======
          <label className="space-y-2 text-xs uppercase tracking-[0.22em] text-ink/55 sm:col-span-1">
            Requested tier
            <select name="requestedTier" className="w-full rounded-[1.2rem] border border-line bg-page/75 px-4 py-3 text-sm normal-case tracking-normal text-ink outline-none transition focus:border-accent">
>>>>>>> origin/main
              <option value="days">Days</option>
              <option value="weeks">Weeks</option>
              <option value="months">Months</option>
            </select>
          </label>
          <label className="space-y-2 text-xs uppercase tracking-[0.22em] text-ink/55 sm:col-span-1">
            Quality bond
            <select name="qualityBondCredits" defaultValue="2" className="w-full rounded-[1.2rem] border border-line bg-page/75 px-4 py-3 text-sm normal-case tracking-normal text-ink outline-none transition focus:border-accent">
              <option value="1">1 credit</option>
              <option value="2">2 credits</option>
              <option value="3">3 credits</option>
              <option value="4">4 credits</option>
              <option value="5">5 credits</option>
              <option value="6">6 credits</option>
            </select>
            {errorFor("qualityBondCredits") ? <span className="text-red-700">{errorFor("qualityBondCredits")}</span> : null}
          </label>
        </div>
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <Field name="summary" label="Summary" rows={4} placeholder="What will the run actually produce?" error={errorFor("summary")} disabled={disabled || isPending} />
        <Field name="problem" label="Problem" rows={4} placeholder="What bottleneck or unmet need justifies scarce compute?" error={errorFor("problem")} disabled={disabled || isPending} />
        <Field name="whyNow" label="Why now" rows={4} placeholder="What changed that makes this especially timely?" error={errorFor("whyNow")} disabled={disabled || isPending} />
        <Field name="publicBenefit" label="Public benefit" rows={4} placeholder="How do the outputs compound beyond the original proposer?" error={errorFor("publicBenefit")} disabled={disabled || isPending} />
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <Field name="deliverables" label="Deliverables" rows={5} placeholder="One item per line" error={errorFor("deliverables")} disabled={disabled || isPending} />
        <Field name="evaluationCriteria" label="Evaluation criteria" rows={5} placeholder="One item per line" error={errorFor("evaluationCriteria")} disabled={disabled || isPending} />
        <Field name="riskFlags" label="Risks and constraints" rows={5} placeholder="One item per line" error={errorFor("riskFlags")} disabled={disabled || isPending} />
        <Field name="evidence" label="Evidence anchors" rows={5} placeholder="One item per line" error={errorFor("evidence")} disabled={disabled || isPending} />
      </div>
<<<<<<< HEAD
      <div className="grid gap-5 lg:grid-cols-2">
        <Field name="enterprisePackaging" label="Institutional packaging" rows={4} placeholder="How could the open output become a managed institutional product or workflow?" error={errorFor("enterprisePackaging")} disabled={disabled || isPending} />
        <Field name="dataValueNote" label="Preference and data value" rows={4} placeholder="What feedback, provenance, or correction data would this task generate?" error={errorFor("dataValueNote")} disabled={disabled || isPending} />
      </div>
      <div className="flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-2xl text-sm leading-7 text-muted">
          New proposals start in public review with a locked quality bond. They can collect pulse, comments, and voice immediately, but execution remains checkpoint-gated.
        </p>
        <button type="submit" disabled={disabled || isPending} className="cta-primary">
=======
      <div className="grid gap-4 rounded-[1.4rem] border border-line bg-page/72 p-5 sm:grid-cols-3">
        <div>
          <div className="text-xs uppercase tracking-[0.22em] text-ink/45">What the bond does</div>
          <p className="mt-2 text-sm leading-7 text-ink/68">Proposal bonds are non-purchasable voice credits placed behind the submission as a quality signal.</p>
        </div>
        <div>
          <div className="text-xs uppercase tracking-[0.22em] text-ink/45">What comments do</div>
          <p className="mt-2 text-sm leading-7 text-ink/68">Comments and public up/down votes refine quality before the allocation chamber commits expensive compute.</p>
        </div>
        <div>
          <div className="text-xs uppercase tracking-[0.22em] text-ink/45">What safety does</div>
          <p className="mt-2 text-sm leading-7 text-ink/68">Every new proposal enters public review immediately but remains compute-ineligible until the safety council clears it.</p>
        </div>
      </div>
      <div className="flex flex-col gap-3 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-2xl text-sm leading-7 text-ink/68">
          The strongest submissions make their commercialization story legible without collapsing into pay-to-play. KenMatch keeps the public curation layer merit-based while letting enterprise packaging fund the treasury separately.
        </p>
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex rounded-full bg-ink px-5 py-3 text-sm font-semibold text-page transition hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
        >
>>>>>>> origin/main
          {isPending ? "Submitting proposal" : "Submit to review"}
        </button>
      </div>
      {state.message ? <p className={`text-sm ${state.status === "error" ? "text-red-500" : "text-teal"}`}>{state.message}</p> : null}
    </form>
  );
}

function Field({ name, label, rows, placeholder, error, disabled }: { name: string; label: string; rows: number; placeholder: string; error?: string; disabled?: boolean }) {
  const control = rows === 1 ? <input name={name} placeholder={placeholder} className="field" disabled={disabled} /> : <textarea name={name} rows={rows} placeholder={placeholder} className="field" disabled={disabled} />;
  return (
    <label className="space-y-2 text-xs uppercase tracking-[0.22em] text-muted">
      {label}
<<<<<<< HEAD
      {control}
      {error ? <span className="text-red-500">{error}</span> : null}
    </label>
  );
}

=======
      <textarea
        name={name}
        rows={rows}
        placeholder={placeholder}
        className="w-full rounded-[1.2rem] border border-line bg-page/75 px-4 py-3 text-sm normal-case tracking-normal text-ink outline-none transition focus:border-accent"
      />
      {error ? <span className="text-red-700">{error}</span> : null}
    </label>
  );
}
>>>>>>> origin/main
