export default function RootLoading() {
  return (
    <div className="page-stack" role="status" aria-live="polite" aria-busy="true">
      <section className="panel grid gap-4">
        <div className="skeleton skeleton-eyebrow" />
        <div className="skeleton skeleton-title" />
        <div className="skeleton skeleton-line" />
        <div className="skeleton skeleton-line" style={{ width: "70%" }} />
        <div className="grid gap-3 md:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="skeleton skeleton-card" />
          ))}
        </div>
      </section>
      <section className="panel grid gap-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="skeleton skeleton-row" />
        ))}
      </section>
    </div>
  );
}
