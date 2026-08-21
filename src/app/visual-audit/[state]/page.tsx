import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";

import RootLoading from "@/app/loading";
import { MaintenanceScreen } from "@/components/maintenance-screen";
import { buildPrivateMetadata } from "@/lib/seo";
import { isValidatedVisualAuditContext } from "@/lib/visual-audit-context";

export const dynamic = "force-dynamic";
export const metadata = buildPrivateMetadata(
  "Visual audit state",
  "Private deterministic visual archive fixture.",
);

const STATES = new Set(["loading", "error", "maintenance", "validation", "partial", "success"]);

export default async function VisualAuditStatePage({
  params,
}: {
  params: Promise<{ state: string }>;
}) {
  const [{ state }, requestHeaders] = await Promise.all([params, headers()]);
  if (!STATES.has(state) || !isValidatedVisualAuditContext(requestHeaders)) {
    notFound();
  }

  if (state === "loading") return <RootLoading />;
  if (state === "maintenance") {
    return (
      <MaintenanceScreen
        state={{
          mode: "on",
          message: "Public writes are paused while a verified deployment is completed. Existing public records remain available.",
          expectedReturn: "after validation and health checks complete",
          updatedAt: "2026-07-29T00:00:00.000Z",
          updatedBy: null,
        }}
      />
    );
  }

  if (state === "error") {
    return (
      <section className="panel grid gap-4" role="alert" aria-live="assertive">
        <span className="eyebrow">Unexpected error</span>
        <h1>Something went wrong rendering this page.</h1>
        <p style={{ color: "var(--muted)" }}>
          The error has been logged. Retry the request or return to the public overview.
        </p>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="cta-primary cta-compact">Try again</button>
          <Link href="/" className="cta-secondary cta-compact">Return to overview</Link>
        </div>
      </section>
    );
  }

  if (state === "partial") {
    return (
      <section className="panel grid gap-4" role="status">
        <span className="eyebrow">Partial result</span>
        <h1>Some public evidence is temporarily unavailable.</h1>
        <p style={{ color: "var(--muted)" }}>
          The available record is shown below. Missing artifacts are identified explicitly rather than replaced with a placeholder claim.
        </p>
        <div className="alert-warn">2 of 3 referenced artifacts loaded. One source is pending verification.</div>
      </section>
    );
  }

  if (state === "validation") {
    return (
      <section className="panel grid gap-4" aria-labelledby="visual-audit-validation-heading">
        <span className="eyebrow">Validation required</span>
        <h1 id="visual-audit-validation-heading">Review the highlighted fields.</h1>
        <p style={{ color: "var(--muted)" }}>
          Invalid submissions retain their values, identify each problem next to its field, and do not create a public record.
        </p>
        <label className="field-label">
          <span>Ken title</span>
          <input className="field" aria-invalid="true" aria-describedby="visual-audit-title-error" defaultValue="Too short" />
          <span id="visual-audit-title-error" className="text-xs text-red-500">
            Give the Ken a specific title with at least eight characters.
          </span>
        </label>
        <div className="alert alert-error" role="alert">Fix 2 required fields before submitting.</div>
      </section>
    );
  }

  return (
    <section className="panel grid gap-4" role="status" aria-live="polite">
      <span className="eyebrow">Action complete</span>
      <h1>The public record was saved successfully.</h1>
      <p style={{ color: "var(--muted)" }}>
        The resulting state is durable, reviewable, and linked to the corresponding Ken.
      </p>
      <div className="alert-success">Saved and ready for public review.</div>
    </section>
  );
}
