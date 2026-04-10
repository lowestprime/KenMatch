import Link from "next/link";

import { signOutAction } from "@/app/actions";
import { Avatar } from "@/components/avatar";
import { KenMatchMark } from "@/components/kenmatch-mark";
import { MobileNav } from "@/components/mobile-nav";
import { NavLinks } from "@/components/nav-links";
import { SearchPalette } from "@/components/search-palette";
import { ThemeToggle } from "@/components/theme-toggle";
import type { ParticipationState, ProfileSummary, ViewerSession } from "@/lib/types";

interface SearchData {
  kens: Array<{ slug: string; title: string; summary: string; categoryName: string }>;
  profiles: Array<{ id: string; name: string; role: string; specialty: string }>;
  governance: Array<{ id: string; title: string; decision: string; house: string }>;
  categories: Array<{ slug: string; name: string; description: string }>;
}

export function SiteShell({ viewer, featuredProfiles, searchData, children }: { viewer: ViewerSession | null; featuredProfiles: ProfileSummary[]; searchData: SearchData; children: React.ReactNode }) {
  return (
    <div className="site-frame">
      <a href="#main-content" className="skip-link">Skip to content</a>
      <div className="ambient ambient-a" />
      <div className="ambient ambient-b" />
      <header className="site-header">
        <div className="site-header-inner">
          <div className="site-brand-row">
            <Link href="/" className="site-brand" aria-label="KenMatch home">
              <KenMatchMark className="brand-mark" />
              <span>
                <strong>KenMatch</strong>
                <span>Where people decide which AI projects run longer</span>
              </span>
            </Link>
            <div className="site-utility-row">
              <SearchPalette {...searchData} />
              <ThemeToggle />
              {viewer ? (
                <div className="viewer-inline-card">
                  <Link href="/account" className="viewer-inline-link">
                    <Avatar name={viewer.profile.name} hue={viewer.profile.avatarHue} size={28} className="viewer-avatar" />
                    <div>
                      <div className="viewer-inline-name">{viewer.profile.name}</div>
                      <div className="viewer-inline-meta">
                        {labelForParticipationState(viewer.profile.participationState)} · {viewer.profile.availableCredits}/{viewer.profile.effectiveVoiceCredits} credits
                      </div>
                    </div>
                  </Link>
                  <form action={signOutAction}>
                    <button type="submit" className="cta-secondary cta-compact">Sign out</button>
                  </form>
                </div>
              ) : (
                <Link href="/auth" className="cta-secondary cta-compact">Sign in</Link>
              )}
              <MobileNav isSignedIn={!!viewer} />
            </div>
          </div>
          <div className="site-nav-row">
            <NavLinks />
            <div className="site-profile-strip" aria-label="Featured contributors">
              {featuredProfiles.slice(0, 5).map((profile) => (
                <Link key={profile.id} href={`/profiles/${profile.id}`} className="tag tag-link">
                  {profile.name} · {profile.specialty}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </header>
      <main id="main-content" className="site-main">{children}</main>
      <footer className="site-footer">
        <div className="site-footer-inner">
          <p>Every project stays public from proposal through launch, checkpoints, delivery, and final audit.</p>
          <p className="site-footer-meta">Your voice stays separate from money. Funding supports compute and review without buying influence.</p>
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
