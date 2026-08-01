import assert from "node:assert/strict";
import test from "node:test";

import {
  contentSecurityPolicy,
  emitsSecureTransportHeaders,
} from "../src/lib/security-policy.ts";

test("production security policy keeps HTTPS transport enforcement", () => {
  const mode = { development: false, auditLabMode: false };
  assert.equal(emitsSecureTransportHeaders(mode), true);
  assert.match(contentSecurityPolicy(mode), /upgrade-insecure-requests/);
  assert.doesNotMatch(contentSecurityPolicy(mode), /unsafe-eval/);
});

test("isolated HTTP audit lab keeps CSP while omitting invalid transport upgrades", () => {
  const mode = { development: false, auditLabMode: true };
  const policy = contentSecurityPolicy(mode);
  assert.equal(emitsSecureTransportHeaders(mode), false);
  assert.doesNotMatch(policy, /upgrade-insecure-requests/);
  assert.match(policy, /default-src 'self'/);
  assert.match(policy, /frame-ancestors 'none'/);
  assert.doesNotMatch(policy, /unsafe-eval/);
});

test("development policy permits the Next.js evaluator without transport upgrades", () => {
  const mode = { development: true, auditLabMode: false };
  assert.equal(emitsSecureTransportHeaders(mode), false);
  assert.match(contentSecurityPolicy(mode), /unsafe-eval/);
  assert.doesNotMatch(contentSecurityPolicy(mode), /upgrade-insecure-requests/);
});
