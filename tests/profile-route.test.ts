import assert from "node:assert/strict";
import test from "node:test";

import { profilePath } from "../src/lib/profile-route.ts";

test("profile links prefer the canonical username", () => {
  assert.equal(
    profilePath({ id: "elena-petrov", username: "defensive-reviewer-04" }),
    "/people/defensive-reviewer-04",
  );
});

test("profile links fall back to the stable profile id and encode slugs", () => {
  assert.equal(profilePath({ id: "local user", username: null }), "/people/local%20user");
  assert.equal(profilePath({ id: "fallback", username: " reviewer name " }), "/people/reviewer%20name");
});
