"use client";

import { useActionState } from "react";

import { createProposalAction, initialActionState } from "@/app/actions";

interface ProposalFormProps {
  categories: Array<{ slug: string; name: string }>;
}

export function ProposalForm({ categories }: ProposalFormProps) {
  const [state, formAction, isPending] = useActionState(createProposalAction, initialActionState);
  const errorFor = (field: string) => state.fieldErrors?.[field];

  return (
    <form action={formAction} className="panel grid gap-5">
      <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <label className="space-y-2 text-xs uppercase tracking-[0.22em] text-ink/55">
          Proposal title
          <input
            name="title"
            placeholder="Specific, outcome-oriented title"
            className="w-full rounded-[1.2rem] border border-ink/10 bg-white px-4 py-3 text-sm normal-case tracking-normal text-ink outline-none transition focus:border-teal"
          />
          {errorFor("title") ? <span className="text-red-700">{errorFor("title")}</span> : null}
        </label>
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="space-y-2 text-xs uppercase tracking-[0.22em] text-ink/55">
            Category
            <select name="categorySlug" className="w-full rounded-[1.2rem] border border-ink/10 bg-white px-4 py-3 text-sm normal-case tracking-normal text-ink outline-none transition focus:border-teal">
              {categories.map((category) => (
                <option key={category.slug} value={category.slug}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2 text-xs uppercase tracking-[0.22em] text-ink/55">
            Requested tier
            <select name="requestedTier" className="w-full rounded-[1.2rem] border border-ink/10 bg-white px-4 py-3 text-sm normal-case tracking-normal text-ink outline-none transition focus:border-teal">
              <option value="days">Days</option>
              <option value="weeks">Weeks</option>
              <option value="months">Months</option>
            </select>
          </label>
        </div>
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <Field name="summary" label="Summary" rows={4} placeholder="What will the run actually produce?" error={errorFor("summary")} />
        <Field name="problem" label="Problem" rows={4} placeholder="What bottleneck or unmet need justifies scarce compute?" error={errorFor("problem")} />
        <Field name="whyNow" label="Why now" rows={4} placeholder="What changed that makes this especially timely?" error={errorFor("whyNow")} />
        <Field name="publicBenefit" label="Public benefit" rows={4} placeholder="How do the outputs compound beyond the original proposer?" error={errorFor("publicBenefit")} />
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <Field name="deliverables" label="Deliverables" rows={5} placeholder="One item per line" error={errorFor("deliverables")} />
        <Field name="evaluationCriteria" label="Evaluation criteria" rows={5} placeholder="One item per line" error={errorFor("evaluationCriteria")} />
        <Field name="riskFlags" label="Risks and constraints" rows={5} placeholder="One item per line" error={errorFor("riskFlags")} />
        <Field name="evidence" label="Evidence anchors" rows={5} placeholder="One item per line" error={errorFor("evidence")} />
      </div>
      <div className="flex flex-col gap-3 border-t border-ink/8 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-2xl text-sm leading-7 text-ink/68">
          Every new proposal enters a public review queue first. It can collect comments immediately, but it does not receive
          allocation until the safety council clears it.
        </p>
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex rounded-full bg-ink px-5 py-3 text-sm font-semibold text-paper transition hover:bg-teal disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Submitting proposal" : "Submit to review"}
        </button>
      </div>
      {state.message ? <p className="text-sm text-red-700">{state.message}</p> : null}
    </form>
  );
}

interface FieldProps {
  name: string;
  label: string;
  rows: number;
  placeholder: string;
  error?: string;
}

function Field({ name, label, rows, placeholder, error }: FieldProps) {
  return (
    <label className="space-y-2 text-xs uppercase tracking-[0.22em] text-ink/55">
      {label}
      <textarea
        name={name}
        rows={rows}
        placeholder={placeholder}
        className="w-full rounded-[1.2rem] border border-ink/10 bg-white px-4 py-3 text-sm normal-case tracking-normal text-ink outline-none transition focus:border-teal"
      />
      {error ? <span className="text-red-700">{error}</span> : null}
    </label>
  );
}