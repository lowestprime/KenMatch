import Link from "next/link";

import { signOutAction } from "@/app/actions";
import { KenMatchMark } from "@/components/kenmatch-mark";
import { ThemeToggle } from "@/components/theme-toggle";
import type { ParticipationState, ProfileSummary, ViewerSession } from "@/lib/types";

const nav = [
  { href: "/", label: "Overview" },
  { href: "/kens", label: "Feed" },
  { href: "/submit", label: "Submit" },
  { href: "/governance", label: "Rules" },
  { href: "/economics", label: "Backing" },
];

export function SiteShell({ viewer, featuredProfiles, children }: { viewer: ViewerSession | null; featuredProfiles: ProfileSummary[]; children: React.ReactNode }) {
  return (
    <div className="site-frame">
      <div className="ambient ambient-a" />
      <div className="ambient ambient-b" />
      <header className="site-header">
        <div className="site-header-inner">
          <div className="site-brand-row">
            <Link href="/" className="site-brand" aria-label="KenMatch home">
              <KenMatchMark className="brand-mark" />
              <span>
                <strong>KenMatch</strong>
                <span>Community board for helpful long-running AI Kens</span>
              </span>
            </Link>
            <div className="site-utility-row">
              <ThemeToggle />
              {viewer ? (
                <div className="viewer-inline-card">
                  <div>
                    <div className="viewer-inline-name">{viewer.profile.name}</div>
                    <div className="viewer-inline-meta">
                      {labelForParticipationState(viewer.profile.participationState)} · {viewer.profile.availableCredits}/{viewer.profile.effectiveVoiceCredits} priority credits free
                    </div>
                  </div>
                  <form action={signOutAction}>
                    <button type="submit" className="cta-secondary cta-compact">Sign out</button>
                  </form>
                </div>
              ) : (
                <Link href="/auth" className="cta-secondary cta-compact">Sign in</Link>
              )}
            </div>
          </div>
          <div className="site-nav-row">
            <nav className="site-nav" aria-label="Primary">
              {nav.map((item) => (
                <Link key={item.href} href={item.href} className="nav-pill">
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="site-profile-strip" aria-label="Featured contributors">
              {featuredProfiles.slice(0, 5).map((profile) => (
                <span key={profile.id} className="tag">
                  {profile.name} · {profile.specialty}
                </span>
              ))}
            </div>
          </div>
        </div>
      </header>
      <main className="site-main">{children}</main>
      <footer className="site-footer">
        <div className="site-footer-inner">
          <p>Kens stay public from intake through launch, checkpoints, partial delivery, and final audit.</p>
          <p className="site-footer-meta">Voice stays separate from money. Backing supports compute, review, and operations without buying rank.</p>
        </div>
      </footer>
    </div>
  );
}

function labelForParticipationState(state: ParticipationState) {
  switch (state) {
    case "full":
      return "Full participation";
    case "review-limited":
      return "Review-limited";
    case "read-only":
      return "Read-only";
  }
}
