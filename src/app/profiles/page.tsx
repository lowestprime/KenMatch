import Link from "next/link";

import { Avatar } from "@/components/avatar";
import { listProfiles } from "@/lib/db";

export const metadata = {
  title: "Profiles",
  description: "Browse public KenMatch contributor profiles, expertise signals, and submitted Kens.",
};

export default async function ProfilesPage() {
  const profiles = await listProfiles();
  const visibleProfiles = profiles
    .filter((profile) => profile.moderationStatus !== "suspended")
    .sort((a, b) => b.credibility - a.credibility || b.effectiveVoiceCredits - a.effectiveVoiceCredits);

  return (
    <div className="page-stack">
      <section className="panel hero-panel">
        <span className="eyebrow">Public profiles</span>
        <h1>Browse the people shaping Kens, reviews, and public allocation signal.</h1>
        <p style={{ color: "var(--ink-muted)", maxWidth: "58rem" }}>
          Profiles make contributor context legible without turning status into the allocator. Use them to inspect expertise, links, verification state, public role, and submitted work before weighing a comment, vote, or Ken proposal.
        </p>
        <div className="hero-actions">
          <Link className="cta-primary" href="/account">Edit your profile</Link>
          <Link className="cta-secondary" href="/faq#profiles-bookmarks">How profiles work</Link>
        </div>
      </section>

      <section className="panel protocol-panel">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Directory</span>
            <h2>{visibleProfiles.length} public contributors</h2>
          </div>
        </div>
        <div className="ecosystem-grid">
          {visibleProfiles.map((profile) => {
            const publicName = profile.showRealName === false && profile.username ? `@${profile.username}` : profile.name;
            return (
              <Link key={profile.id} className="ecosystem-card" href={`/people/${profile.username ?? profile.id}`}>
                <div className="profile-hero" style={{ gap: ".75rem" }}>
                  <Avatar profile={profile} size={54} />
                  <span>
                    <strong>{publicName}</strong>
                    <p>@{profile.username ?? profile.id}</p>
                  </span>
                </div>
                <p>{profile.bio}</p>
                <div className="timing-meta-row">
                  <span className="micro-pill">{profile.specialty}</span>
                  <span className="micro-pill">{profile.attestationLevel}</span>
                  <span className="micro-pill">{profile.verificationStatus}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
