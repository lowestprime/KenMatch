"use client";

import { useActionState, useState } from "react";

import { initialActionState } from "@/app/action-state";
import { createProposalAction } from "@/app/actions";
import { AbuseGuardFields } from "@/components/abuse-guard-fields";

const tierDetails = {
  days: "Fast, focused Kens for narrow deliverables.",
  weeks: "Multi-stage Kens that need continuity and review.",
  months: "Deep Kens with repeated checkpoints and stronger release controls.",
} as const;

export function ProposalForm({ categories, disabled }: { categories: Array<{ slug: string; name: string }>; disabled?: boolean }) {
  const [state, formAction, isPending] = useActionState(createProposalAction, initialActionState);
  const [requestedTier, setRequestedTier] = useState<keyof typeof tierDetails>("weeks");
  const errorFor = (field: string) => state.fieldErrors?.[field];
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  return (
    <form action={formAction} className="panel grid gap-5">
      <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <Field name="title" label="Ken title" rows={1} placeholder="Specific, outcome-oriented title" error={errorFor("title")} disabled={disabled || isPending} />
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="space-y-2 text-xs uppercase tracking-[0.22em] text-muted">
            Category
            <select name="categorySlug" className="field" disabled={disabled || isPending}>
              {categories.map((category) => (
                <option key={category.slug} value={category.slug}>{category.name}</option>
              ))}
            </select>
          </label>
          <label className="space-y-2 text-xs uppercase tracking-[0.22em] text-muted">
            Requested lane
            <select name="requestedTier" className="field" value={requestedTier} onChange={(event) => setRequestedTier(event.target.value as keyof typeof tierDetails)} disabled={disabled || isPending}>
              <option value="days">Days</option>
              <option value="weeks">Weeks</option>
              <option value="months">Months</option>
            </select>
          </label>
          <div className="rounded-[1.2rem] border border-border bg-background/55 p-4 text-sm leading-6 text-muted sm:col-span-2">
            <div className="font-semibold text-foreground">Tier-based bond and checkpoint policy</div>
            <p className="mt-2">{tierDetails[requestedTier]}</p>
            <p className="mt-2">KenMatch calculates the bond automatically from the lane you choose, so the bond shown during review always matches the real allocation rules.</p>
          </div>
        </div>
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <Field name="summary" label="Summary" rows={4} placeholder="What will the Ken actually produce?" error={errorFor("summary")} disabled={disabled || isPending} />
        <Field name="problem" label="Problem" rows={4} placeholder="What friction or unmet need justifies scarce compute?" error={errorFor("problem")} disabled={disabled || isPending} />
        <Field name="whyNow" label="Why now" rows={4} placeholder="What changed that makes this especially timely?" error={errorFor("whyNow")} disabled={disabled || isPending} />
        <Field name="publicBenefit" label="Public benefit" rows={4} placeholder="How should the work help people beyond the original proposer?" error={errorFor("publicBenefit")} disabled={disabled || isPending} />
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <Field name="deliverables" label="Deliverables" rows={5} placeholder="One item per line" error={errorFor("deliverables")} disabled={disabled || isPending} />
        <Field name="evaluationCriteria" label="Evaluation checks" rows={5} placeholder="One item per line" error={errorFor("evaluationCriteria")} disabled={disabled || isPending} />
        <Field name="riskFlags" label="Risks and constraints" rows={5} placeholder="One item per line" error={errorFor("riskFlags")} disabled={disabled || isPending} />
        <Field name="evidence" label="Evidence anchors" rows={5} placeholder="One item per line" error={errorFor("evidence")} disabled={disabled || isPending} />
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <Field name="enterprisePackaging" label="Optional service path" rows={4} placeholder="If this Ken succeeds, what hosted or institutional version could help fund the public board?" error={errorFor("enterprisePackaging")} disabled={disabled || isPending} />
        <Field name="dataValueNote" label="Corrections and audit data" rows={4} placeholder="What useful correction, provenance, or evaluation data would the Ken generate along the way?" error={errorFor("dataValueNote")} disabled={disabled || isPending} />
      </div>
      <AbuseGuardFields action="submit-ken" siteKey={turnstileSiteKey} />
      <div className="flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-2xl text-sm leading-7 text-muted">
          New Kens start in public review with a locked bond, visible timestamps, public comments, and checkpoint-gated execution. Launch happens only after review and release conditions are in place.
        </p>
        <button type="submit" disabled={disabled || isPending} className="cta-primary">
          {isPending ? "Submitting Ken" : "Submit Ken for review"}
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
      {control}
      {error ? <span className="text-red-500">{error}</span> : null}
    </label>
  );
}
