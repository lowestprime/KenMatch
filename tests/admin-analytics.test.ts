import assert from "node:assert/strict";
import test from "node:test";

import {
  analyticsBucketSql,
  analyticsPeriod,
  buildAnalyticsBuckets,
  comparisonPercent,
  normalizeAnalyticsFilters,
} from "../src/lib/admin-analytics.ts";

test("analytics filters select defensible range and bucket defaults", () => {
  assert.deepEqual(normalizeAnalyticsFilters({}), { rangeDays: 30, bucket: "day" });
  assert.deepEqual(normalizeAnalyticsFilters({ rangeDays: "90" }), { rangeDays: 90, bucket: "week" });
  assert.deepEqual(normalizeAnalyticsFilters({ rangeDays: "365" }), { rangeDays: 365, bucket: "month" });
  assert.deepEqual(normalizeAnalyticsFilters({ rangeDays: "7", bucket: "month" }), { rangeDays: 7, bucket: "month" });
  assert.deepEqual(normalizeAnalyticsFilters({ rangeDays: "14", bucket: "hour" }), { rangeDays: 30, bucket: "day" });
});

test("analytics periods use inclusive UTC dates and equal previous windows", () => {
  assert.deepEqual(analyticsPeriod(7, new Date("2026-07-28T23:59:00.000Z")), {
    startDate: "2026-07-22",
    endDate: "2026-07-28",
    previousStartDate: "2026-07-15",
    previousEndDate: "2026-07-21",
  });
});

test("analytics bucket generation is stable across day, week, and month views", () => {
  const period = { startDate: "2026-07-22", endDate: "2026-07-28" };
  assert.equal(buildAnalyticsBuckets(period, "day").length, 7);
  assert.deepEqual(buildAnalyticsBuckets(period, "week").map((item) => item.key), ["2026-07-20", "2026-07-27"]);
  assert.deepEqual(buildAnalyticsBuckets(period, "month").map((item) => item.key), ["2026-07-01"]);
  assert.match(analyticsBucketSql("day", "week"), /strftime/);
  assert.throws(() => analyticsBucketSql("day; DROP TABLE visitors", "day"), /Unsafe/);
});

test("comparison percentages distinguish no baseline from no change", () => {
  assert.equal(comparisonPercent(0, 0), 0);
  assert.equal(comparisonPercent(15, 10), 50);
  assert.equal(comparisonPercent(5, 10), -50);
  assert.equal(comparisonPercent(3, 0), null);
});
