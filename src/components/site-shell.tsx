import Link from "next/link";

import { signOutAction } from "@/app/actions";
import { ThemeToggle } from "@/components/theme-toggle";
import type { ProfileSummary, ViewerSession } from "@/lib/types";

const nav = [
  { href: "/", label: "Overview" },
  { href: "/tasks", label: "Marketplace" },
  { href: "/submit", label: "Submit" },
  { href: "/governance", label: "Governance" },
  { href: "/economics", label: "Economics" },
];

export function SiteShell({ viewer, featuredProfiles, children }: { viewer: ViewerSession | null; featuredProfiles: ProfileSummary[]; children: React.ReactNode }) {
  return (
    <div className="site-frame">
      <div className="ambient ambient-a" />
      <div className="ambient ambient-b" />
      <header className="site-header">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-5 py-5 lg:px-8">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div className="space-y-3">
              <Link href="/" className="inline-flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.3em] text-foreground">
                <span className="brand-mark">K</span>
                KenMatch
              </Link>
              <p className="max-w-4xl text-sm text-muted">
                Public infrastructure for allocating long-horizon frontier AI effort by earned voice, public curation, checkpointed execution, and explicit safety boundaries.
              </p>
            </div>
            <div className="flex flex-col gap-3 xl:items-end">
              <ThemeToggle />
              {viewer ? (
                <div className="viewer-card">
                  <div>
                    <div className="font-display text-lg font-semibold text-foreground">{viewer.profile.name}</div>
                    <div className="text-sm text-muted">{viewer.profile.role} · {viewer.profile.attestationLevel}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-xs uppercase tracking-[0.22em] text-muted">Voice free</div>
                    <div className="font-display text-2xl font-semibold text-foreground">{viewer.profile.availableCredits}</div>
                  </div>
                  <form action={signOutAction}>
                    <button type="submit" className="cta-secondary w-full">Sign out</button>
                  </form>
                </div>
              ) : (
                <div className="viewer-card">
                  <div className="font-display text-lg font-semibold text-foreground">Read-only public board</div>
                  <p className="text-sm text-muted">Browse everything anonymously. Sign in to vote, comment, and submit proposals.</p>
                  <Link href="/auth" className="cta-primary text-center">Sign in or create account</Link>
                </div>
              )}
            </div>
          </div>
          <nav className="flex flex-wrap gap-3">
            {nav.map((item) => (
              <Link key={item.href} href={item.href} className="nav-pill">
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex flex-wrap gap-3 text-xs uppercase tracking-[0.22em] text-muted">
            {featuredProfiles.slice(0, 4).map((profile) => (
              <span key={profile.id} className="tag">
                {profile.name} · {profile.attestationLevel}
              </span>
            ))}
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl px-5 py-10 lg:px-8">{children}</main>
      <footer className="border-t border-border bg-panel/75 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-5 py-8 text-sm text-muted lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <p>Months / Weeks / Days. Public curation. Earned voice. Checkpoint-gated execution. Separate treasury and revenue engines.</p>
          <p className="font-mono text-xs uppercase tracking-[0.22em]">Public-interest compute commons with an enterprise bridge</p>
        </div>
      </footer>
    </div>
  );
}
