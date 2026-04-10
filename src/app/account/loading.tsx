export default function AccountLoading() {
  return (
    <div className="page-stack">
      <section className="panel hero-panel card-sheen space-y-6">
        <div className="flex items-center gap-5">
          <div className="skeleton" style={{ width: 64, height: 64, borderRadius: "0.625rem" }} />
          <div className="space-y-2">
            <div className="skeleton skeleton-eyebrow" />
            <div className="skeleton skeleton-heading" style={{ width: "12rem" }} />
            <div className="skeleton skeleton-text" style={{ width: "16rem" }} />
          </div>
        </div>
        <div className="metric-grid">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="metric-card"><div className="skeleton skeleton-eyebrow" /><div className="skeleton skeleton-metric" /></div>
          ))}
        </div>
      </section>
      <section className="section-grid" data-columns="2">
        <div className="panel space-y-5">
          <div className="skeleton skeleton-eyebrow" />
          <div className="skeleton skeleton-heading" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: "3rem", borderRadius: "1.1rem" }} />
          ))}
        </div>
        <div className="space-y-6">
          <div className="panel space-y-5">
            <div className="skeleton skeleton-eyebrow" />
            <div className="skeleton skeleton-heading" />
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: "3rem", borderRadius: "1.1rem" }} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
