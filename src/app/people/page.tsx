import Link from "next/link";

import { Avatar } from "@/components/avatar";
import { listProfiles } from "@/lib/db";

export const metadata = {
  title: "People",
  description: "Contributors, moderators, and verified researchers shaping KenMatch.",
};

export default async function PeoplePage() {
  const profiles = await listProfiles();
  return (
    <div className="page-stack">
      <section className="panel grid gap-3">
        <span className="eyebrow">Contributor directory</span>
        <h1>People on KenMatch</h1>
        <p style={{ color: "var(--muted)", maxWidth: "48rem" }}>
          Participation is attributable. Browse the contributors working on Kens, governance decisions, and reviews. Verification status, participation policy, and attestation signals are all visible.
        </p>
      </section>
      <section className="section-grid" data-columns="2">
        {profiles.map((profile) => {
          const publicName = profile.showRealName === false && profile.username ? `@${profile.username}` : profile.name;
          return (
          <Link
            key={profile.id}
            href={`/people/${profile.id}`}
            className="panel grid gap-3"
            style={{ textDecoration: "none" }}
          >
            <div className="flex items-center gap-3">
              <Avatar profile={profile} size={58} />
              <div>
                <h3 style={{ marginBottom: "0.15rem" }}>{publicName}</h3>
                <p style={{ color: "var(--muted)", fontSize: "0.86rem" }}>
                  @{profile.username} · {profile.role} · {profile.specialty}
                </p>
              </div>
            </div>
            <p style={{ color: "var(--ink-muted)", fontSize: "0.92rem" }}>{profile.bio}</p>
            <div className="flex flex-wrap gap-2 text-xs" style={{ color: "var(--muted)" }}>
              <span className={`verification-badge is-${profile.verificationStatus ?? "none"}`}>
                {profile.verificationStatus === "approved"
                  ? "Verified"
                  : profile.verificationStatus === "pending"
                    ? "Review"
                    : profile.verificationStatus === "rejected"
                      ? "Unverified"
                      : "Provisional"}
              </span>
              <span className="micro-pill">{profile.attestationLevel ?? "provisional"}</span>
              {profile.location ? <span className="micro-pill">{profile.location}</span> : null}
            </div>
          </Link>
          );
        })}
      </section>
    </div>
  );
}
