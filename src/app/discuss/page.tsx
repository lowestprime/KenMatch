import Link from "next/link";

export const metadata = {
  title: "Discussion",
  description: "KenMatch discussion space for prompt design, governance, funding norms, safety review, and ecosystem debate.",
};

const tracks = [
  {
    title: "Prompt design workshop",
    body: "Improve reusable briefs before they become Kens: scope, sources, acceptance checks, risks, and checkpoint gates.",
  },
  {
    title: "Governance and board process",
    body: "Discuss reviewer roles, voting rules, moderation boundaries, safety gates, and how the public board should stay transparent.",
  },
  {
    title: "Funding and sponsor norms",
    body: "Clarify how backing can expand compute and review capacity without buying rank, voice, or release decisions.",
  },
  {
    title: "Evidence and replication",
    body: "Collect papers, datasets, benchmarks, reproducibility notes, and evaluation ideas that multiple Kens may need.",
  },
];

const previews = [
  "What makes a Ken ready for the Weeks lane?",
  "How should saved discussions and comments support research queues?",
  "When should a sponsor restriction be rejected?",
];

export default function DiscussPage() {
  return (
    <div className="page-stack">
      <section className="panel hero-panel">
        <span className="eyebrow">Discussion commons</span>
        <h1>Discuss the system around Kens before scarce compute is assigned.</h1>
        <p style={{ color: "var(--ink-muted)", maxWidth: "58rem" }}>
          The Feed is for executable Kens. Discussion is the broader public workspace for proposal refinement, prompt design, governance questions, funding norms, safety concerns, and reusable evidence that should not be buried inside one Ken thread.
        </p>
        <div className="hero-actions">
          <Link className="cta-primary" href="/submit">Turn an idea into a Ken</Link>
          <Link className="cta-secondary" href="/faq#discussion-tab">Read how Discussion fits</Link>
          <Link className="cta-secondary" href="/kens">Return to the Feed</Link>
        </div>
      </section>

      <section className="panel protocol-panel">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Purpose</span>
            <h2>Forum-style debate aimed at better public work orders</h2>
          </div>
        </div>
        <div className="ecosystem-grid">
          {tracks.map((track) => (
            <article key={track.title} className="ecosystem-card">
              <strong>{track.title}</strong>
              <p>{track.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section-grid" data-columns="2">
        <div className="panel grid gap-3">
          <span className="eyebrow">Stages</span>
          <h2>From discussion to Ken</h2>
          <ol className="criteria-list">
            <li>Start discussion when the problem, category, risk, or evidence base is still ambiguous.</li>
            <li>Narrow the desired output, source requirements, red lines, and checkpoint cadence.</li>
            <li>Move the mature brief into Submit once it can be inspected, ranked, funded, and audited as a bounded Ken.</li>
            <li>Keep broad policy debate here; keep implementation evidence and run decisions attached to the specific Ken.</li>
          </ol>
        </div>
        <div className="panel grid gap-3">
          <span className="eyebrow">Next primitives</span>
          <h2>Discussion features to wire next</h2>
          <div className="discussion-thread-preview">
            {previews.map((title) => (
              <article key={title}>
                <strong>{title}</strong>
                <p style={{ color: "var(--muted)", marginTop: ".35rem" }}>
                  This placeholder marks the intended post model: searchable posts, nested comments, voting, saves, and links into specific Kens.
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
