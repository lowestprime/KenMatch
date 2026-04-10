export default function KensLoading() {
  return (
    <div className="page-stack">
      <section className="panel hero-panel space-y-4">
        <div className="skeleton skeleton-eyebrow" />
        <div className="skeleton skeleton-heading" />
        <div className="skeleton skeleton-text" style={{ maxWidth: "36rem" }} />
        <div className="metric-grid">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="metric-card">
              <div className="skeleton skeleton-eyebrow" />
              <div className="skeleton skeleton-metric" />
            </div>
          ))}
        </div>
      </section>
      <section className="feed-list">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="task-card">
            <div className="skeleton skeleton-heading" style={{ width: "60%" }} />
            <div className="skeleton skeleton-text" />
            <div className="skeleton skeleton-text" style={{ width: "80%" }} />
          </div>
        ))}
      </section>
    </div>
  );
}
