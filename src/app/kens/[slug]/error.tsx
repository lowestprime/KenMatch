"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function KenDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[KenMatch] Ken detail error:", error);
  }, [error]);

  return (
    <div className="page-stack">
      <section className="panel space-y-6 mx-auto mt-12 max-w-2xl">
        <div className="eyebrow">Error loading Ken</div>
        <h1 className="font-display text-3xl font-semibold text-foreground">
          Could not load this project
        </h1>
        <p className="text-sm leading-7 text-muted">
          The Ken may not exist, or it may be temporarily unavailable.
        </p>
        {error.digest ? (
          <p className="font-mono text-xs text-muted">Ref: {error.digest}</p>
        ) : null}
        <div className="hero-actions">
          <button onClick={reset} className="cta-primary">Retry</button>
          <Link href="/kens" className="cta-secondary">Browse projects</Link>
        </div>
      </section>
    </div>
  );
}
