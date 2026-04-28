import Link from "next/link";

import type { MaintenanceState } from "@/lib/types";

export function MaintenanceScreen({ state }: { state: MaintenanceState }) {
  return (
    <section className="panel hero-panel maintenance-screen" role="status" aria-live="polite">
      <span className="eyebrow">Maintenance mode</span>
      <h1>KenMatch is temporarily paused.</h1>
      <p style={{ color: "var(--ink-muted)", maxWidth: "48rem" }}>
        {state.message || "User data remains intact while the site is being updated. Public writes are paused until service resumes."}
      </p>
      {state.expectedReturn ? (
        <p className="maintenance-return">
          Expected return: <strong>{state.expectedReturn}</strong>
        </p>
      ) : null}
      <div className="hero-actions">
        <Link href="/auth" className="cta-primary">
          Admin sign in
        </Link>
        <Link href="/about" className="cta-secondary">
          About KenMatch
        </Link>
      </div>
      <p className="text-xs" style={{ color: "var(--muted)" }}>
        Health checks, static assets, account recovery, and administrator recovery routes remain available.
      </p>
    </section>
  );
}
