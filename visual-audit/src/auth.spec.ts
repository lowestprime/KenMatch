import assert from "node:assert/strict";
import test from "node:test";

import { isLiveLoginMutation } from "./auth.js";

const BASE_URL = "https://kmat.ch";

test("live login counts only same-origin unsafe requests", () => {
  assert.equal(isLiveLoginMutation("POST", "https://kmat.ch/auth", BASE_URL), true);
  assert.equal(isLiveLoginMutation("PATCH", "https://kmat.ch/api/session", BASE_URL), true);
  assert.equal(isLiveLoginMutation("POST", "https://kmat.ch/api/cdn-cgi/audit", BASE_URL), true);
  assert.equal(isLiveLoginMutation("GET", "https://kmat.ch/auth", BASE_URL), false);
  assert.equal(isLiveLoginMutation("POST", "https://kmat.ch/cdn-cgi/rum?", BASE_URL), false);
  assert.equal(
    isLiveLoginMutation("POST", "https://kmat.ch/cdn-cgi/challenge-platform/h/g/turnstile", BASE_URL),
    false,
  );
  assert.equal(
    isLiveLoginMutation("POST", "https://challenges.cloudflare.com/turnstile/v0/siteverify", BASE_URL),
    false,
  );
  assert.equal(isLiveLoginMutation("POST", "not a URL", BASE_URL), false);
});
