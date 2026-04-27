import type { Metadata } from "next";
import Link from "next/link";

import { canonicalOrigin } from "@/lib/env";

export const metadata: Metadata = {
  title: "Identity verification",
  description:
    "How KenMatch verifies contributor identity, affiliations, and stewardship responsibility. Public criteria, process, and timing.",
  alternates: { canonical: `${canonicalOrigin}/verification` },
};

export default function VerificationPublicPage() {
  return (
    <div className="page-stack">
      <section className="panel hero-panel grid gap-4">
        <span className="eyebrow">Public trust · verification</span>
        <h1>How KenMatch verifies contributors</h1>
        <p style={{ color: "var(--muted)", maxWidth: "60ch" }}>
          Verification is optional but visible. It lets the community distinguish between community accounts and contributors who have had their name, affiliation, and
          published track record cross-checked by a KenMatch administrator.
        </p>
        <div className="flex flex-wrap gap-2">
          <Link href="/auth" className="cta-primary cta-compact">
            Create an account
          </Link>
          <Link href="/account" className="cta-secondary cta-compact">
            Request verification
          </Link>
        </div>
      </section>

      <section className="panel grid gap-4">
        <h2>What a verified badge means</h2>
        <ul className="grid gap-2" style={{ color: "var(--ink)", fontSize: "0.95rem" }}>
          <li>
            <strong>Real name</strong> matches a public identifier such as ORCID, institutional page, GitHub, or a peer-reviewed publication.
          </li>
          <li>
            <strong>Affiliation</strong> is credible and publicly listed. Pseudonymous accounts are welcome but are not eligible for the verification badge.
          </li>
          <li>
            <strong>Stewardship scope</strong> — the contributor agreed to the community rules, bond policy, and public comment expectations.
          </li>
          <li>
            <strong>No conflict of interest</strong> has been reported or is visible on the profile, and any sponsor relationships are disclosed publicly.
          </li>
        </ul>
      </section>

      <section className="panel grid gap-3">
        <h2>Process</h2>
        <ol className="grid gap-2" style={{ color: "var(--ink)", fontSize: "0.95rem" }}>
          <li>
            <strong>Step 1 · Email verification.</strong> Every new account must click the link sent to the registered address. Unverified accounts cannot submit Kens, comment,
            or allocate voice.
          </li>
          <li>
            <strong>Step 2 · Contributor profile.</strong> Fill out your bio, specialty, location, pronouns, and any external links (ORCID, institutional page, GitHub, personal
            site, publications). You can upload a profile picture or stay with the generated gradient avatar.
          </li>
          <li>
            <strong>Step 3 · Submit a verification request.</strong> From the <Link href="/account">account page</Link>, add a short note listing your real name, affiliation,
            role, and at least one verifiable link. This is visible only to administrators.
          </li>
          <li>
            <strong>Step 4 · Review.</strong> A KenMatch administrator (Cooper Beaman or a delegated moderator) cross-checks the information within 5 business days. If more
            evidence is required, we reply by email.
          </li>
          <li>
            <strong>Step 5 · Outcome.</strong> Approved accounts gain a visible verification badge in comment threads, contextual profile links, and their profile page.
            Declined requests may be resubmitted with additional evidence at any time.
          </li>
        </ol>
      </section>

      <section className="panel grid gap-3">
        <h2>Data we collect & how long we keep it</h2>
        <p style={{ color: "var(--ink)", fontSize: "0.95rem" }}>
          Verification notes and the reviewing administrator&apos;s decision are stored in the KenMatch database alongside your account. The verification note is never shown
          publicly; only the badge and decision state are. You can request deletion of the note at any time by emailing the maintainer.
        </p>
        <p style={{ color: "var(--muted)", fontSize: "0.88rem" }}>
          We never share verification data with sponsors or third parties. The production deployment keeps account and verification records in the persisted KenMatch data
          volume documented for the Synology deployment; backups must be preserved before rebuilds or redeploys.
        </p>
      </section>

      <section className="panel grid gap-3">
        <h2>Appeals & corrections</h2>
        <p style={{ color: "var(--ink)", fontSize: "0.95rem" }}>
          If a verification decision is wrong, you can reply to the notification email or contact
          {" "}
          <a href="mailto:cooperbeaman@proton.me">cooperbeaman@proton.me</a>. The audit log for every verification decision is visible to administrators and can be reviewed if
          needed.
        </p>
      </section>
    </div>
  );
}
