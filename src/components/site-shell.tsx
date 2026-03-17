import Link from "next/link";

<<<<<<< HEAD
import { signOutAction } from "@/app/actions";
import { ThemeToggle } from "@/components/theme-toggle";
import type { ProfileSummary, ViewerSession } from "@/lib/types";
=======
import { ProfileSwitcher } from "@/components/profile-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import type { ProfileSummary } from "@/lib/types";

interface SiteShellProps {
  profiles: ProfileSummary[];
  activeProfile: ProfileSummary;
  children: React.ReactNode;
}
>>>>>>> origin/main

const nav = [
  { href: "/", label: "Overview" },
  { href: "/tasks", label: "Marketplace" },
  { href: "/submit", label: "Submit" },
  { href: "/governance", label: "Governance" },
  { href: "/economics", label: "Economics" },
];

export function SiteShell({ viewer, featuredProfiles, children }: { viewer: ViewerSession | null; featuredProfiles: ProfileSummary[]; children: React.ReactNode }) {
  return (
<<<<<<< HEAD
    <div className="site-frame">
      <div className="ambient ambient-a" />
      <div className="ambient ambient-b" />
      <header className="site-header">
=======
    <div className="min-h-screen bg-page text-ink transition-colors duration-300">
      <div className="app-backdrop pointer-events-none fixed inset-0 -z-20" />
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(58,153,255,0.14),transparent_28%),radial-gradient(circle_at_80%_10%,rgba(19,163,135,0.18),transparent_30%),radial-gradient(circle_at_50%_100%,rgba(234,99,59,0.12),transparent_26%)]" />
      <header className="sticky top-0 z-30 border-b border-line/90 bg-panel/78 backdrop-blur-xl">
>>>>>>> origin/main
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-5 py-5 lg:px-8">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div className="space-y-3">
<<<<<<< HEAD
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
=======
              <Link href="/" className="inline-flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.3em] text-ink">
                <span className="inline-flex size-10 items-center justify-center rounded-full bg-ink text-page">K</span>
                KenMatch
              </Link>
              <p className="max-w-3xl text-sm text-ink/72">
                Democratized allocation of sustained frontier compute through merit-weighted proposals, public ranking,
                checkpointed execution, and a revenue engine that refills the compute treasury instead of replacing it.
              </p>
            </div>
            <div className="flex flex-col gap-3 lg:items-end">
              <div className="flex flex-wrap items-center gap-3">
                <ThemeToggle />
                <ProfileSwitcher profiles={profiles} activeProfileId={activeProfile.id} />
              </div>
              <div className="rounded-[1.5rem] border border-line bg-page/74 px-4 py-3 text-sm text-ink/80 shadow-soft">
                <div className="font-display text-base font-semibold text-ink">{activeProfile.name}</div>
                <div>{activeProfile.role}</div>
                <div className="mt-2 font-mono text-xs uppercase tracking-[0.22em] text-ink/55">
                  {activeProfile.availableCredits} / {activeProfile.voiceCredits} voice credits free · {activeProfile.bondedCredits} bonded
>>>>>>> origin/main
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
<<<<<<< HEAD
              <Link key={item.href} href={item.href} className="nav-pill">
=======
              <Link
                key={item.href}
                href={item.href}
                className="rounded-full border border-line bg-page/72 px-4 py-2 text-sm font-medium text-ink transition hover:border-accent hover:text-accent"
              >
>>>>>>> origin/main
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
<<<<<<< HEAD
      <footer className="border-t border-border bg-panel/75 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-5 py-8 text-sm text-muted lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <p>Months / Weeks / Days. Public curation. Earned voice. Checkpoint-gated execution. Separate treasury and revenue engines.</p>
          <p className="font-mono text-xs uppercase tracking-[0.22em]">Public-interest compute commons with an enterprise bridge</p>
=======
      <footer className="border-t border-line bg-panel/72 text-ink/72 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-5 py-8 text-sm lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <p>Prototype surface: proposal bonds, quadratic allocation, public ranking, threaded discussion, treasury routing, and checkpoint governance.</p>
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-ink/45">Months / Weeks / Days · earned voice, not purchased influence</p>
>>>>>>> origin/main
        </div>
      </footer>
    </div>
  );
}
