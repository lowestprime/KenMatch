export default function SubmitLoading() {
  return (
    <div className="page-stack">
      <section className="panel space-y-4">
        <div className="skeleton skeleton-eyebrow" />
        <div className="skeleton skeleton-heading" />
        <div className="skeleton skeleton-text" style={{ maxWidth: "40rem" }} />
      </section>
      <section className="panel grid gap-5">
        <div className="grid gap-5 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="skeleton skeleton-eyebrow" />
              <div className="skeleton" style={{ height: "5rem", borderRadius: "1.1rem" }} />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
