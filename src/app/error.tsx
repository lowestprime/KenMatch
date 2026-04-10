"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[KenMatch] Unhandled error:", error);
  }, [error]);

  return (
    <div className="page-stack">
      <section className="panel hero-panel card-sheen space-y-6 mx-auto mt-12 max-w-2xl">
        <div className="eyebrow">Something went wrong</div>
        <h1 className="font-display text-4xl font-semibold text-foreground sm:text-5xl">
          Unexpected error
        </h1>
        <p className="text-lg leading-8 text-muted">
          Something broke while loading this page. The error has been logged.
          You can try again or head back to the overview.
        </p>
        {error.digest ? (
          <p className="font-mono text-xs text-muted">Ref: {error.digest}</p>
        ) : null}
        <div className="hero-actions">
          <button onClick={reset} className="cta-primary">Try again</button>
          <Link href="/" className="cta-secondary">Back to overview</Link>
        </div>
      </section>
    </div>
  );
}
