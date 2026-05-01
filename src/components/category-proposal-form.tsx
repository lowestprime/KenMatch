"use client";

import { useActionState } from "react";

import { initialActionState } from "@/app/action-state";
import { createCategoryProposalAction } from "@/app/actions";
import { AbuseGuardFields } from "@/components/abuse-guard-fields";

export function CategoryProposalForm({ disabled }: { disabled?: boolean }) {
  const [state, formAction, pending] = useActionState(createCategoryProposalAction, initialActionState);
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const errorFor = (field: string) => state.fieldErrors?.[field];

  return (
    <form action={formAction} className="panel category-proposal-panel">
      <div className="grid gap-2">
        <span className="eyebrow">Propose a new category</span>
        <h2>When an idea does not fit the existing categories</h2>
        <p className="text-sm leading-7 text-muted">
          New categories should make the board easier to understand, not fragment it. Strong proposals describe a repeatable class of Kens, clear public or community value, realistic evaluation criteria, and examples that could attract serious discussion or backing. Admin review assigns the public category symbol before approval.
        </p>
      </div>
      <div className="category-guidelines">
        {[
          "Broad enough to contain many future Kens, not a single personal idea.",
          "Safe, auditable, and compatible with public checkpoints.",
          "Useful to an identifiable public, community, creative, research, civic, or technical audience.",
          "Clear about what admins should reject, merge into an existing category, or hold for more review.",
        ].map((item) => (
          <div key={item} className="guideline-item">{item}</div>
        ))}
      </div>
      <div className="form-grid form-grid-two">
        <Field name="name" label="Category name" placeholder="Example: Mechanistic Climate Risk Models" error={errorFor("name")} disabled={disabled || pending} />
        <Field name="exampleKens" label="Example Kens" as="textarea" placeholder="One example Ken per line" error={errorFor("exampleKens")} disabled={disabled || pending} />
      </div>
      <Field name="description" label="What belongs here?" as="textarea" placeholder="Define the boundary clearly enough for voters and admins." error={errorFor("description")} disabled={disabled || pending} />
      <Field name="publicBenefit" label="Why should KenMatch add it?" as="textarea" placeholder="Explain the public, community, cultural, scientific, technical, or practical value." error={errorFor("publicBenefit")} disabled={disabled || pending} />
      <AbuseGuardFields action="submit-category-proposal" siteKey={turnstileSiteKey} />
      <div className="form-footer">
        <p className="text-xs leading-6 text-muted">Admins can approve, reject, or ask for revision. Approval adds the category with an assigned symbol; public symbol uploads are not enabled yet.</p>
        <button type="submit" className="cta-primary" disabled={disabled || pending}>
          {pending ? "Submitting" : "Propose category"}
        </button>
      </div>
      {state.message ? (
        <p className={`alert ${state.status === "error" ? "alert-error" : "alert-success"}`}>{state.message}</p>
      ) : null}
    </form>
  );
}

function Field({
  name,
  label,
  placeholder,
  error,
  disabled,
  as,
}: {
  name: string;
  label: string;
  placeholder: string;
  error?: string;
  disabled?: boolean;
  as?: "textarea";
}) {
  return (
    <label className="field-label">
      <span>{label}</span>
      {as === "textarea" ? (
        <textarea className="field" name={name} rows={4} placeholder={placeholder} disabled={disabled} />
      ) : (
        <input className="field" name={name} placeholder={placeholder} disabled={disabled} />
      )}
      {error ? <span className="text-xs text-red-500">{error}</span> : null}
    </label>
  );
}
