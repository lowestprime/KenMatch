import assert from "node:assert/strict";
import test from "node:test";

import {
  categoryFilterHref,
  categoryVisualForSlug,
  laneFilterHref,
  laneLabel,
  laneVisuals,
} from "../src/lib/taxonomy.ts";

test("category visuals are deterministic for future slugs", () => {
  const first = categoryVisualForSlug("public-infrastructure");
  const second = categoryVisualForSlug("public-infrastructure");
  assert.deepEqual(first, second);
  assert.equal(first.slug, "public-infrastructure");
  assert.match(first.primary, /^#/);
});

test("known category visuals avoid legacy green/teal palette", () => {
  const visual = categoryVisualForSlug("science-health");
  const colors = [visual.primary, visual.secondary, visual.tertiary, visual.background].join(" ");
  assert.doesNotMatch(colors, /0d7d74|7df9ff|10b981/i);
});

test("taxonomy filter hrefs produce canonical feed query URLs", () => {
  assert.equal(categoryFilterHref("science-health"), "/kens?category=science-health");
  assert.equal(categoryFilterHref("space & policy"), "/kens?category=space%20%26%20policy");
  assert.equal(laneFilterHref("months"), "/kens?tier=months");
  assert.equal(laneLabel("weeks"), laneVisuals.weeks.label);
});
