import type { Metadata } from "next";
import Link from "next/link";

import { GlossaryExplorer } from "@/components/glossary-explorer";
import { GLOSSARY_ENTRIES } from "@/lib/glossary";

export const metadata: Metadata = {
  title: "Operational Glossary",
  description: "Search precise KenMatch definitions, governing formulas, implementation status, related terms, and public routes.",
  alternates: { canonical: "/glossary" },
  openGraph: {
    title: "Operational Glossary | KenMatch",
    description: "Definitions and implementation status for Kens, public pulse, allocation voice, lanes, checkpoints, funding, review, and evidence.",
  },
};

export default function GlossaryPage() {
  return (
    <div className="page-stack long-reading-route">
      <section className="panel hero-panel glossary-hero">
        <div className="eyebrow">KenMatch glossary</div>
        <h1>Plain language beside the actual operating rules.</h1>
        <p className="text-muted">
          Each term includes a public definition, technical meaning, governing constants or rules, current implementation state, related concepts, and the route where it matters.
        </p>
        <div className="hero-actions">
          <Link href="/faq" className="cta-primary">Read the FAQ</Link>
          <Link href="/governance" className="cta-secondary">Inspect governance</Link>
          <a href="#glossary-heading" className="cta-secondary">Browse terms</a>
        </div>
      </section>
      <GlossaryExplorer entries={GLOSSARY_ENTRIES} />
    </div>
  );
}
