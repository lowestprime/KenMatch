"use client";

import { useActionState, useState } from "react";

import { initialActionState } from "@/app/action-state";
import { verifyProfileDecisionAction } from "@/app/actions";
import { Avatar } from "@/components/avatar";
import type { ProfileRecord } from "@/lib/types";

export function AdminVerifications({ items }: { items: ProfileRecord[] }) {
  const [state, formAction, pending] = useActionState(verifyProfileDecisionAction, initialActionState);
  const [active, setActive] = useState<string | null>(null);
  if (items.length === 0) {
    return <p style={{ color: "var(--muted)" }}>No pending verification requests.</p>;
  }
  return (
    <div className="grid gap-3">
      {state.message ? (
        <p className={`alert ${state.status === "error" ? "alert-error" : "alert-success"}`}>{state.message}</p>
      ) : null}
      {items.map((profile) => (
        <article key={profile.id} className="audit-card grid gap-3">
          <div className="flex items-center gap-3">
            <Avatar profile={{ name: profile.name, hue: profile.avatarHue, avatarImage: profile.avatarImage, avatarGradient: profile.avatarGradient }} size={54} />
            <div>
              <strong>{profile.name}</strong>
              <p style={{ color: "var(--muted)", fontSize: "0.85rem" }}>
                {profile.role} · {profile.specialty}
              </p>
            </div>
          </div>
          {profile.verificationNote ? (
            <p className="alert" style={{ background: "transparent" }}>
              <strong>Note:</strong> {profile.verificationNote}
            </p>
          ) : null}
          <form
            action={formAction}
            className="grid gap-2"
            onSubmit={() => setActive(profile.id)}
          >
            <input type="hidden" name="profileId" value={profile.id} />
            <label className="field-label">
              <span>Decision note (optional)</span>
              <textarea className="field" name="note" rows={2} />
            </label>
            <div className="hero-actions">
              <button
                type="submit"
                name="decision"
                value="approved"
                className="cta-primary cta-compact"
                disabled={pending && active === profile.id}
              >
                Approve
              </button>
              <button
                type="submit"
                name="decision"
                value="rejected"
                className="cta-secondary cta-compact"
                disabled={pending && active === profile.id}
              >
                Reject
              </button>
              <button
                type="submit"
                name="decision"
                value="pending"
                className="cta-secondary cta-compact"
                disabled={pending && active === profile.id}
              >
                Keep pending
              </button>
            </div>
          </form>
        </article>
      ))}
    </div>
  );
}
