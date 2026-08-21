import assert from "node:assert/strict";
import test from "node:test";

import {
  calculateReadingProgress,
  isLongReadingPath,
  qualifiesAsLongReadingSurface,
} from "../src/lib/reading-progress.ts";

test("reading progress is limited to editorial routes with meaningful length", () => {
  for (const pathname of ["/about", "/economics", "/faq", "/glossary", "/governance", "/about/"]) {
    assert.equal(isLongReadingPath(pathname), true);
  }
  for (const pathname of ["/", "/kens", "/admin", "/submit", "/kens/example"]) {
    assert.equal(isLongReadingPath(pathname), false);
  }
  assert.equal(qualifiesAsLongReadingSurface(2400, 800), true);
  assert.equal(qualifiesAsLongReadingSurface(1600, 800), false);
});

test("reading progress clamps before, within, and after the article", () => {
  assert.equal(calculateReadingProgress(0, 200, 2200, 800), 0);
  assert.equal(calculateReadingProgress(900, 200, 2200, 800), 50);
  assert.equal(calculateReadingProgress(5000, 200, 2200, 800), 100);
});
