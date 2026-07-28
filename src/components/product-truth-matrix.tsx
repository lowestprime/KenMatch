import Link from "next/link";

import {
  PRODUCT_TRUTH_ITEMS,
  type ProductTruthStatus,
} from "@/lib/product-truth";

const labels: Record<ProductTruthStatus, string> = {
  operational: "Operational",
  sandbox: "Sandbox / demo",
  unconfigured: "Externally unconfigured",
  proposed: "Proposed",
  "out-of-scope": "Intentionally out of scope",
};

export function ProductTruthMatrix() {
  return (
    <section id="trust-status" className="panel truth-panel anchor-target" aria-labelledby="trust-status-heading" tabIndex={-1}>
      <div className="section-heading">
        <div>
          <div className="eyebrow">Public truth surface</div>
          <h2 id="trust-status-heading">What works now, and what does not</h2>
        </div>
        <Link href="/glossary#trust-surface" className="cta-secondary cta-compact">Define these states</Link>
      </div>
      <p className="text-muted">
        This matrix separates implemented behavior from demonstrations, external configuration, and future policy. It does not expose private records, credentials, or security-sensitive internals.
      </p>
      <div className="truth-grid">
        {PRODUCT_TRUTH_ITEMS.map((item) => (
          <article key={item.id} className="truth-item">
            <div className="truth-item-heading">
              <h3>{item.area}</h3>
              <span className={`micro-pill truth-status-${item.status}`}>{labels[item.status]}</span>
            </div>
            <p>{item.evidence}</p>
            <p className="text-muted"><strong>Boundary:</strong> {item.limitation}</p>
            <Link className="text-link" href={item.route}>Inspect the public surface</Link>
          </article>
        ))}
      </div>
    </section>
  );
}
