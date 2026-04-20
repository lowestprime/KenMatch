import Link from "next/link";
import { notFound } from "next/navigation";

import { Avatar } from "@/components/avatar";
import { getProfilePageData, listProfiles } from "@/lib/db";
import { getViewerSession } from "@/lib/session";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const profiles = await listProfiles();
  const profile = profiles.find((p) => p.id === slug || p.name === slug);
  if (!profile) return { title: "Contributor" };
  return { title: `${profile.name} · KenMatch`, description: profile.bio };
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const profiles = await listProfiles();
  const profile = profiles.find((p) => p.id === slug) ?? profiles.find((p) => p.name.toLowerCase().replace(/\s+/g, "-") === slug);
  if (!profile) notFound();
  const [data, viewer] = await Promise.all([getProfilePageData(profile.id), getViewerSession()]);
  if (!data) notFound();
  const summary = data.summary;
  if (!summary) notFound();
  const isSelf = viewer?.profile.id === summary.id;

  return (
    <div className="page-stack">
      <section className="panel hero-panel">
        <div className="profile-hero">
          <Avatar profile={summary} size={96} />
          <div>
            <span className="eyebrow">Contributor</span>
            <h1>{summary.name}</h1>
            <p style={{ color: "var(--ink-muted)", marginTop: "0.3rem", maxWidth: "42rem" }}>{summary.bio}</p>
            <div className="profile-hero-meta">
              <span className={`verification-badge is-${summary.verificationStatus}`}>
                {summary.verificationStatus === "approved"
                  ? "Verified"
                  : summary.verificationStatus === "pending"
                    ? "Review"
                    : summary.verificationStatus === "rejected"
                      ? "Unverified"
                      : "Provisional"}
              </span>
              <span className="micro-pill">{summary.role}</span>
              <span className="micro-pill">{summary.specialty}</span>
              {summary.location ? <span className="micro-pill">{summary.location}</span> : null}
              {summary.pronouns ? <span className="micro-pill">{summary.pronouns}</span> : null}
            </div>
            {summary.links.length > 0 ? (
              <div className="site-footer-links" style={{ marginTop: "0.6rem" }}>
                {summary.links.map((link) => (
                  <a
                    key={link.url}
                    className="footer-badge"
                    href={link.url}
                    target={link.url.startsWith("http") ? "_blank" : undefined}
                    rel={link.url.startsWith("http") ? "noopener noreferrer" : undefined}
                  >
                    <span>{link.label}</span>
                  </a>
                ))}
              </div>
            ) : null}
            {isSelf ? (
              <div className="hero-actions" style={{ marginTop: "0.7rem" }}>
                <Link className="cta-primary cta-compact" href="/account">
                  Edit profile
                </Link>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="section-grid" data-columns="2">
        <div className="panel grid gap-3">
          <h2>Submitted Kens</h2>
          {data.ownTasks.length === 0 ? (
            <p style={{ color: "var(--muted)" }}>No Kens submitted yet.</p>
          ) : (
            <ul className="grid gap-2">
              {data.ownTasks.map((task) => (
                <li key={task.id} className="audit-card">
                  <Link href={`/kens/${task.slug}`} className="font-display">
                    <strong>{task.title}</strong>
                  </Link>
                  <p style={{ color: "var(--muted)" }}>{task.summary}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="panel grid gap-3">
          <h2>Participation</h2>
          <dl className="grid gap-2">
            <div className="stat-card">
              <dt>Role</dt>
              <dd>{data.accountSystemRole}</dd>
            </div>
            <div className="stat-card">
              <dt>Attestation level</dt>
              <dd>{summary.attestationLevel}</dd>
            </div>
            <div className="stat-card">
              <dt>Participation state</dt>
              <dd>{summary.participationState}</dd>
            </div>
            <div className="stat-card">
              <dt>Credibility</dt>
              <dd>{summary.credibility}</dd>
            </div>
            <div className="stat-card">
              <dt>Voice credits</dt>
              <dd>
                {summary.availableCredits}/{summary.effectiveVoiceCredits} free
              </dd>
            </div>
          </dl>
          {summary.participationNote ? (
            <p className="alert">{summary.participationNote}</p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
