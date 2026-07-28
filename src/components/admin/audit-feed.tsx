import Link from "next/link";

import { CopyTextButton } from "@/components/copy-text-button";
import {
  AUDIT_PAGE_SIZES,
  formatAuditMetadata,
  summarizeAuditDetail,
  type AuditLogPage,
} from "@/lib/audit-log";

function formatWhen(iso: string) {
  try {
    return new Intl.DateTimeFormat("en", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "UTC",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function buildHref(params: Record<string, string>, updates: Record<string, string | null>) {
  const next = new URLSearchParams(params);
  for (const [key, value] of Object.entries(updates)) {
    if (!value) next.delete(key);
    else next.set(key, value);
  }
  const query = next.toString();
  return `/admin${query ? `?${query}` : ""}#audit-log`;
}

export function AdminAuditFeed({
  data,
  params,
}: {
  data: AuditLogPage;
  params: Record<string, string>;
}) {
  const preservedParams = Object.entries(params).filter(([key]) => !key.startsWith("audit"));
  return (
    <div className="grid gap-3">
      <form className="admin-filter-row" action="/admin#audit-log">
        {preservedParams.map(([key, value]) => <input key={key} type="hidden" name={key} value={value} />)}
        <label className="field-label">
          <span>Search events</span>
          <input
            className="field"
            type="search"
            name="auditQ"
            defaultValue={data.filters.query}
            placeholder="Action, detail, or metadata"
          />
        </label>
        <label className="field-label">
          <span>Action</span>
          <select className="field" name="auditAction" defaultValue={data.filters.action}>
            <option value="all">All actions</option>
            {data.actions.map((action) => <option key={action} value={action}>{action}</option>)}
          </select>
        </label>
        <label className="field-label">
          <span>Rows per page</span>
          <select className="field" name="auditPageSize" defaultValue={data.pageSize}>
            {AUDIT_PAGE_SIZES.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
        <button className="cta-secondary cta-compact" type="submit">Apply audit filters</button>
        <Link
          className="cta-secondary cta-compact"
          href={buildHref(Object.fromEntries(preservedParams), {
            auditQ: null,
            auditAction: null,
            auditPage: null,
            auditPageSize: null,
          })}
        >
          Reset audit filters
        </Link>
      </form>

      {data.items.length === 0 ? (
        <p style={{ color: "var(--muted)" }}>No audit events match these filters.</p>
      ) : (
        <ul className="admin-audit-list">
          {data.items.map((entry) => {
            const metadata = formatAuditMetadata(entry.metadata);
            const detail = summarizeAuditDetail(entry.detail);
            return (
              <li key={entry.id} className="audit-card">
                <div className="audit-card-heading">
                  <strong>{entry.action}</strong>
                  <time dateTime={entry.createdAt}>{formatWhen(entry.createdAt)} UTC</time>
                </div>
                <p className="audit-card-detail">{detail.preview}</p>
                {detail.collapsed ? (
                  <details className="audit-detail-disclosure">
                    <summary>View full event detail</summary>
                    <div className="audit-metadata-toolbar">
                      <CopyTextButton value={detail.full} label="Copy detail" />
                    </div>
                    <pre>{detail.full}</pre>
                  </details>
                ) : null}
                {metadata ? (
                  <details className="audit-metadata">
                    <summary>View redacted metadata</summary>
                    <div className="audit-metadata-toolbar">
                      <CopyTextButton value={metadata} label="Copy metadata" />
                    </div>
                    <pre>{metadata}</pre>
                  </details>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}

      <div className="marketplace-pagination" aria-label="Audit log pages">
        {data.page > 1 ? (
          <Link
            className="cta-secondary cta-compact"
            href={buildHref(params, { auditPage: String(data.page - 1) })}
          >
            Previous
          </Link>
        ) : <span />}
        <span className="marketplace-page-status">
          Page {data.page} of {data.totalPages} · {data.totalItems} events
        </span>
        {data.page < data.totalPages ? (
          <Link
            className="cta-secondary cta-compact"
            href={buildHref(params, { auditPage: String(data.page + 1) })}
          >
            Next
          </Link>
        ) : <span />}
      </div>
      <p className="text-xs" style={{ color: "var(--muted)" }}>
        Secret-bearing fields and email addresses are redacted at the server boundary. Long event bodies and metadata remain complete, expandable, and copyable.
      </p>
    </div>
  );
}
