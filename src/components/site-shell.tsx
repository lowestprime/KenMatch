import Link from "next/link";

import { KenMatchMark } from "@/components/kenmatch-mark";
import { HeaderScrollController } from "@/components/header-scroll-controller";
import { ThemeToggle } from "@/components/theme-toggle";
import { SearchCommand } from "@/components/search-command";
import { VisitorBeacon } from "@/components/visitor-beacon";
import { MobileNav } from "@/components/mobile-nav";
import { PrimaryNav } from "@/components/primary-nav";
import { ProfileMenu } from "@/components/profile-menu";
import { ReleasePolishStyles } from "@/components/release-polish-styles";
import { CommunityPolishStyles } from "@/components/community-polish-styles";
import { ReleaseHardeningStyles } from "@/components/release-hardening-styles";
import { getCategoryVisualOverrideCss } from "@/lib/category-visual-settings";
import type { ViewerSession } from "@/lib/types";

const primaryNav = [
  { href: "/", label: "Overview" },
  { href: "/kens", label: "Feed" },
  { href: "/discuss", label: "Discuss" },
  { href: "/profiles", label: "Profiles" },
  { href: "/submit", label: "Submit" },
  { href: "/governance", label: "Rules" },
  { href: "/economics", label: "Backing" },
  { href: "/about", label: "About" },
  { href: "/faq", label: "FAQ" },
];

export async function SiteShell({ viewer, children }: { viewer: ViewerSession | null; children: React.ReactNode }) {
  const showAdminLink = Boolean(viewer && (viewer.account.systemRole === "admin" || viewer.account.systemRole === "owner" || viewer.account.systemRole === "moderator"));
  const categoryVisualCss = await getCategoryVisualOverrideCss();
  const viewerKey = viewer?.account.id ?? "guest";

  return (
    <div className="site-frame">
      <ReleasePolishStyles />
      <CommunityPolishStyles />
      <ReleaseHardeningStyles />
      {categoryVisualCss ? <style dangerouslySetInnerHTML={{ __html: categoryVisualCss }} /> : null}
      <a href="#main-content" className="skip-link">Skip to content</a>
      <VisitorBeacon />
      <HeaderScrollController />
      <div className="ambient ambient-a" />
      <div className="ambient ambient-b" />
      <header className="site-header">
        <div className="site-header-inner">
          <div className="site-brand-row">
            <Link href="/" className="site-brand" aria-label="KenMatch home">
              <KenMatchMark className="brand-mark" />
              <span className="site-brand-text"><strong>KenMatch</strong><span>Transparent allocation of frontier AI compute</span></span>
            </Link>
            <PrimaryNav items={primaryNav} />
            <div className="site-utility-row">
              <SearchCommand />
              <ThemeToggle />
              <MobileNav key={viewerKey} primaryNav={primaryNav} showAdminLink={showAdminLink} viewer={viewer} />
              {viewer ? <ProfileMenu viewer={viewer} showAdminLink={showAdminLink} /> : <a href="/auth" className="cta-secondary cta-compact">Sign in</a>}
            </div>
          </div>
        </div>
      </header>
      <main id="main-content" className="site-main">{children}</main>
      <footer className="site-footer">
        <div className="site-footer-inner">
          <div className="site-footer-top">
            <Link href="/" className="site-brand site-brand-footer" aria-label="KenMatch home">
              <KenMatchMark className="brand-mark brand-mark-footer" />
              <span className="site-brand-text"><strong>KenMatch</strong><span>Public allocation for frontier AI work</span></span>
            </Link>
            <div className="site-footer-links" aria-label="Platform links">
              <Link className="footer-badge" href="/discuss">Discuss</Link>
              <Link className="footer-badge" href="/profiles">Profiles</Link>
              <Link className="footer-badge" href="/faq#contact">Contact</Link>
              <Link className="footer-badge" href="/about#changelog">Changelog</Link>
              <a className="footer-badge" href="https://github.com/lowestprime/KenMatch" target="_blank" rel="noopener noreferrer">GitHub</a>
            </div>
          </div>
          <p>Kens stay public from intake through launch, checkpoints, partial delivery, and final audit.</p>
          <p className="site-footer-meta">Voice stays separate from money. Backing supports compute, review, and operations without buying rank.</p>
          <p className="site-footer-meta site-footer-sandbox">Simulated sandbox capital, demo workflow outcomes, and placeholder sponsorship commitments are clearly disclosed wherever they appear.</p>
        </div>
      </footer>
    </div>
  );
}
