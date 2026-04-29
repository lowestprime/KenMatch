"use client";

import { useActionState, useState } from "react";

import { initialActionState } from "@/app/action-state";
import { createSponsorshipCommitmentAction } from "@/app/actions";
import { AbuseGuardFields } from "@/components/abuse-guard-fields";

export function SponsorForm({
  categories,
  kens,
  liveCheckoutEnabled,
}: {
  categories: Array<{ id: string; name: string }>;
  kens: Array<{ id: string; title: string }>;
  liveCheckoutEnabled: boolean;
}) {
  const [state, formAction, isPending] = useActionState(createSponsorshipCommitmentAction, initialActionState);
  const [restrictionScope, setRestrictionScope] = useState<"general" | "category" | "ken" | "safety-reserve">("general");
  const [mode, setMode] = useState<"pledged" | "simulated" | "live">(liveCheckoutEnabled ? "live" : "pledged");
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  return (
    <form action={formAction} className="panel space-y-5">
      <div className="section-heading">
        <div>
          <div className="eyebrow">Back a Ken</div>
          <h2 className="font-display text-3xl font-semibold text-foreground">Fund useful work without buying rank</h2>
        </div>
        <span className="tag">{liveCheckoutEnabled ? "Live checkout ready" : "Pledge + simulation mode"}</span>
      </div>
      <p className="text-sm leading-7 text-muted">
        Backing can reserve funding for one Ken, a category, or the safety reserve. It never changes public ranking, release gates, or allocation voice.
      </p>

      <div className="grid gap-4 lg:grid-cols-2">
        <Field label="Sponsor name" name="sponsorName" error={state.fieldErrors?.sponsorName} />
        <label className="space-y-2 text-xs uppercase tracking-[0.22em] text-muted">
          Sponsor type
          <select className="field" name="sponsorType" defaultValue="nonprofit">
            <option value="individual">Individual</option>
            <option value="nonprofit">Nonprofit</option>
            <option value="public-agency">Public agency</option>
            <option value="company">Company</option>
            <option value="foundation">Foundation</option>
          </select>
        </label>
        <Field label="Contact email" name="sponsorContact" type="email" error={state.fieldErrors?.sponsorContact} />
        <Field label="Amount (USD)" name="amountUsd" type="number" min={25} step={25} error={state.fieldErrors?.amountUsd} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
        <label className="space-y-2 text-xs uppercase tracking-[0.22em] text-muted">
          Restriction scope
          <select
            className="field"
            name="restrictionScope"
            value={restrictionScope}
            onChange={(event) => setRestrictionScope(event.target.value as typeof restrictionScope)}
          >
            <option value="general">Shared compute treasury</option>
            <option value="category">Specific category</option>
            <option value="ken">Specific Ken</option>
            <option value="safety-reserve">Safety and audit reserve</option>
          </select>
        </label>
        {restrictionScope === "category" ? (
          <label className="space-y-2 text-xs uppercase tracking-[0.22em] text-muted">
            Category
            <select className="field" name="restrictionTargetId" defaultValue={categories[0]?.id}>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </label>
        ) : restrictionScope === "ken" ? (
          <label className="space-y-2 text-xs uppercase tracking-[0.22em] text-muted">
            Ken
            <select className="field" name="restrictionTargetId" defaultValue={kens[0]?.id}>
              {kens.map((ken) => (
                <option key={ken.id} value={ken.id}>{ken.title}</option>
              ))}
            </select>
          </label>
        ) : (
          <div className="rounded-[1.2rem] border border-border bg-background/55 p-4 text-sm leading-7 text-muted">
            {restrictionScope === "general"
              ? "General funding increases the shared compute treasury and can support any safety-cleared Ken."
              : "Safety reserve funding is ring-fenced for attestation, moderation, external review, and incident response."}
          </div>
        )}
      </div>

      <label className="space-y-2 text-xs uppercase tracking-[0.22em] text-muted">
        Public note
        <textarea
          className="field"
          name="note"
          rows={4}
          placeholder="Explain what this funding is meant to support and any public-use boundary it should respect."
        />
      </label>

      <div className="rounded-[1.3rem] border border-border bg-background/55 p-4">
        <div className="text-xs uppercase tracking-[0.22em] text-muted">Funding mode</div>
        <div className="mt-3 flex flex-wrap gap-2">
          <ModeButton label="Pledge only" value="pledged" active={mode === "pledged"} onClick={setMode} />
          <ModeButton label="Sandbox backing" value="simulated" active={mode === "simulated"} onClick={setMode} />
          {liveCheckoutEnabled ? <ModeButton label="Pay live" value="live" active={mode === "live"} onClick={setMode} /> : null}
        </div>
        <input type="hidden" name="mode" value={mode} />
        <p className="mt-3 text-sm leading-7 text-muted">
          {mode === "live"
            ? "Live checkout sends you to Stripe and only becomes committed after the webhook confirms payment."
            : mode === "simulated"
              ? "Sandbox backing creates a visibly marked demo ledger entry so the hosted board can demonstrate the full funding flow honestly."
              : "Pledges stay visible as projected support until they are paid."}
        </p>
      </div>

      <AbuseGuardFields action="sponsor-ken" siteKey={turnstileSiteKey} />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-2xl text-sm leading-7 text-muted">
          Restricted funds remain attributable. General funds help keep compute, safety review, and public operations running.
        </p>
        <button type="submit" className="cta-primary" disabled={isPending}>
          {isPending ? "Processing" : mode === "live" ? "Continue to checkout" : "Record backing"}
        </button>
      </div>

      {state.message ? <p className={`text-sm ${state.status === "error" ? "text-red-500" : "text-teal"}`}>{state.message}</p> : null}
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  min,
  step,
  error,
}: {
  label: string;
  name: string;
  type?: string;
  min?: number;
  step?: number;
  error?: string;
}) {
  return (
    <label className="space-y-2 text-xs uppercase tracking-[0.22em] text-muted">
      {label}
      <input className="field" name={name} type={type} min={min} step={step} />
      {error ? <span className="text-red-500">{error}</span> : null}
    </label>
  );
}

function ModeButton({
  label,
  value,
  active,
  onClick,
}: {
  label: string;
  value: "pledged" | "simulated" | "live";
  active: boolean;
  onClick: (value: "pledged" | "simulated" | "live") => void;
}) {
  return (
    <button type="button" className={`vote-chip ${active ? "is-active" : ""}`} onClick={() => onClick(value)}>
      {label}
    </button>
  );
}
