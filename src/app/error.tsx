"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      console.error("[kenmatch] runtime error", error);
    }
  }, [error]);

  return (
    <div className="page-stack">
      <section className="panel grid gap-4" role="alert" aria-live="assertive">
        <span className="eyebrow">Unexpected error</span>
        <h1>Something went wrong rendering this page.</h1>
        <p style={{ color: "var(--muted)" }}>
          The error has been logged. You can retry, go back to the overview, or report the issue.
        </p>
        {error.digest ? (
          <p style={{ color: "var(--muted)", fontSize: "0.8rem" }}>
            Reference: <code>{error.digest}</code>
          </p>
        ) : null}
        <div className="flex flex-wrap gap-2">
          <button type="button" className="cta-primary cta-compact" onClick={() => reset()}>
            Try again
          </button>
          <Link href="/" className="cta-secondary cta-compact">
            Return to overview
          </Link>
          <a
            href="mailto:cooperbeaman@proton.me?subject=KenMatch%20error%20report"
            className="cta-secondary cta-compact"
          >
            Email the maintainer
          </a>
        </div>
      </section>
    </div>
  );
}
