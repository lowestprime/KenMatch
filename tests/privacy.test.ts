import assert from "node:assert/strict";
import test from "node:test";

import { hashPrivateIdentifier } from "../src/lib/privacy.ts";

test("private identifiers are deterministic, normalized, and one-way", () => {
  const first = hashPrivateIdentifier(" 203.0.113.42 ", "security-network", "test-salt");
  const repeated = hashPrivateIdentifier("203.0.113.42", "security-network", "test-salt");

  assert.equal(first, repeated);
  assert.match(first ?? "", /^sha256:[a-f0-9]{64}$/);
  assert.doesNotMatch(first ?? "", /203\.0\.113\.42/);
});

test("private identifier hashes are purpose and salt scoped", () => {
  const source = "person@example.com";
  assert.notEqual(
    hashPrivateIdentifier(source, "rate-limit:sign-in", "salt-a"),
    hashPrivateIdentifier(source, "rate-limit:contact", "salt-a"),
  );
  assert.notEqual(
    hashPrivateIdentifier(source, "rate-limit:sign-in", "salt-a"),
    hashPrivateIdentifier(source, "rate-limit:sign-in", "salt-b"),
  );
});

test("empty private identifiers are not persisted as hashes", () => {
  assert.equal(hashPrivateIdentifier(null, "security-network", "test-salt"), null);
  assert.equal(hashPrivateIdentifier("   ", "security-network", "test-salt"), null);
});
