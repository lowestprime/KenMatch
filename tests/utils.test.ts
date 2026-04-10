import assert from "node:assert/strict";
import test from "node:test";

import {
  formatDate,
  formatDateTime,
  describeRelativeTime,
  describeCountdown,
  describeElapsedSince,
  progressPercent,
  remainingHours,
  formatHoursToHuman,
  compactWords,
} from "../src/lib/utils.ts";

test("formatDate returns TBD for null, undefined, and invalid strings", () => {
  assert.equal(formatDate(null), "TBD");
  assert.equal(formatDate(undefined), "TBD");
  assert.equal(formatDate(""), "TBD");
  assert.equal(formatDate("not-a-date"), "TBD");
});

test("formatDate formats valid ISO strings", () => {
  const result = formatDate("2026-04-10T12:00:00.000Z");
  assert.ok(result.includes("2026"), `expected year in "${result}"`);
  assert.ok(result.includes("Apr") || result.includes("10"), `expected month or day in "${result}"`);
});

test("formatDateTime returns TBD for invalid dates", () => {
  assert.equal(formatDateTime(null), "TBD");
  assert.equal(formatDateTime("garbage"), "TBD");
});

test("describeRelativeTime handles null and invalid gracefully", () => {
  assert.equal(describeRelativeTime(null), "TBD");
  assert.equal(describeRelativeTime("bad-date"), "TBD");
});

test("describeRelativeTime returns past tense for past dates", () => {
  const ref = new Date("2026-04-10T12:00:00.000Z");
  const result = describeRelativeTime("2026-04-09T12:00:00.000Z", ref);
  assert.ok(result.includes("ago"), `expected 'ago' in "${result}"`);
});

test("describeCountdown handles null and invalid", () => {
  assert.equal(describeCountdown(null), "Launch timing pending");
  assert.equal(describeCountdown("invalid"), "Launch timing pending");
});

test("describeElapsedSince handles null and invalid", () => {
  assert.equal(describeElapsedSince(null), "Not started");
  assert.equal(describeElapsedSince("bad"), "Not started");
});

test("progressPercent returns 0 for missing or invalid inputs", () => {
  assert.equal(progressPercent(null, null), 0);
  assert.equal(progressPercent("bad", "also-bad"), 0);
  assert.equal(progressPercent("2026-01-01", null), 0);
});

test("progressPercent computes correctly for valid range", () => {
  const start = "2026-01-01T00:00:00.000Z";
  const end = "2026-01-11T00:00:00.000Z";
  const mid = new Date("2026-01-06T00:00:00.000Z");
  assert.equal(progressPercent(start, end, mid), 50);
});

test("remainingHours returns null for missing or invalid input", () => {
  assert.equal(remainingHours(null), null);
  assert.equal(remainingHours("invalid-date"), null);
});

test("formatHoursToHuman converts correctly", () => {
  assert.equal(formatHoursToHuman(2), "2 hours");
  assert.equal(formatHoursToHuman(48), "2 days");
  assert.equal(formatHoursToHuman(336), "2 weeks");
});

test("compactWords truncates long strings with ellipsis", () => {
  assert.equal(compactWords("short"), "short");
  const long = "a".repeat(200);
  const result = compactWords(long, 180);
  assert.equal(result.length, 183);
  assert.ok(result.endsWith("..."));
});
