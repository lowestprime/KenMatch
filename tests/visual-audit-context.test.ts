import assert from "node:assert/strict";
import test from "node:test";

import {
  isValidatedVisualAuditContext,
  isValidVisualAuditToken,
  isWellFormedVisualAuditToken,
} from "../src/lib/visual-audit-context.ts";

const TOKEN = "a".repeat(64);

test("visual audit tokens require exactly 64 hexadecimal characters", () => {
  assert.equal(isWellFormedVisualAuditToken(TOKEN), true);
  assert.equal(isWellFormedVisualAuditToken("A1".repeat(32)), true);
  assert.equal(isWellFormedVisualAuditToken("z".repeat(64)), false);
  assert.equal(isWellFormedVisualAuditToken("a".repeat(63)), false);
  assert.equal(isWellFormedVisualAuditToken(""), false);
});

test("visual audit token comparison rejects missing, malformed, and mismatched values", () => {
  assert.equal(isValidVisualAuditToken(TOKEN, TOKEN), true);
  assert.equal(isValidVisualAuditToken(TOKEN.toUpperCase(), TOKEN), true);
  assert.equal(isValidVisualAuditToken("b".repeat(64), TOKEN), false);
  assert.equal(isValidVisualAuditToken(TOKEN, undefined), false);
});

test("read-only audit context requires both the exact flag and independent secret", () => {
  const headers = new Headers({
    "x-kenmatch-audit-readonly": "1",
    "x-kenmatch-audit-token": TOKEN,
  });
  assert.equal(isValidatedVisualAuditContext(headers, TOKEN), true);

  headers.delete("x-kenmatch-audit-readonly");
  assert.equal(isValidatedVisualAuditContext(headers, TOKEN), false);
  headers.set("x-kenmatch-audit-readonly", "1");
  headers.set("x-kenmatch-audit-token", "b".repeat(64));
  assert.equal(isValidatedVisualAuditContext(headers, TOKEN), false);
});
