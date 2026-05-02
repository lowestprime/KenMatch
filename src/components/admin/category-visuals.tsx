"use client";

import { useActionState, type CSSProperties } from "react";

import { initialActionState } from "@/app/action-state";
import { updateCategoryVisualAction } from "@/app/admin/category-visual-actions";
import type { CategoryVisualSetting } from "@/lib/category-visual-settings";

const motifs = ["helix", "tool", "graph", "system", "shield", "spark", "prism"];

export function AdminCategoryVisuals({ items }: { items: CategoryVisualSetting[] }) {
  return (
    <div className="category-visual-admin-grid">
      {items.map((item) => (
        <CategoryVisualForm key={item.categoryId} item={item} />
      ))}
    </div>
  );
}

function CategoryVisualForm({ item }: { item: CategoryVisualSetting }) {
  const [state, action, pending] = useActionState(updateCategoryVisualAction, initialActionState);
  return (
    <form action={action} className="category-visual-form">
      <input type="hidden" name="categoryId" value={item.categoryId} />
      <div className="category-visual-preview">
        <span
          className="category-visual-chip"
          style={{
            "--preview-primary": item.primaryColor,
            "--preview-secondary": item.secondaryColor,
            "--preview-background": item.backgroundColor,
          } as CSSProperties}
          aria-hidden="true"
        />
        <div>
          <div className="eyebrow">{item.slug}</div>
          <h3>{item.name}</h3>
          <p className="text-sm text-muted">Current symbol key: {item.currentSymbolKey || "default"}</p>
        </div>
      </div>
      <label className="field-label">
        <span>Symbol key</span>
        <input className="field" name="symbolKey" defaultValue={item.symbolKey} maxLength={80} required />
      </label>
      <label className="field-label">
        <span>Motif</span>
        <select className="field" name="motif" defaultValue={item.motif}>
          {motifs.map((motif) => <option key={motif} value={motif}>{motif}</option>)}
        </select>
      </label>
      <div className="category-visual-colors">
        <label className="field-label"><span>Primary</span><input name="primaryColor" type="color" defaultValue={item.primaryColor} /></label>
        <label className="field-label"><span>Secondary</span><input name="secondaryColor" type="color" defaultValue={item.secondaryColor} /></label>
        <label className="field-label"><span>Accent</span><input name="tertiaryColor" type="color" defaultValue={item.tertiaryColor} /></label>
        <label className="field-label"><span>Background</span><input name="backgroundColor" type="color" defaultValue={item.backgroundColor} /></label>
      </div>
      <label className="field-label">
        <span>Custom SVG override notes</span>
        <textarea className="field" name="customSvg" rows={3} defaultValue={item.customSvg} placeholder="Optional SVG source or future asset notes. Stored for admin handoff; deterministic motif remains the public fallback." />
      </label>
      <label className="field-label">
        <span>Admin note</span>
        <textarea className="field" name="note" rows={2} defaultValue={item.note} placeholder="Why this symbol/color set fits the category." />
      </label>
      <button className="cta-secondary cta-compact" type="submit" disabled={pending}>{pending ? "Saving…" : "Save visual"}</button>
      {state.message ? <p className={`alert ${state.status === "error" ? "alert-error" : "alert-success"}`}>{state.message}</p> : null}
    </form>
  );
}
