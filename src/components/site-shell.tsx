import Link from "next/link";

import { KenMatchMark } from "@/components/kenmatch-mark";
import { HeaderScrollController } from "@/components/header-scroll-controller";
import { ThemeToggle } from "@/components/theme-toggle";
import { SearchCommand } from "@/components/search-command";
import { VisitorBeacon } from "@/components/visitor-beacon";
import { MobileNav } from "@/components/mobile-nav";
import { ProfileMenu } from "@/components/profile-menu";
import { ReleasePolishStyles } from "@/components/release-polish-styles";
import type { ViewerSession } from "@/lib/types";

const primaryNav = [
  { href: "/", label: "Overview" },
  { href: "/kens", label: "Feed" },
  { href: "/submit", label: "Submit" },
  { href: "/governance", label: "Rules" },
  { href: "/economics", label: "Backing" },
  { href: "/about", label: "About" },
  { href: "/faq", label: "FAQ" },
];

const FOOTER_LINKS = [
  {
    href: "https://github.com/lowestprime/KenMatch",
    label: "GitHub",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14" aria-hidden="true">
        <path d="M12 2C6.48 2 2 6.58 2 12.25a10.3 10.3 0 0 0 6.83 9.81c.5.1.68-.22.68-.49v-1.72c-2.78.62-3.37-1.38-3.37-1.38-.45-1.17-1.11-1.49-1.11-1.49-.91-.63.07-.62.07-.62 1 .07 1.54 1.05 1.54 1.05.9 1.56 2.36 1.11 2.93.85.09-.67.35-1.12.64-1.38-2.22-.26-4.56-1.13-4.56-5.03 0-1.11.39-2.02 1.03-2.73-.1-.26-.45-1.29.1-2.69 0 0 .84-.27 2.75 1.04A9.42 9.42 0 0 1 12 6.82c.85 0 1.71.12 2.51.34 1.9-1.31 2.74-1.04 2.74-1.04.55 1.4.2 2.43.1 2.69.64.71 1.03 1.62 1.03 2.73 0 3.91-2.34 4.77-4.57 5.02.36.32.68.94.68 1.9v2.82c0 .27.18.6.69.49A10.31 10.31 0 0 0 22 12.25C22 6.58 17.52 2 12 2z" />
      </svg>
    ),
  },
  {
    href: "https://github.com/lowestprime",
    label: "Owner",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14" aria-hidden="true">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c1.5-3.5 4.75-5.5 8-5.5s6.5 2 8 5.5" />
      </svg>
    ),
  },
  {
    href: "/faq#contact",
    label: "Contact",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14" aria-hidden="true">
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m3 7 9 6 9-6" />
      </svg>
    ),
  },
  {
    href: "/about#changelog",
    label: "Changelog",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14" aria-hidden="true">
        <path d="M4 5h16" />
        <path d="M4 12h10" />
        <path d="M4 19h16" />
      </svg>
    ),
  },
];

export function SiteShell({ viewer, children }: { viewer: ViewerSession | null; children: React.ReactNode }) {
  const showAdminLink = Boolean(viewer && (viewer.account.systemRole === "admin" || viewer.account.systemRole === "owner" || viewer.account.systemRole === "moderator"));

  return (
    <div className="site-frame">
      <ReleasePolishStyles />
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
            <nav className="site-nav" aria-label="Primary">
              {primaryNav.map((item) => <Link key={item.href} href={item.href} className="nav-pill">{item.label}</Link>)}
            </nav>
            <div className="site-utility-row">
              <SearchCommand />
              <ThemeToggle />
              <MobileNav primaryNav={primaryNav} showAdminLink={showAdminLink} viewer={viewer} />
              {viewer ? <ProfileMenu viewer={viewer} showAdminLink={showAdminLink} /> : <Link href="/auth" className="cta-secondary cta-compact">Sign in</Link>}
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
            <div className="site-footer-links" aria-label="External links">
              {FOOTER_LINKS.map((link) => (
                <a key={link.href} className="footer-badge" href={link.href} target={link.href.startsWith("http") ? "_blank" : undefined} rel={link.href.startsWith("http") ? "noopener noreferrer" : undefined}>
                  <span className="footer-badge-icon">{link.icon}</span><span>{link.label}</span>
                </a>
              ))}
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
