export default function PeopleLoading() {
  return (
    <div className="page-stack" role="status" aria-live="polite" aria-busy="true">
      <section className="panel grid gap-3">
        <div className="skeleton skeleton-eyebrow" />
        <div className="skeleton skeleton-title" />
      </section>
      <section className="grid gap-3 md:grid-cols-2">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="skeleton skeleton-card" />
        ))}
      </section>
    </div>
  );
}
