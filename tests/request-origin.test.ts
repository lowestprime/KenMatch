import assert from "node:assert/strict";
import test from "node:test";

import {
  normalizeAuthority,
  normalizeHostname,
  normalizeOrigin,
  trustedRequestOrigin,
  trustedRouteOrigin,
} from "../src/lib/request-origin.ts";

test("request origins preserve non-standard ports while host allowlists do not", () => {
  assert.equal(normalizeAuthority("127.0.0.1:3100"), "127.0.0.1:3100");
  assert.equal(normalizeHostname("127.0.0.1:3100"), "127.0.0.1");
  assert.equal(
    trustedRequestOrigin({
      authority: normalizeAuthority("127.0.0.1:3100"),
      forwardedProto: "http",
      production: false,
    }),
    "http://127.0.0.1:3100",
  );
});

test("configured public origins and IPv6 authorities normalize deterministically", () => {
  assert.equal(normalizeAuthority("[::1]:3100"), "[::1]:3100");
  assert.equal(normalizeHostname("[::1]:3100"), "[::1]");
  assert.equal(normalizeOrigin("HTTPS://KMAT.CH/"), "https://kmat.ch");
  assert.equal(
    trustedRequestOrigin({
      authority: "internal:3000",
      forwardedProto: "http",
      publicOrigin: "https://kmat.ch/",
      production: true,
    }),
    "https://kmat.ch",
  );
});

test("invalid authorities and protocols fail closed", () => {
  assert.equal(normalizeAuthority("bad host"), "");
  assert.equal(normalizeOrigin("null"), "");
  assert.equal(
    trustedRequestOrigin({
      authority: "kmat.ch",
      forwardedProto: "javascript",
      production: false,
    }),
    "",
  );
});

test("route redirects use the browser-visible forwarded authority", () => {
  assert.equal(
    trustedRouteOrigin({
      forwardedHost: null,
      host: "127.0.0.1:3100",
      forwardedProto: null,
      fallbackProtocol: "http:",
      production: false,
    }),
    "http://127.0.0.1:3100",
  );
  assert.equal(
    trustedRouteOrigin({
      forwardedHost: "kmat.ch",
      host: "kenmatch:3000",
      forwardedProto: "https",
      fallbackProtocol: "http:",
      publicOrigin: "https://kmat.ch/",
      production: true,
    }),
    "https://kmat.ch",
  );
});
