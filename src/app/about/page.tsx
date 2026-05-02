import Link from "next/link";

import { AboutEditor } from "@/components/about-editor";
import { ChangelogList } from "@/components/changelog-list";
import { ContactForm } from "@/components/contact-form";
import { getAboutPageContent, listChangelogEntries } from "@/lib/db";
import { env } from "@/lib/env";
import { KEN_DEFINITION } from "@/lib/faq";
import { turnstileConfigured } from "@/lib/security";
import { getViewerSession } from "@/lib/session";

export const metadata = {
  title: "About & Contact",
  description:
    "KenMatch mission, public allocation rules, changelog, and contact route.",
};

export default async function AboutPage() {
  const [about, viewer, changelog] = await Promise.all([getAboutPageContent(), getViewerSession(), listChangelogEntries(false, 20)]);
  const canEdit = viewer?.account.systemRole === "owner";
  const lastUpdatedLabel = about.lastUpdated && about.lastUpdated !== new Date(0).toISOString()
    ? new Date(about.lastUpdated).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <div className="page-stack">
      <section className="panel hero-panel about-hero">
        <div className="about-hero-copy">
          <span className="eyebrow">{about.heroEyebrow}</span>
          <h1>{about.heroTitle}</h1>
          <p className="text-muted" style={{ color: "var(--ink-muted)" }}>
            {about.heroSubtitle}
          </p>
          <div className="hero-actions">
            <a className="cta-primary" href="/faq#contact">
              Contact the owner
            </a>
            <Link className="cta-secondary" href="/about#changelog">
              Read the changelog
            </Link>
            {about.links.slice(0, 3).map((link, index) => (
              <a
                key={`${link.label}-${link.url}-${index}`}
                className="cta-secondary"
                href={link.url}
                target={link.url.startsWith("http") ? "_blank" : undefined}
                rel={link.url.startsWith("http") ? "noopener noreferrer" : undefined}
              >
                {link.label}
              </a>
            ))}
          </div>
          {lastUpdatedLabel ? (
            <p className="text-xs" style={{ color: "var(--muted)" }}>
              Last updated {lastUpdatedLabel}
            </p>
          ) : null}
        </div>
        <div className="about-hero-summary" aria-label="KenMatch operating commitments">
          <div><strong>Public board</strong><span>Proposals, ranking, launch states, and checkpoints stay visible.</span></div>
          <div><strong>Money separate from rank</strong><span>Backing expands compute and review capacity without buying priority.</span></div>
          <div><strong>Sandbox disclosure</strong><span>Demo figures and sample outcomes are labeled before live commitments exist.</span></div>
        </div>
      </section>

      <section className="section-grid" data-columns="2">
        <div className="panel grid gap-3">
          <h2>{about.missionTitle}</h2>
          <p style={{ color: "var(--ink-muted)" }}>{about.missionBody}</p>
          <p className="ken-definition-callout">{KEN_DEFINITION}</p>
        </div>
        <div className="panel grid gap-3">
          <h2>{about.beliefsTitle}</h2>
          <ul className="grid gap-2">
            {about.beliefsBullets.map((item) => (
              <li key={item} className="alert" style={{ background: "transparent" }}>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section-grid" data-columns="2">
        <div className="panel grid gap-3">
          <h2>{about.backgroundTitle}</h2>
          <p style={{ color: "var(--ink-muted)" }}>{about.backgroundBody}</p>
        </div>
        <div className="panel grid gap-3">
          <h2>{about.goalsTitle}</h2>
          <ul className="grid gap-2">
            {about.goalsBullets.map((item) => (
              <li key={item} className="alert" style={{ background: "transparent" }}>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="panel grid gap-3">
        <h2>{about.contactTitle}</h2>
        <p style={{ color: "var(--ink-muted)" }}>{about.contactBody}</p>
        <div className="hero-actions">
          <a className="cta-primary" href="/faq#contact">
            Contact the owner
          </a>
          <Link className="cta-secondary" href="/submit">
            Submit a Ken
          </Link>
        </div>
        {about.links.length > 0 ? (
          <div className="site-footer-links" style={{ marginTop: "0.5rem" }}>
            {about.links.map((link, index) => (
              <a
                key={`${link.label}-${link.url}-${index}`}
                className="footer-badge"
                href={link.url}
                target={link.url.startsWith("http") ? "_blank" : undefined}
                rel={link.url.startsWith("http") ? "noopener noreferrer" : undefined}
              >
                <span>{link.label}</span>
              </a>
            ))}
          </div>
        ) : null}
      </section>

      <section id="contact" className="panel contact-panel" aria-labelledby="about-contact-form-heading">
        <div>
          <div className="eyebrow">Feedback route</div>
          <h2 id="about-contact-form-heading">Send questions, suggestions, or recommendations</h2>
          <p style={{ color: "var(--ink-muted)" }}>
            Use the structured form for markdown notes, public FAQ gaps, partnership ideas, bug reports, and small attachments. Messages are routed to the KenMatch owner when SMTP is configured and saved locally either way.
          </p>
        </div>
        <ContactForm turnstileSiteKey={turnstileConfigured() ? env.NEXT_PUBLIC_TURNSTILE_SITE_KEY : undefined} />
      </section>

      <section id="changelog" className="panel changelog-section" aria-labelledby="changelog-heading">
        <div className="section-heading">
          <div>
            <div className="eyebrow">Changelog</div>
            <h2 id="changelog-heading">Significant updates from prototype to launch</h2>
          </div>
          <Link className="cta-secondary cta-compact" href="/faq">Read the FAQ</Link>
        </div>
        <ChangelogList entries={changelog} />
      </section>

      {canEdit ? (
        <section className="panel grid gap-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <span className="eyebrow">Owner only</span>
              <h2>Edit the About / Contact page</h2>
            </div>
            <span className="role-badge is-owner">Owner</span>
          </div>
          <p style={{ color: "var(--muted)" }}>
            Updates are written to the database and survive container rebuilds. They appear immediately.
          </p>
          <AboutEditor initial={about} />
        </section>
      ) : null}
    </div>
  );
}
