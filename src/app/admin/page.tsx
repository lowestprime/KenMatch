import Link from "next/link";
import { redirect } from "next/navigation";

import { AdminAccounts } from "@/components/admin/accounts";
import { AdminAuditFeed } from "@/components/admin/audit-feed";
import { AdminCategoryProposals } from "@/components/admin/category-proposals";
import { AdminCategoryVisuals } from "@/components/admin/category-visuals";
import { AdminKenSubmissions } from "@/components/admin/ken-submissions";
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
import { listCategoryVisualSettings } from "@/lib/category-visual-settings";
import {
  getAdminDashboard,
  getAdminNotificationSettings,
  listAuditLogPage,
  listCategoriesForReview,
  listCategoryProposalQueue,
  listKenSubmissionQueue,
  listReviewEventsForQueue,
} from "@/lib/db";
import { getViewerSession } from "@/lib/session";
import { categoryProposalStatuses, kenSubmissionStatuses } from "@/lib/types";

export const metadata = { title: "Admin" };

type AdminSearchParams = Record<string, string | string[] | undefined>;

function paramValue(params: AdminSearchParams, key: string) {
  const value = params[key];
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export default async function AdminPage({ searchParams }: { searchParams: Promise<AdminSearchParams> }) {
  const viewer = await getViewerSession();
  if (!viewer) redirect("/auth");
  if (viewer.account.systemRole !== "owner" && viewer.account.systemRole !== "admin" && viewer.account.systemRole !== "moderator") {
    redirect("/");
  }

  const params = await searchParams;
  const scalarParams = Object.fromEntries(
    Object.entries(params).flatMap(([key, value]) => {
      const scalar = Array.isArray(value) ? value[0] : value;
      return scalar === undefined ? [] : [[key, scalar]];
    }),
  );
  const categoryFilters = {
    status: paramValue(params, "categoryStatus") || "pending",
    assignee: paramValue(params, "categoryAssignee") || "all",
    query: paramValue(params, "categoryQ"),
    page: Number(paramValue(params, "categoryPage")) || 1,
    pageSize: 10,
  };
  const kenFilters = {
    status: paramValue(params, "kenStatus") || "pending",
    assignee: paramValue(params, "kenAssignee") || "all",
    query: paramValue(params, "kenQ"),
    page: Number(paramValue(params, "kenPage")) || 1,
    pageSize: 10,
  };
  const [dashboard, notifications, categoryVisuals, categoryQueue, kenQueue, categories, auditPage] = await Promise.all([
    getAdminDashboard(),
    getAdminNotificationSettings(),
    listCategoryVisualSettings(),
    listCategoryProposalQueue(categoryFilters),
    listKenSubmissionQueue(kenFilters),
    listCategoriesForReview(),
    listAuditLogPage({
      query: paramValue(params, "auditQ"),
      action: paramValue(params, "auditAction"),
      page: paramValue(params, "auditPage"),
      pageSize: paramValue(params, "auditPageSize"),
    }),
  ]);
  const [categoryEvents, kenEvents] = await Promise.all([
    listReviewEventsForQueue("category-proposal", categoryQueue.items.map((item) => item.id)),
    listReviewEventsForQueue("ken-submission", kenQueue.items.map((item) => item.id)),
  ]);

  const isOwner = viewer.account.systemRole === "owner";
  const isAdmin = isOwner || viewer.account.systemRole === "admin";
  const canEditAccounts = isOwner;
  const canModerate = true;
  const profileById = new Map(dashboard.profiles.map((profile) => [profile.id, profile]));
  const reviewers = dashboard.accounts
    .filter((account) => ["owner", "admin", "moderator"].includes(account.systemRole))
    .map((account) => ({
      id: account.id,
      label: profileById.get(account.profileId)?.name ?? account.email,
      role: account.systemRole,
    }));

  return (
    <div className="page-stack">
      <section className="panel hero-panel">
        <span className="eyebrow">Admin portal</span>
        <h1>KenMatch operations</h1>
        <p style={{ color: "var(--ink-muted)", maxWidth: "42rem" }}>
          Manage accounts, verifications, visitors, notifications, category proposals, category symbols, and public content from one audited surface. Changes are written to the database and reflected in the public site after revalidation.
        </p>
        <div className="profile-hero-meta">
          <span className={`role-badge is-${viewer.account.systemRole}`}>{viewer.account.systemRole}</span>
          <span>· {dashboard.accounts.length} accounts</span>
          <span>· {dashboard.profiles.length} profiles</span>
          <span>· {dashboard.pendingVerifications.length} pending verifications</span>
          <span>· {categoryQueue.counts.pending ?? 0} pending category proposals</span>
          <span>· {kenQueue.counts.pending ?? 0} pending Ken submissions</span>
          <span>· {categoryVisuals.filter((item) => item.updatedAt).length} custom category visuals</span>
          <span>· {dashboard.visitors.length} unique visitors tracked</span>
          <span>· maintenance {dashboard.maintenance.mode}</span>
        </div>
      </section>

      {isAdmin ? <>
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
      </> : null}

      {isAdmin ? <>
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
      </> : null}

      {isAdmin ? (
        <section className="panel grid gap-3">
          <h2>Category visual system</h2>
          <p style={{ color: "var(--muted)" }}>
            Customize the deterministic category symbols that render across Ken cards, filters, and public overview sections. Color values are persisted in the database, applied as public CSS overrides, and can be revised without changing static assets.
          </p>
          <AdminCategoryVisuals items={categoryVisuals} />
        </section>
      ) : null}

      {isAdmin ? (
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
        <section id="ken-submissions" className="panel grid gap-3 scroll-mt-28">
          <div>
            <h2>Submitted Ken review queue</h2>
            <p style={{ color: "var(--muted)" }}>
              Deterministic readiness checks are advisory. Moderators can triage, assign, recuse, request revision, and hold; only admins or the owner can publish, merge, or reject.
            </p>
          </div>
          <ReviewQueueControls
            prefix="ken"
            statuses={kenSubmissionStatuses}
            filters={kenFilters}
            reviewers={reviewers}
            params={params}
            anchor="ken-submissions"
          />
          <AdminKenSubmissions
            items={kenQueue.items}
            reviewers={reviewers}
            publicTasks={dashboard.tasks}
            eventsByEntity={kenEvents}
            currentAccountId={viewer.account.id}
            currentRole={viewer.account.systemRole}
          />
          <ReviewPagination
            prefix="ken"
            page={kenQueue.page}
            totalPages={kenQueue.totalPages}
            totalItems={kenQueue.totalItems}
            params={params}
            anchor="ken-submissions"
          />
        </section>
      ) : null}

      {canModerate ? (
        <section id="category-proposals" className="panel grid gap-3 scroll-mt-28">
          <h2>Category proposals</h2>
          <p style={{ color: "var(--muted)" }}>
            Review user-proposed categories with normalized collision checks, advisory similarity hints, durable decisions, and deterministic fallback visuals.
          </p>
          <ReviewQueueControls
            prefix="category"
            statuses={categoryProposalStatuses}
            filters={categoryFilters}
            reviewers={reviewers}
            params={params}
            anchor="category-proposals"
          />
          <AdminCategoryProposals
            items={categoryQueue.items}
            reviewers={reviewers}
            categories={categories}
            eventsByEntity={categoryEvents}
            currentAccountId={viewer.account.id}
            currentRole={viewer.account.systemRole}
          />
          <ReviewPagination
            prefix="category"
            page={categoryQueue.page}
            totalPages={categoryQueue.totalPages}
            totalItems={categoryQueue.totalItems}
            params={params}
            anchor="category-proposals"
          />
        </section>
      ) : null}

      {isAdmin ? <>
        <section className="panel grid gap-3 admin-compact-panel">
          <h2>Unique visitors</h2>
          <AdminVisitors visitors={dashboard.visitors.slice(0, 32)} stats={dashboard.visitorStats} />
        </section>
        <section id="audit-log" className="panel grid gap-3 scroll-mt-28">
          <h2>Audit log</h2>
          <AdminAuditFeed data={auditPage} params={scalarParams} />
        </section>
      </> : null}

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

function ReviewQueueControls({
  prefix,
  statuses,
  filters,
  reviewers,
  params,
  anchor,
}: {
  prefix: "category" | "ken";
  statuses: readonly string[];
  filters: { status: string; assignee: string; query: string };
  reviewers: Array<{ id: string; label: string; role: string }>;
  params: AdminSearchParams;
  anchor: string;
}) {
  const otherPrefix = prefix === "category" ? "ken" : "category";
  return (
    <form className="review-queue-toolbar" action={`/admin#${anchor}`}>
      {Object.entries(params).map(([key, value]) => {
        if (!key.startsWith(otherPrefix) || Array.isArray(value) || value === undefined) return null;
        return <input key={key} type="hidden" name={key} value={value} />;
      })}
      <label className="field-label">
        <span>Status</span>
        <select className="field" name={`${prefix}Status`} defaultValue={filters.status}>
          <option value="all">All statuses</option>
          {statuses.map((status) => <option key={status} value={status}>{status.replaceAll("-", " ")}</option>)}
        </select>
      </label>
      <label className="field-label">
        <span>Assignee</span>
        <select className="field" name={`${prefix}Assignee`} defaultValue={filters.assignee}>
          <option value="all">All reviewers</option>
          <option value="unassigned">Unassigned</option>
          {reviewers.map((reviewer) => <option key={reviewer.id} value={reviewer.id}>{reviewer.label}</option>)}
        </select>
      </label>
      <label className="field-label">
        <span>Search queue</span>
        <input className="field" type="search" name={`${prefix}Q`} defaultValue={filters.query} placeholder="Title, summary, public benefit" />
      </label>
      <button className="cta-secondary cta-compact" type="submit">Apply queue filters</button>
      <Link className="cta-secondary cta-compact" href={`/admin?${otherQueueParams(params, otherPrefix)}#${anchor}`}>Reset this queue</Link>
    </form>
  );
}

function otherQueueParams(params: AdminSearchParams, prefix: string) {
  const next = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (!key.startsWith(prefix) || Array.isArray(value) || value === undefined || value === "") continue;
    next.set(key, value);
  }
  return next.toString();
}

function ReviewPagination({
  prefix,
  page,
  totalPages,
  totalItems,
  params,
  anchor,
}: {
  prefix: "category" | "ken";
  page: number;
  totalPages: number;
  totalItems: number;
  params: AdminSearchParams;
  anchor: string;
}) {
  const href = (target: number) => {
    const next = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (Array.isArray(value) || value === undefined || value === "") continue;
      next.set(key, value);
    }
    next.set(`${prefix}Page`, String(target));
    return `/admin?${next.toString()}#${anchor}`;
  };
  return (
    <nav className="review-pagination" aria-label={`${prefix} review queue pages`}>
      <span>{totalItems} records · page {page} of {totalPages}</span>
      <div>
        {page > 1 ? <Link className="cta-secondary cta-compact" href={href(page - 1)}>Previous</Link> : null}
        {page < totalPages ? <Link className="cta-secondary cta-compact" href={href(page + 1)}>Next</Link> : null}
      </div>
    </nav>
  );
}
