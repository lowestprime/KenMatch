export default function KenDetailLoading() {
  return (
    <div className="page-stack">
      <section className="panel hero-panel card-sheen space-y-6">
        <div className="flex gap-3">
          <div className="skeleton" style={{ width: "5rem", height: "1.8rem", borderRadius: "999px" }} />
          <div className="skeleton" style={{ width: "4rem", height: "1.8rem", borderRadius: "999px" }} />
          <div className="skeleton" style={{ width: "5.5rem", height: "1.8rem", borderRadius: "999px" }} />
        </div>
        <div className="skeleton skeleton-eyebrow" />
        <div className="skeleton skeleton-heading" style={{ width: "80%" }} />
        <div className="skeleton skeleton-text" style={{ maxWidth: "40rem" }} />
        <div className="skeleton skeleton-text" style={{ maxWidth: "36rem" }} />
        <div className="metric-grid">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="metric-card">
              <div className="skeleton skeleton-eyebrow" />
              <div className="skeleton skeleton-metric" />
            </div>
          ))}
        </div>
      </section>
      <section className="detail-layout">
        <div className="space-y-6">
          <div className="panel space-y-4">
            <div className="skeleton skeleton-eyebrow" />
            <div className="skeleton skeleton-heading" style={{ width: "60%" }} />
            <div className="skeleton skeleton-text" />
            <div className="skeleton skeleton-text" style={{ width: "90%" }} />
            <div className="skeleton skeleton-text" style={{ width: "85%" }} />
          </div>
          <div className="panel grid gap-5 lg:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton skeleton-card" />
            ))}
          </div>
        </div>
        <div className="space-y-6">
          <div className="panel space-y-4">
            <div className="skeleton skeleton-eyebrow" />
            <div className="skeleton skeleton-heading" style={{ width: "70%" }} />
            <div className="skeleton skeleton-text" />
          </div>
          <div className="panel space-y-4">
            <div className="skeleton skeleton-eyebrow" />
            <div className="skeleton skeleton-heading" style={{ width: "50%" }} />
            <div className="skeleton skeleton-card" />
            <div className="skeleton skeleton-card" />
          </div>
        </div>
      </section>
    </div>
  );
}
