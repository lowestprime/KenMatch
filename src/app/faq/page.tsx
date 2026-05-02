import type { Metadata } from "next";
import Link from "next/link";

import { ContactForm } from "@/components/contact-form";
import { FAQExplorer } from "@/components/faq-explorer";
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
};

export default function FAQPage() {
  return (
    <div className="page-stack">
      <section className="panel hero-panel faq-hero">
        <div className="eyebrow">KenMatch FAQ</div>
        <h1>What are Kens, and how does the board work?</h1>
        <p className="text-muted">{KEN_DEFINITION} This FAQ explains the prototype, the ranking lanes, public participation, sponsorship boundaries, safety review, privacy, and how to contact the owner.</p>
        <div className="hero-actions">
          <Link href="/kens" className="cta-primary">Browse Kens</Link>
          <Link href="/submit" className="cta-secondary">Submit a Ken</Link>
          <a href="#contact" className="cta-secondary">Contact the owner</a>
        </div>
      </section>
      <FAQExplorer entries={FAQ_ENTRIES} />
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
