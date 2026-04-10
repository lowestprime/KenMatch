import Link from "next/link";

export default function NotFound() {
  return (
    <div className="page-stack">
      <section className="panel hero-panel card-sheen space-y-6 mx-auto mt-12 max-w-2xl">
        <div className="eyebrow">Page not found</div>
        <h1 className="font-display text-4xl font-semibold text-foreground sm:text-5xl">
          Nothing here yet.
        </h1>
        <p className="text-lg leading-8 text-muted">
          The page you followed does not exist, may have been moved, or the Ken may
          still be in review. Try the board or start from the overview.
        </p>
        <div className="hero-actions">
          <Link href="/kens" className="cta-primary">Browse projects</Link>
          <Link href="/" className="cta-secondary">Back to overview</Link>
        </div>
      </section>
    </div>
  );
}
