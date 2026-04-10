"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function GovernanceError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[KenMatch] Governance error:", error);
  }, [error]);

  return (
    <div className="page-stack">
      <section className="panel space-y-6 mx-auto mt-12 max-w-2xl">
        <div className="eyebrow">Governance error</div>
        <h1 className="font-display text-3xl font-semibold text-foreground">
          Could not load governance data
        </h1>
        <p className="text-sm leading-7 text-muted">
          Safety reviews, attestation, and event history may be temporarily unavailable.
        </p>
        {error.digest ? (
          <p className="font-mono text-xs text-muted">Ref: {error.digest}</p>
        ) : null}
        <div className="hero-actions">
          <button onClick={reset} className="cta-primary">Retry</button>
          <Link href="/" className="cta-secondary">Overview</Link>
        </div>
      </section>
    </div>
  );
}
