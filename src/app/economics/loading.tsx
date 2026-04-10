export default function EconomicsLoading() {
  return (
    <div className="page-stack">
      <section className="panel hero-panel space-y-5">
        <div className="skeleton skeleton-eyebrow" />
        <div className="skeleton skeleton-heading" />
        <div className="skeleton skeleton-text" style={{ maxWidth: "40rem" }} />
        <div className="signal-bar">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flow-card">
              <div className="skeleton skeleton-eyebrow" />
              <div className="skeleton skeleton-metric" />
            </div>
          ))}
        </div>
      </section>
      <section className="metric-grid">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="metric-card">
            <div className="skeleton skeleton-eyebrow" />
            <div className="skeleton skeleton-metric" />
          </div>
        ))}
      </section>
    </div>
  );
}
