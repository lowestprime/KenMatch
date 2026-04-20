import Link from "next/link";

export default function NotFound() {
  return (
    <div className="page-stack">
      <section className="panel grid gap-4">
        <span className="eyebrow">404</span>
        <h1>We couldn&apos;t find that page.</h1>
        <p style={{ color: "var(--muted)" }}>
          The Ken, profile, or page you requested isn&apos;t available or has been archived.
        </p>
        <div className="flex flex-wrap gap-2">
          <Link href="/kens" className="cta-primary cta-compact">
            Browse Kens
          </Link>
          <Link href="/" className="cta-secondary cta-compact">
            Return to overview
          </Link>
          <Link href="/people" className="cta-secondary cta-compact">
            Contributors
          </Link>
        </div>
      </section>
    </div>
  );
}
