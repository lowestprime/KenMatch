import Link from "next/link";
import { redirect } from "next/navigation";

import { AccountSavedItems } from "@/components/account-saved-items";
import { Avatar } from "@/components/avatar";
import { ProfileEditor } from "@/components/profile-editor";
import { VerificationPanel } from "@/components/verification-panel";
import { getProfilePageData } from "@/lib/db";
import { listSavedDiscussionItems } from "@/lib/discussion-db";
import { getViewerSession } from "@/lib/session";

export const metadata = { title: "Account" };

export default async function AccountPage() {
  const viewer = await getViewerSession();
  if (!viewer) redirect("/auth");
  const [data, savedDiscussion] = await Promise.all([
    getProfilePageData(viewer.profile.id),
    listSavedDiscussionItems(viewer.profile.id),
  ]);
  if (!data) redirect("/auth");

  const { summary } = data;
  if (!summary) redirect("/auth");

  return (
    <div className="page-stack">
      <section className="panel hero-panel">
        <div className="profile-hero">
          <Avatar profile={summary} size={84} />
          <div>
            <span className="eyebrow">Your account</span>
            <h1>{summary.name}</h1>
            <div className="profile-hero-meta">
              <span className={`role-badge is-${viewer.account.systemRole}`}>{viewer.account.systemRole}</span>
              <span>· @{summary.username}</span>
              <span>· {summary.specialty}</span>
              {summary.location ? <span>· {summary.location}</span> : null}
              <span>· {viewer.account.emailVerified ? "Email verified" : "Email unverified"}</span>
            </div>
            <p style={{ color: "var(--ink-muted)", marginTop: "0.4rem" }}>{summary.bio}</p>
          </div>
        </div>
      </section>

      <section className="section-grid" data-columns="2">
        <div className="panel grid gap-3">
          <span className="eyebrow">Profile</span>
          <h2>Identity & presence</h2>
          <p style={{ color: "var(--muted)" }}>
            Update the profile other contributors see across KenMatch. Avatars default to a colored gradient from your brand mark, or you can upload a custom image.
          </p>
          <ProfileEditor
            initial={{
              username: summary.username ?? summary.id,
              showRealName: summary.showRealName,
              name: summary.name,
              role: summary.role,
              specialty: summary.specialty,
              bio: summary.bio,
              location: summary.location,
              pronouns: summary.pronouns,
              avatarImage: summary.avatarImage,
              avatarGradient: summary.avatarGradient,
              avatarImageScale: summary.avatarImageScale,
              avatarImageX: summary.avatarImageX,
              avatarImageY: summary.avatarImageY,
              links: summary.links,
            }}
          />
        </div>
        <div className="panel grid gap-3">
          <span className="eyebrow">Security</span>
          <h2>Email, password, sessions</h2>
          <p style={{ color: "var(--muted)" }}>
            Manage credentials and verification from here. All actions are written to the audit log.
          </p>
          <dl className="grid gap-2 text-sm">
            <div className="stat-card">
              <dt>Email</dt>
              <dd>{viewer.account.email}</dd>
            </div>
            <div className="stat-card">
              <dt>Username</dt>
              <dd>@{viewer.account.username ?? summary.username}</dd>
            </div>
            <div className="stat-card">
              <dt>Email verified</dt>
              <dd>{viewer.account.emailVerified ? "Yes" : "No"}</dd>
            </div>
            <div className="stat-card">
              <dt>Licensing consent</dt>
              <dd>{viewer.account.licensingConsent}</dd>
            </div>
            <div className="stat-card">
              <dt>System role</dt>
              <dd>{viewer.account.systemRole}</dd>
            </div>
          </dl>
          <div className="hero-actions">
            <Link className="cta-secondary cta-compact" href="/forgot-password">
              Change password
            </Link>
            {!viewer.account.emailVerified ? (
              <Link className="cta-secondary cta-compact" href="/auth">
                Resend verification email
              </Link>
            ) : null}
          </div>
        </div>
      </section>

      <section className="panel grid gap-3">
        <VerificationPanel
          status={summary.verificationStatus}
          note={summary.verificationNote}
          requestedAt={summary.verificationRequestedAt}
        />
      </section>

      <section className="panel grid gap-3">
        <h2>My Kens</h2>
        {data.ownTasks.length === 0 ? (
          <p style={{ color: "var(--muted)" }}>
            You haven&apos;t submitted a Ken yet. <Link href="/submit" className="underline">Submit one</Link>.
          </p>
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
      </section>

      <AccountSavedItems kens={data.bookmarkedTasks} discussion={savedDiscussion} />
    </div>
  );
}
