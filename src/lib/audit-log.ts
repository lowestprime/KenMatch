import type { AuditLogRecord } from "./types.ts";

export const AUDIT_PAGE_SIZES = [10, 25, 50] as const;
export const DEFAULT_AUDIT_PAGE_SIZE = 25;
export const MAX_INLINE_AUDIT_DETAIL_LENGTH = 420;

export interface AuditLogFilters {
  query: string;
  action: string;
  page: number;
  pageSize: number;
}

export interface AuditLogPage {
  items: AuditLogRecord[];
  actions: string[];
  filters: AuditLogFilters;
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export function normalizeAuditLogFilters(input: {
  query?: string;
  action?: string;
  page?: number | string;
  pageSize?: number | string;
}): AuditLogFilters {
  const parsedPage = typeof input.page === "number" ? input.page : Number.parseInt(input.page ?? "", 10);
  const parsedPageSize = typeof input.pageSize === "number" ? input.pageSize : Number.parseInt(input.pageSize ?? "", 10);
  return {
    query: (input.query ?? "").trim().slice(0, 160),
    action: (input.action ?? "").trim().slice(0, 80) || "all",
    page: Number.isSafeInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1,
    pageSize: AUDIT_PAGE_SIZES.includes(parsedPageSize as (typeof AUDIT_PAGE_SIZES)[number])
      ? parsedPageSize
      : DEFAULT_AUDIT_PAGE_SIZE,
  };
}

export function escapeAuditLikePattern(value: string) {
  return value.replaceAll("!", "!!").replaceAll("%", "!%").replaceAll("_", "!_");
}

const secretKeyPattern = /^(?:api[-_]?key|authorization|cookie|credential|pass|password|secret|session|token)$/i;
const emailPattern = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;

export function redactAuditText(value: string) {
  return value
    .replace(emailPattern, "[email]")
    .replace(/\bBearer\s+[A-Z0-9._~+/-]+=*/gi, "Bearer [redacted]");
}

export function summarizeAuditDetail(value: string) {
  const redacted = redactAuditText(value);
  if (redacted.length <= MAX_INLINE_AUDIT_DETAIL_LENGTH) {
    return { collapsed: false, preview: redacted, full: redacted };
  }
  return {
    collapsed: true,
    preview: `${redacted.slice(0, MAX_INLINE_AUDIT_DETAIL_LENGTH).trimEnd()}…`,
    full: redacted,
  };
}

function redactStructuredValue(value: unknown, key = ""): unknown {
  if (secretKeyPattern.test(key)) return "[redacted]";
  if (typeof value === "string") return redactAuditText(value);
  if (Array.isArray(value)) return value.map((item) => redactStructuredValue(item));
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([childKey, childValue]) => [
        childKey,
        redactStructuredValue(childValue, childKey),
      ]),
    );
  }
  return value;
}

export function redactAuditMetadata(value: string | null) {
  if (!value) return "";
  try {
    return JSON.stringify(redactStructuredValue(JSON.parse(value)));
  } catch {
    return value
      .replace(
        /("?(?:api[-_]?key|authorization|cookie|credential|pass|password|secret|session|token)"?\s*:\s*)("(?:\\.|[^"])*"|[^,}\r\n]+)/gi,
        '$1"[redacted]"',
      )
      .replace(emailPattern, "[email]");
  }
}

export function formatAuditMetadata(value: string | null) {
  const redacted = redactAuditMetadata(value);
  if (!redacted) return "";
  try {
    return JSON.stringify(JSON.parse(redacted), null, 2);
  } catch {
    return redacted;
  }
}
