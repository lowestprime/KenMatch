import assert from "node:assert/strict";
import test from "node:test";

import {
  isLoopbackHost,
  isTestAuthBypassAvailable,
  isValidTestAuthBypassToken,
  normalizeRequestHost,
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

test("test auth bypass requires exact token", () => {
  assert.equal(isValidTestAuthBypassToken("secret", "secret"), true);
  assert.equal(isValidTestAuthBypassToken("wrong", "secret"), false);
  assert.equal(isValidTestAuthBypassToken("secret", ""), false);
});
