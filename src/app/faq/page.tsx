import type { Metadata } from "next";
import Link from "next/link";

import { ContactForm } from "@/components/contact-form";
import { FAQExplorer } from "@/components/faq-explorer";
import { ProductTruthMatrix } from "@/components/product-truth-matrix";
import { env } from "@/lib/env";
import { FAQ_ENTRIES, KEN_DEFINITION } from "@/lib/faq";
import { turnstileConfigured } from "@/lib/security";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Search common KenMatch questions about Kens, lanes, voting, sponsorship, safety, privacy, and contact.",
  openGraph: {
    title: "FAQ | KenMatch",
    description: "Understand what Kens are and how KenMatch ranks sustained frontier-AI work.",
  },
  alternates: { canonical: "/faq" },
};

export default function FAQPage() {
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_ENTRIES.map((entry) => ({
      "@type": "Question",
      name: entry.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: entry.answer,
      },
    })),
  };

  return (
    <div className="page-stack long-reading-route">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd).replace(/</g, "\\u003c") }}
      />
      <section className="panel hero-panel faq-hero">
        <div className="eyebrow">KenMatch FAQ</div>
        <h1>What are Kens, and how does the board work?</h1>
        <p className="text-muted">{KEN_DEFINITION} This FAQ explains the prototype, the ranking lanes, public participation, sponsorship boundaries, safety review, privacy, and how to contact the owner.</p>
        <div className="hero-actions">
          <Link href="/kens" className="cta-primary">Browse Kens</Link>
          <Link href="/submit" className="cta-secondary">Submit a Ken</Link>
          <Link href="/glossary" className="cta-secondary">Open the glossary</Link>
          <Link href="/#lifecycle" className="cta-secondary">See the lifecycle</Link>
          <a href="#contact" className="cta-secondary">Contact the owner</a>
        </div>
      </section>
      <FAQExplorer entries={FAQ_ENTRIES} />
      <ProductTruthMatrix />
      <section id="contact" className="panel contact-panel" aria-labelledby="contact-heading">
        <div>
          <div className="eyebrow">Contact</div>
          <h2 id="contact-heading">Questions, suggestions, recommendations, or missing info</h2>
          <p className="text-muted">
            Use this form for public feedback, partnership leads, sponsorship questions, bug reports, FAQ gaps, or suggestions that should route to the KenMatch owner.
          </p>
        </div>
        <ContactForm turnstileSiteKey={turnstileConfigured() ? env.NEXT_PUBLIC_TURNSTILE_SITE_KEY : undefined} />
      </section>
    </div>
  );
}
