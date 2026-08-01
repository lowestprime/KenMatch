"use client";

import { useActionState, useState } from "react";

import { initialActionState } from "@/app/action-state";
import { createProposalAction } from "@/app/actions";
import { AbuseGuardFields } from "@/components/abuse-guard-fields";
import { LANE_OPERATING_POLICIES, SUBMISSION_APPROVAL_CRITERIA } from "@/lib/allocation-policy";
import {
  KEN_PROPOSAL_FIELD_CONSTRAINTS,
  nativeTextFieldProps,
  type TextFieldConstraint,
} from "@/lib/proposal-constraints";

const tierDetails = LANE_OPERATING_POLICIES;

export function ProposalForm({ categories, disabled }: { categories: Array<{ slug: string; name: string }>; disabled?: boolean }) {
  const [state, formAction, isPending] = useActionState(createProposalAction, initialActionState);
  const [requestedTier, setRequestedTier] = useState<keyof typeof tierDetails>("weeks");
  const errorFor = (field: string) => state.fieldErrors?.[field];
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const lane = tierDetails[requestedTier];
  const categoryError = errorFor("categorySlug");
  const tierError = errorFor("requestedTier");

  return (
    <form action={formAction} className="panel ken-proposal-panel grid gap-5">
      <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <Field name="title" label="Ken title" constraint={KEN_PROPOSAL_FIELD_CONSTRAINTS.title} rows={1} placeholder="Specific, outcome-oriented title" error={errorFor("title")} disabled={disabled || isPending} />
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="space-y-2 text-xs uppercase tracking-[0.22em] text-muted" htmlFor="ken-proposal-categorySlug">
            Category
            <select
              id="ken-proposal-categorySlug"
              name="categorySlug"
              className="field"
              required
              aria-invalid={categoryError ? true : undefined}
              aria-describedby={categoryError ? "ken-proposal-categorySlug-error" : undefined}
              disabled={disabled || isPending}
            >
              {categories.map((category) => (
                <option key={category.slug} value={category.slug}>{category.name}</option>
              ))}
            </select>
            {categoryError ? <span id="ken-proposal-categorySlug-error" className="text-red-500" role="alert">{categoryError}</span> : null}
          </label>
          <label className="space-y-2 text-xs uppercase tracking-[0.22em] text-muted" htmlFor="ken-proposal-requestedTier">
            Requested lane
            <select
              id="ken-proposal-requestedTier"
              name="requestedTier"
              className="field"
              value={requestedTier}
              required
              aria-invalid={tierError ? true : undefined}
              aria-describedby={tierError ? "ken-proposal-requestedTier-error" : undefined}
              onChange={(event) => setRequestedTier(event.target.value as keyof typeof tierDetails)}
              disabled={disabled || isPending}
            >
              <option value="days">Days</option>
              <option value="weeks">Weeks</option>
              <option value="months">Months</option>
            </select>
            {tierError ? <span id="ken-proposal-requestedTier-error" className="text-red-500" role="alert">{tierError}</span> : null}
          </label>
          <div className="rounded-[1.2rem] border border-border bg-background/55 p-4 text-sm leading-6 text-muted sm:col-span-2">
            <div className="font-semibold text-foreground">Lane-based bond and checkpoint policy</div>
            <p className="mt-2">{lane.bestFor}</p>
            <dl className="mt-3 grid gap-2 sm:grid-cols-3">
              <div><dt className="eyebrow">Bond</dt><dd className="font-semibold text-foreground">{lane.bondCredits} credit{lane.bondCredits === 1 ? "" : "s"}</dd></div>
              <div><dt className="eyebrow">Cadence</dt><dd className="font-semibold text-foreground">{lane.checkpointCadence}</dd></div>
              <div><dt className="eyebrow">Approval</dt><dd className="font-semibold text-foreground">{lane.approvalTarget}</dd></div>
            </dl>
          </div>
        </div>
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <Field name="summary" label="Summary" constraint={KEN_PROPOSAL_FIELD_CONSTRAINTS.summary} rows={4} placeholder="What will the Ken actually produce?" error={errorFor("summary")} disabled={disabled || isPending} />
        <Field name="problem" label="Problem" constraint={KEN_PROPOSAL_FIELD_CONSTRAINTS.problem} rows={4} placeholder="What friction or unmet need justifies scarce compute?" error={errorFor("problem")} disabled={disabled || isPending} />
        <Field name="whyNow" label="Why now" constraint={KEN_PROPOSAL_FIELD_CONSTRAINTS.whyNow} rows={4} placeholder="What changed that makes this especially timely?" error={errorFor("whyNow")} disabled={disabled || isPending} />
        <Field name="publicBenefit" label="Public benefit" constraint={KEN_PROPOSAL_FIELD_CONSTRAINTS.publicBenefit} rows={4} placeholder="How should the work help people beyond the original proposer?" error={errorFor("publicBenefit")} disabled={disabled || isPending} />
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <Field name="deliverables" label="Deliverables" constraint={KEN_PROPOSAL_FIELD_CONSTRAINTS.deliverables} rows={5} placeholder="One item per line" error={errorFor("deliverables")} disabled={disabled || isPending} />
        <Field name="evaluationCriteria" label="Evaluation checks" constraint={KEN_PROPOSAL_FIELD_CONSTRAINTS.evaluationCriteria} rows={5} placeholder="One item per line" error={errorFor("evaluationCriteria")} disabled={disabled || isPending} />
        <Field name="riskFlags" label="Risks and constraints" constraint={KEN_PROPOSAL_FIELD_CONSTRAINTS.riskFlags} rows={5} placeholder="One item per line" error={errorFor("riskFlags")} disabled={disabled || isPending} />
        <Field name="evidence" label="Evidence anchors" constraint={KEN_PROPOSAL_FIELD_CONSTRAINTS.evidence} rows={5} placeholder="One item per line" error={errorFor("evidence")} disabled={disabled || isPending} />
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <Field name="enterprisePackaging" label="Optional service path" constraint={KEN_PROPOSAL_FIELD_CONSTRAINTS.enterprisePackaging} rows={4} placeholder="If this Ken succeeds, what hosted or institutional version could help fund the public board?" error={errorFor("enterprisePackaging")} disabled={disabled || isPending} />
        <Field name="dataValueNote" label="Corrections and audit data" constraint={KEN_PROPOSAL_FIELD_CONSTRAINTS.dataValueNote} rows={4} placeholder="What useful correction, provenance, or evaluation data would the Ken generate along the way?" error={errorFor("dataValueNote")} disabled={disabled || isPending} />
      </div>
      <div className="rounded-[1.2rem] border border-border bg-background/55 p-4">
        <div className="font-semibold text-foreground">Submission approval checklist</div>
        <ul className="mt-3 grid gap-2 text-sm leading-6 text-muted sm:grid-cols-2">
          {SUBMISSION_APPROVAL_CRITERIA.map((criterion) => <li key={criterion}>✓ {criterion}</li>)}
        </ul>
      </div>
      <AbuseGuardFields action="submit-ken" siteKey={turnstileSiteKey} />
      <div className="flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-2xl text-sm leading-7 text-muted">
          New Kens enter a private, timestamped intake queue with a locked bond. They become visible for public pulse, comments, and scarce voice only after review approval; every public-facing outcome keeps a reason-coded history in your Account dashboard.
        </p>
        <button type="submit" disabled={disabled || isPending} className="cta-primary">
          {isPending ? "Submitting Ken" : "Submit Ken for review"}
        </button>
      </div>
      {state.message ? (
        <p
          className={`text-sm ${state.status === "error" ? "text-red-500" : "text-accent"}`}
          role={state.status === "error" ? "alert" : "status"}
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}

function Field({ name, label, constraint, rows, placeholder, error, disabled }: { name: string; label: string; constraint: TextFieldConstraint; rows: number; placeholder: string; error?: string; disabled?: boolean }) {
  const fieldProps = nativeTextFieldProps("ken-proposal", name, constraint, error);
  const errorId = `${fieldProps.id}-error`;
  const control = rows === 1
    ? <input {...fieldProps} placeholder={placeholder} className="field" disabled={disabled} />
    : <textarea {...fieldProps} rows={rows} placeholder={placeholder} className="field" disabled={disabled} />;
  return (
    <label className="space-y-2 text-xs uppercase tracking-[0.22em] text-muted" htmlFor={fieldProps.id}>
      {label}
      {control}
      {error ? <span id={errorId} className="text-red-500" role="alert">{error}</span> : null}
    </label>
  );
}
