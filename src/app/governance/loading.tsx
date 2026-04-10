export default function GovernanceLoading() {
  return (
    <div className="page-stack">
      <section className="panel space-y-4">
        <div className="skeleton skeleton-eyebrow" />
        <div className="skeleton skeleton-heading" />
        <div className="skeleton skeleton-text" style={{ maxWidth: "40rem" }} />
      </section>
      <section className="section-grid" data-columns="2">
        <div className="panel space-y-4">
          <div className="skeleton skeleton-eyebrow" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton skeleton-card" />
          ))}
        </div>
        <div className="panel space-y-4">
          <div className="skeleton skeleton-eyebrow" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton skeleton-card" />
          ))}
        </div>
      </section>
    </div>
  );
}
