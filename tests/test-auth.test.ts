import assert from "node:assert/strict";
import test from "node:test";

import {
  isIsolatedAuditLabOrigin,
  isLoopbackHost,
  isTestAuthBypassAvailable,
  isValidTestAuthBypassToken,
  isValidTestAuthMode,
  normalizeRequestHost,
  shouldUseSecureSessionCookie,
} from "../src/lib/test-auth.ts";

test("test auth host normalization preserves loopback hosts", () => {
  assert.equal(normalizeRequestHost("localhost:3000"), "localhost");
  assert.equal(normalizeRequestHost("127.0.0.1:3000"), "127.0.0.1");
  assert.equal(normalizeRequestHost("[::1]:3000"), "::1");
  assert.equal(isLoopbackHost("127.42.0.10:3000"), true);
});

test("test auth bypass is unavailable by default", () => {
  assert.equal(isTestAuthBypassAvailable("localhost:3000", { NODE_ENV: "development" }), false);
});

test("test auth bypass is unavailable in production even when configured", () => {
  assert.equal(
    isTestAuthBypassAvailable("localhost:3000", {
      NODE_ENV: "production",
      KENMATCH_ENABLE_TEST_AUTH_BYPASS: "true",
      KENMATCH_TEST_AUTH_BYPASS_TOKEN: "secret",
    }),
    false,
  );
});

test("test auth bypass is unavailable outside loopback", () => {
  assert.equal(
    isTestAuthBypassAvailable("kmat.ch", {
      NODE_ENV: "development",
      KENMATCH_ENABLE_TEST_AUTH_BYPASS: "true",
      KENMATCH_TEST_AUTH_BYPASS_TOKEN: "secret",
    }),
    false,
  );
});

test("test auth bypass permits only the exact isolated audit host with non-live lab flags", () => {
  const lab = {
    NODE_ENV: "development",
    KENMATCH_ENABLE_TEST_AUTH_BYPASS: "true",
    KENMATCH_TEST_AUTH_BYPASS_TOKEN: "local-secret",
    KENMATCH_AUDIT_LAB_MODE: "true",
    KENMATCH_AUDIT_TIER: "tier-2-production-clone",
    KENMATCH_AUDIT_DATA_PROVENANCE: "production-clone",
    KENMATCH_AUDIT_TOKEN: "a".repeat(64),
  } as const;
  assert.equal(isTestAuthBypassAvailable("kenmatch-audit-app:3000", lab), true);
  assert.equal(isTestAuthBypassAvailable("kenmatch:3000", lab), false);
  assert.equal(isTestAuthBypassAvailable("kenmatch-audit-app:3000", {
    ...lab,
    KENMATCH_AUDIT_DATA_PROVENANCE: "production-live",
  }), false);
  assert.equal(isTestAuthBypassAvailable("kenmatch-audit-app:3000", {
    ...lab,
    KENMATCH_AUDIT_LAB_MODE: "false",
  }), false);
  assert.equal(isTestAuthBypassAvailable("kenmatch-audit-app:3000", {
    ...lab,
    NODE_ENV: "production",
  }), true);
  assert.equal(isTestAuthBypassAvailable("kenmatch-audit-app:3000", {
    ...lab,
    NODE_ENV: "production",
    KENMATCH_AUDIT_TOKEN: "",
  }), false);
});

test("test auth accepts each explicit validation role", () => {
  assert.equal(isValidTestAuthMode("user"), true);
  assert.equal(isValidTestAuthMode("moderator"), true);
  assert.equal(isValidTestAuthMode("admin"), true);
  assert.equal(isValidTestAuthMode("owner"), true);
  assert.equal(isValidTestAuthMode("root"), false);
});

test("production session cookies are insecure only on the exact isolated HTTP lab origin", () => {
  const lab = {
    NODE_ENV: "production",
    KENMATCH_AUDIT_LAB_MODE: "true",
    KENMATCH_AUDIT_TIER: "tier-1-synthetic",
    KENMATCH_AUDIT_DATA_PROVENANCE: "synthetic-fixture",
    KENMATCH_AUDIT_TOKEN: "b".repeat(64),
    KENMATCH_PUBLIC_ORIGIN: "http://kenmatch-audit-app:3000",
  } as const;
  assert.equal(isIsolatedAuditLabOrigin(lab.KENMATCH_PUBLIC_ORIGIN, lab), true);
  assert.equal(shouldUseSecureSessionCookie(lab), false);
  assert.equal(shouldUseSecureSessionCookie({ ...lab, KENMATCH_PUBLIC_ORIGIN: "https://kmat.ch" }), true);
  assert.equal(shouldUseSecureSessionCookie({ ...lab, KENMATCH_AUDIT_TIER: "tier-3-live-production" }), true);
  assert.equal(shouldUseSecureSessionCookie({ ...lab, KENMATCH_AUDIT_DATA_PROVENANCE: "production-live" }), true);
  assert.equal(shouldUseSecureSessionCookie({ ...lab, KENMATCH_AUDIT_TOKEN: "" }), true);
});

test("test auth bypass requires exact token", () => {
  assert.equal(isValidTestAuthBypassToken("secret", "secret"), true);
  assert.equal(isValidTestAuthBypassToken("wrong", "secret"), false);
  assert.equal(isValidTestAuthBypassToken("secret", ""), false);
});
