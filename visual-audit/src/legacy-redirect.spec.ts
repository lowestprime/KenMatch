import assert from "node:assert/strict";
import test from "node:test";

import {
  expectedLegacyRedirectLocation,
  isExpectedLegacyRedirectDuplicate,
  isLegacyRedirectRoute,
} from "./legacy-redirect.js";

test("legacy redirect locations preserve canonical fragments and task queries", () => {
  assert.deepEqual(expectedLegacyRedirectLocation("/changelog"), {
    pathname: "/about",
    search: "",
    hash: "#changelog",
  });
  assert.deepEqual(expectedLegacyRedirectLocation("/tasks/example?q=one#review"), {
    pathname: "/kens/example",
    search: "?q=one",
    hash: "#review",
  });
  assert.equal(isLegacyRedirectRoute("/people"), true);
  assert.equal(isLegacyRedirectRoute("/about"), false);
});

test("full-page canonical and fragment redirect captures are expected duplicates", () => {
  assert.equal(isExpectedLegacyRedirectDuplicate([
    { route: "/about", finalUrl: "https://kmat.ch/about" },
    { route: "/about#changelog", finalUrl: "https://kmat.ch/about#changelog" },
    { route: "/changelog", finalUrl: "https://kmat.ch/about#changelog" },
  ]), true);
});

test("legacy duplicate evidence requires the exact redirect and canonical destination", () => {
  assert.equal(isExpectedLegacyRedirectDuplicate([
    { route: "/changelog", finalUrl: "https://kmat.ch/about" },
    { route: "/about", finalUrl: "https://kmat.ch/about" },
  ]), false);
  assert.equal(isExpectedLegacyRedirectDuplicate([
    { route: "/changelog", finalUrl: "https://kmat.ch/about#changelog" },
    { route: "/profiles", finalUrl: "https://kmat.ch/profiles" },
  ]), false);
  assert.equal(isExpectedLegacyRedirectDuplicate([
    { route: "/about", finalUrl: "https://kmat.ch/about" },
    { route: "/about#changelog", finalUrl: "https://kmat.ch/about#changelog" },
  ]), false);
});
