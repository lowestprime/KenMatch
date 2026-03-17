import Link from "next/link";

import { ProfileSwitcher } from "@/components/profile-switcher";
import type { ProfileSummary } from "@/lib/types";

interface SiteShellProps {
  profiles: ProfileSummary[];
  activeProfile: ProfileSummary;
  children: React.ReactNode;
}

const nav = [
  { href: "/", label: "Overview" },
  { href: "/tasks", label: "Marketplace" },
  { href: "/submit", label: "Submit" },
  { href: "/governance", label: "Governance" },
];

export function SiteShell({ profiles, activeProfile, children }: SiteShellProps) {
  return (
    <div className="min-h-screen bg-paper text-ink">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,_rgba(10,165,157,0.18),_transparent_32%),radial-gradient(circle_at_top_right,_rgba(218,87,54,0.16),_transparent_28%),linear-gradient(180deg,_rgba(255,255,255,0.96),_rgba(248,244,236,0.94))]" />
      <div className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-[28rem] bg-[linear-gradient(115deg,rgba(4,27,38,0.06),transparent_50%,rgba(218,87,54,0.1))]" />
      <header className="border-b border-ink/8 bg-white/70 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-5 py-5 lg:px-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-3">
              <Link href="/" className="inline-flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.3em] text-ink">
                <span className="inline-flex size-10 items-center justify-center rounded-full bg-ink text-paper">K</span>
                KenMatch
              </Link>
              <p className="max-w-3xl text-sm text-ink/72">
                Democratized allocation of sustained frontier compute through merit-weighted proposals, quadratic voice,
                transparent checkpoints, and a safety council that can explain every block.
              </p>
            </div>
            <div className="flex flex-col gap-4 lg:items-end">
              <ProfileSwitcher profiles={profiles} activeProfileId={activeProfile.id} />
              <div className="rounded-[1.5rem] border border-ink/10 bg-white/80 px-4 py-3 text-sm text-ink/80 shadow-soft">
                <div className="font-display text-base font-semibold text-ink">{activeProfile.name}</div>
                <div>{activeProfile.role}</div>
                <div className="mt-2 font-mono text-xs uppercase tracking-[0.22em] text-ink/55">
                  {activeProfile.availableCredits} / {activeProfile.voiceCredits} voice credits free
                </div>
              </div>
            </div>
          </div>
          <nav className="flex flex-wrap gap-3">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-full border border-ink/10 bg-white/70 px-4 py-2 text-sm font-medium text-ink transition hover:border-teal hover:text-teal"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl px-5 py-10 lg:px-8">{children}</main>
      <footer className="border-t border-ink/8 bg-ink text-paper/75">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-5 py-8 text-sm lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <p>Prototype implementation: proposal intake, quadratic voice, tier allocation, transparent governance logs.</p>
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-paper/45">Months / Weeks / Days · earned voice, not purchased influence</p>
        </div>
      </footer>
    </div>
  );
}