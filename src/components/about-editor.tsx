"use client";

import { useActionState } from "react";

import { initialActionState } from "@/app/action-state";
import { updateAboutPageAction } from "@/app/actions";
import type { AboutPageContent } from "@/lib/types";

export function AboutEditor({ initial }: { initial: AboutPageContent }) {
  const [state, formAction, pending] = useActionState(updateAboutPageAction, initialActionState);
  const linksValue = initial.links.map((link) => `${link.label} | ${link.url}`).join("\n");
  return (
    <form action={formAction} className="form-grid">
      <div className="form-grid form-grid-two">
        <Field label="Hero eyebrow" name="heroEyebrow" defaultValue={initial.heroEyebrow} />
        <Field label="Contact email" name="contactEmail" defaultValue={initial.contactEmail} />
      </div>
      <Field label="Hero title" name="heroTitle" defaultValue={initial.heroTitle} />
      <TextArea label="Hero subtitle" name="heroSubtitle" defaultValue={initial.heroSubtitle} rows={2} />
      <div className="form-grid form-grid-two">
        <Field label="Mission title" name="missionTitle" defaultValue={initial.missionTitle} />
        <Field label="Beliefs title" name="beliefsTitle" defaultValue={initial.beliefsTitle} />
      </div>
      <TextArea label="Mission body" name="missionBody" defaultValue={initial.missionBody} rows={6} />
      <TextArea
        label="Beliefs bullets (one per line)"
        name="beliefsBullets"
        defaultValue={initial.beliefsBullets.join("\n")}
        rows={6}
      />
      <div className="form-grid form-grid-two">
        <Field label="Background title" name="backgroundTitle" defaultValue={initial.backgroundTitle} />
        <Field label="Goals title" name="goalsTitle" defaultValue={initial.goalsTitle} />
      </div>
      <TextArea
        label="Background body"
        name="backgroundBody"
        defaultValue={initial.backgroundBody}
        rows={6}
      />
      <TextArea
        label="Goals bullets (one per line)"
        name="goalsBullets"
        defaultValue={initial.goalsBullets.join("\n")}
        rows={6}
      />
      <Field label="Contact title" name="contactTitle" defaultValue={initial.contactTitle} />
      <TextArea label="Contact body" name="contactBody" defaultValue={initial.contactBody} rows={4} />
      <TextArea
        label="Links (one per line, format: Label | URL)"
        name="links"
        defaultValue={linksValue}
        rows={5}
      />
      <div className="flex items-center justify-between gap-3">
        <button type="submit" className="cta-primary" disabled={pending}>
          {pending ? "Saving…" : "Save about page"}
        </button>
        <p className="text-xs" style={{ color: "var(--muted)" }}>
          Changes are persisted in the KenMatch database.
        </p>
      </div>
      {state.message ? (
        <p className={`alert ${state.status === "error" ? "alert-error" : "alert-success"}`}>{state.message}</p>
      ) : null}
    </form>
  );
}

function Field({ label, name, defaultValue }: { label: string; name: string; defaultValue?: string }) {
  return (
    <label className="field-label">
      <span>{label}</span>
      <input className="field" name={name} defaultValue={defaultValue} />
    </label>
  );
}

function TextArea({
  label,
  name,
  defaultValue,
  rows = 4,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  rows?: number;
}) {
  return (
    <label className="field-label">
      <span>{label}</span>
      <textarea className="field" name={name} defaultValue={defaultValue} rows={rows} />
    </label>
  );
}
