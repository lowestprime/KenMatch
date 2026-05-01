import Link from "next/link";
import { redirect } from "next/navigation";

import { AdminAccounts } from "@/components/admin/accounts";
import { AdminAuditFeed } from "@/components/admin/audit-feed";
import { AdminCategoryProposals } from "@/components/admin/category-proposals";
import { AdminNotifications } from "@/components/admin/notifications";
import {
  AdminChangelogPanel,
  AdminIllustrationPanel,
  AdminMaintenancePanel,
  AdminSmtpPanel,
} from "@/components/admin/operations";
import { AdminVerifications } from "@/components/admin/verifications";
import { AdminVisitors } from "@/components/admin/visitors";
import { VisitorMap } from "@/components/visitor-map";
import { getAdminDashboard, getAdminNotificationSettings } from "@/lib/db";
import { getViewerSession } from "@/lib/session";

export const metadata = { title: "Admin" };

export default async function AdminPage() {
  const viewer = await getViewerSession();
  if (!viewer) redirect("/auth");
  if (viewer.account.systemRole !== "owner" && viewer.account.systemRole !== "admin" && viewer.account.systemRole !== "moderator") {
    redirect("/");
  }

  const [dashboard, notifications] = await Promise.all([
    getAdminDashboard(),
    getAdminNotificationSettings(),
  ]);

  const isOwner = viewer.account.systemRole === "owner";
  const canEditAccounts = isOwner;
  const canModerate = true;

  return (
    <div className="page-stack">
      <section className="panel hero-panel">
        <span className="eyebrow">Admin portal</span>
        <h1>KenMatch operations</h1>
        <p style={{ color: "var(--ink-muted)", maxWidth: "42rem" }}>
          Manage accounts, verifications, visitors, notifications, category proposals, and public content from one audited surface. Changes are written to the database and reflected in the public site after revalidation.
        </p>
        <div className="profile-hero-meta">
          <span className={`role-badge is-${viewer.account.systemRole}`}>{viewer.account.systemRole}</span>
          <span>· {dashboard.accounts.length} accounts</span>
          <span>· {dashboard.profiles.length} profiles</span>
          <span>· {dashboard.pendingVerifications.length} pending verifications</span>
          <span>· {dashboard.categoryProposals.filter((item) => item.reviewStatus === "pending").length} category proposals</span>
          <span>· {dashboard.visitors.length} unique visitors tracked</span>
          <span>· maintenance {dashboard.maintenance.mode}</span>
        </div>
      </section>

      <section className="section-grid" data-columns="2">
        <div className="panel grid gap-3">
          <h2>Visitor map</h2>
          <p style={{ color: "var(--muted)" }}>
            Approximate country-level traffic from Cloudflare geolocation headers. Visitor IDs are salted hashes; the map is for operating awareness, not personal tracking.
          </p>
          <VisitorMap aggregates={dashboard.countryAggregates} stats={dashboard.visitorStats} />
        </div>
        <div className="panel grid gap-3">
          <h2>Notifications</h2>
          <p style={{ color: "var(--muted)" }}>
            Send email alerts when new accounts are created, new visitors arrive, verifications are requested, or Kens are submitted.
          </p>
          <AdminNotifications settings={notifications} smtp={dashboard.smtp} />
        </div>
      </section>

      <section className="section-grid" data-columns="2">
        <div className="panel grid gap-3">
          <h2>Maintenance mode</h2>
          <p style={{ color: "var(--muted)" }}>
            Pause public writes and show a clean public maintenance page while keeping admin recovery, auth, health, and assets reachable.
          </p>
          <AdminMaintenancePanel maintenance={dashboard.maintenance} />
        </div>
        <div className="panel grid gap-3">
          <h2>SMTP configuration</h2>
          <p style={{ color: "var(--muted)" }}>
            Environment SMTP remains authoritative. Owner-managed database SMTP is available only when env SMTP is absent and secrets can be encrypted at rest.
          </p>
          <AdminSmtpPanel smtp={dashboard.smtp} isOwner={isOwner} />
        </div>
      </section>

      <section className="section-grid" data-columns="2">
        <div className="panel grid gap-3">
          <h2>Changelog</h2>
          <p style={{ color: "var(--muted)" }}>
            Publish compact release notes so public users can tell what changed without reading commits or deployment logs.
          </p>
          <AdminChangelogPanel entries={dashboard.changelog} />
        </div>
        <div className="panel grid gap-3">
          <h2>Ken illustrations</h2>
          <p style={{ color: "var(--muted)" }}>
            Admin-uploaded Ken images are optional and persist in the data volume. Kens without uploaded art use the public category/lane symbol.
          </p>
          <AdminIllustrationPanel tasks={dashboard.tasks} illustrations={dashboard.illustrations} />
        </div>
      </section>

      {canModerate ? (
        <section className="panel grid gap-3">
          <h2>Verification queue</h2>
          <p style={{ color: "var(--muted)" }}>
            Review pending identity verification requests. Approvals grant a visible badge and unlock additional participation.
          </p>
          <AdminVerifications items={dashboard.pendingVerifications} />
        </section>
      ) : null}

      {canEditAccounts ? (
        <section className="panel grid gap-3">
          <h2>Accounts & roles</h2>
          <p style={{ color: "var(--muted)" }}>
            Only the owner can change system roles. Admins can moderate profiles but cannot promote accounts.
          </p>
          <AdminAccounts
            accounts={dashboard.accounts}
            profiles={dashboard.profiles}
            currentAccountId={viewer.account.id}
          />
        </section>
      ) : null}

      {canModerate ? (
        <section className="panel grid gap-3">
          <h2>Category proposals</h2>
          <p style={{ color: "var(--muted)" }}>
            Review user-proposed categories. Approval creates a public category that appears in filters and new Ken submission.
          </p>
          <AdminCategoryProposals items={dashboard.categoryProposals} />
        </section>
      ) : null}

      <section className="section-grid" data-columns="2">
        <div className="panel grid gap-3 admin-compact-panel">
          <h2>Unique visitors</h2>
          <AdminVisitors visitors={dashboard.visitors.slice(0, 32)} stats={dashboard.visitorStats} />
        </div>
        <div className="panel grid gap-3 admin-compact-panel">
          <h2>Audit log</h2>
          <AdminAuditFeed entries={dashboard.recentAudit} />
        </div>
      </section>

      <section className="panel grid gap-3">
        <h2>Quick links</h2>
        <div className="hero-actions">
          <Link className="cta-secondary cta-compact" href="/about">
            Edit About / Contact
          </Link>
          <Link className="cta-secondary cta-compact" href="/submit">
            Submit a Ken
          </Link>
        </div>
      </section>
    </div>
  );
}
