export const ANALYTICS_RANGE_OPTIONS = [7, 30, 90, 365] as const;
export const ANALYTICS_BUCKET_OPTIONS = ["day", "week", "month"] as const;
export const VISITOR_ANALYTICS_RETENTION_DAYS = 400;

export type AnalyticsRangeDays = (typeof ANALYTICS_RANGE_OPTIONS)[number];
export type AnalyticsBucket = (typeof ANALYTICS_BUCKET_OPTIONS)[number];

export interface AnalyticsPeriod {
  startDate: string;
  endDate: string;
  previousStartDate: string;
  previousEndDate: string;
}

export interface AnalyticsPoint {
  key: string;
  label: string;
  uniqueVisitors: number;
  pageViews: number;
  newAccounts: number;
  firstTimeVisitors: number;
  returningVisitors: number;
  unknownCountryVisitors: number;
  notificationsSent: number;
  notificationsFailed: number;
  notificationsSkipped: number;
}

export interface AnalyticsSummaryValues {
  uniqueVisitors: number;
  pageViews: number;
  newAccounts: number;
  countries: number;
  firstTimeVisitors: number;
  returningVisitors: number;
  unknownCountryVisitors: number;
}

export interface AnalyticsCountryRow {
  countryCode: string;
  countryName: string;
  currentVisitors: number;
  previousVisitors: number;
  pageViews: number;
  share: number;
  lastSeenAt: string | null;
}

export interface NotificationHealth {
  sent: number;
  failed: number;
  skipped: number;
  previousSent: number;
  previousFailed: number;
  previousSkipped: number;
  latestAt: string | null;
}

export interface AdminHistoricalAnalytics {
  filters: {
    rangeDays: AnalyticsRangeDays;
    bucket: AnalyticsBucket;
  };
  period: AnalyticsPeriod;
  points: AnalyticsPoint[];
  current: AnalyticsSummaryValues;
  previous: AnalyticsSummaryValues;
  countries: AnalyticsCountryRow[];
  notificationHealth: NotificationHealth;
  telemetry: {
    collectionStartedAt: string | null;
    latestActivityAt: string | null;
    retainedDays: number;
    hasPreUpgradeGap: boolean;
  };
}

export function normalizeAnalyticsFilters(input: {
  rangeDays?: number | string;
  bucket?: string;
}) {
  const parsedRange = typeof input.rangeDays === "number"
    ? input.rangeDays
    : Number.parseInt(input.rangeDays ?? "", 10);
  const rangeDays = ANALYTICS_RANGE_OPTIONS.includes(parsedRange as AnalyticsRangeDays)
    ? parsedRange as AnalyticsRangeDays
    : 30;
  const defaultBucket: AnalyticsBucket = rangeDays <= 30 ? "day" : rangeDays <= 90 ? "week" : "month";
  const bucket = ANALYTICS_BUCKET_OPTIONS.includes(input.bucket as AnalyticsBucket)
    ? input.bucket as AnalyticsBucket
    : defaultBucket;
  return { rangeDays, bucket };
}

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function utcDate(value: string | Date) {
  if (value instanceof Date) {
    return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
  }
  return new Date(`${value.slice(0, 10)}T00:00:00.000Z`);
}

function addUtcDays(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function startOfUtcWeek(date: Date) {
  const day = date.getUTCDay();
  return addUtcDays(date, -((day + 6) % 7));
}

function startOfUtcMonth(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

export function analyticsPeriod(rangeDays: AnalyticsRangeDays, now = new Date()): AnalyticsPeriod {
  const end = utcDate(now);
  const start = addUtcDays(end, -(rangeDays - 1));
  const previousEnd = addUtcDays(start, -1);
  const previousStart = addUtcDays(previousEnd, -(rangeDays - 1));
  return {
    startDate: isoDate(start),
    endDate: isoDate(end),
    previousStartDate: isoDate(previousStart),
    previousEndDate: isoDate(previousEnd),
  };
}

function formatBucketLabel(date: Date, bucket: AnalyticsBucket) {
  if (bucket === "day") {
    return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", timeZone: "UTC" }).format(date);
  }
  if (bucket === "week") {
    return `Week of ${new Intl.DateTimeFormat("en", { month: "short", day: "numeric", timeZone: "UTC" }).format(date)}`;
  }
  return new Intl.DateTimeFormat("en", { month: "short", year: "numeric", timeZone: "UTC" }).format(date);
}

export function buildAnalyticsBuckets(period: Pick<AnalyticsPeriod, "startDate" | "endDate">, bucket: AnalyticsBucket) {
  const end = utcDate(period.endDate);
  let cursor = utcDate(period.startDate);
  if (bucket === "week") cursor = startOfUtcWeek(cursor);
  if (bucket === "month") cursor = startOfUtcMonth(cursor);

  const buckets: Array<{ key: string; label: string }> = [];
  while (cursor <= end) {
    buckets.push({ key: isoDate(cursor), label: formatBucketLabel(cursor, bucket) });
    if (bucket === "day") cursor = addUtcDays(cursor, 1);
    else if (bucket === "week") cursor = addUtcDays(cursor, 7);
    else cursor = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1, 1));
  }
  return buckets;
}

export function comparisonPercent(current: number, previous: number) {
  if (previous === 0) return current === 0 ? 0 : null;
  return ((current - previous) / previous) * 100;
}

export function analyticsBucketSql(column: string, bucket: AnalyticsBucket) {
  if (!/^[A-Za-z0-9_.()]+$/.test(column)) {
    throw new Error("Unsafe analytics column expression.");
  }
  if (bucket === "day") return column;
  if (bucket === "week") {
    return `date(${column}, printf('-%d days', (CAST(strftime('%w', ${column}) AS INTEGER) + 6) % 7))`;
  }
  return `substr(${column}, 1, 7) || '-01'`;
}
