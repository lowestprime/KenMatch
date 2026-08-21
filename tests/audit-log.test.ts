import assert from "node:assert/strict";
import test from "node:test";

import {
  escapeAuditLikePattern,
  formatAuditMetadata,
  normalizeAuditLogFilters,
  redactAuditMetadata,
  redactAuditText,
  summarizeAuditDetail,
} from "../src/lib/audit-log.ts";

test("audit filters normalize bounded queries, pages, and allowed page sizes", () => {
  assert.deepEqual(normalizeAuditLogFilters({}), {
    query: "",
    action: "all",
    page: 1,
    pageSize: 25,
  });
  assert.deepEqual(normalizeAuditLogFilters({
    query: `  ${"a".repeat(200)}  `,
    action: " account.updated ",
    page: "3",
    pageSize: "50",
  }), {
    query: "a".repeat(160),
    action: "account.updated",
    page: 3,
    pageSize: 50,
  });
  assert.equal(normalizeAuditLogFilters({ page: "-2", pageSize: "100" }).page, 1);
  assert.equal(normalizeAuditLogFilters({ page: "-2", pageSize: "100" }).pageSize, 25);
  assert.equal(escapeAuditLikePattern("100%_ready!"), "100!%!_ready!!");
});

test("audit metadata is fully retained while nested secrets and emails are redacted", () => {
  const longBody = "evidence-".repeat(180);
  const source = JSON.stringify({
    token: "do-not-show",
    nested: {
      authorization: "Bearer private",
      owner: "person@example.com",
      body: longBody,
    },
  });
  const redacted = redactAuditMetadata(source);
  assert.doesNotMatch(redacted, /do-not-show|Bearer private|person@example\.com/);
  assert.match(redacted, /\[redacted\]/);
  assert.match(redacted, /\[email\]/);
  assert.ok(redacted.length > 700);
  assert.match(formatAuditMetadata(source), /\n  "nested":/);
  assert.match(redacted, new RegExp(longBody.slice(-80)));
});

test("malformed metadata still receives conservative field and email redaction", () => {
  const redacted = redactAuditMetadata('token: "secret", reply=user@example.com, note=retained');
  assert.doesNotMatch(redacted, /secret|user@example\.com/);
  assert.match(redacted, /\[redacted\]/);
  assert.match(redacted, /\[email\]/);
  assert.match(redacted, /retained/);
});

test("audit detail redaction preserves prose while removing direct identifiers and bearer tokens", () => {
  assert.equal(
    redactAuditText("Signed in admin@example.com with Bearer abc.def-123; retained context."),
    "Signed in [email] with Bearer [redacted]; retained context.",
  );
});

test("long audit detail uses a bounded preview while retaining complete copyable evidence", () => {
  const source = `${"forensic evidence ".repeat(40)}owner@example.com`;
  const summary = summarizeAuditDetail(source);
  assert.equal(summary.collapsed, true);
  assert.ok(summary.preview.length < summary.full.length);
  assert.match(summary.preview, /…$/);
  assert.doesNotMatch(summary.full, /owner@example\.com/);
  assert.match(summary.full, /\[email\]$/);
  assert.match(summary.full, /forensic evidence/);
});
