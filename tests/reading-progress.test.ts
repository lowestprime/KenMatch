import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { calculatePageProgress } from "../src/lib/reading-progress.ts";

const progressComponent = readFileSync(new URL("../src/components/reading-progress.tsx", import.meta.url), "utf8");

test("page progress is global and follows the document scroll surface", () => {
  assert.match(progressComponent, /document\.scrollingElement \?\? document\.documentElement/);
  assert.match(progressComponent, /new ResizeObserver\(schedule\)/);
  assert.match(progressComponent, /aria-label="Page progress"/);
  assert.doesNotMatch(progressComponent, /isLongReadingPath|long-reading-route|routeEligible/);
});

test("page progress clamps before, within, and after the document", () => {
  assert.equal(calculatePageProgress(0, 2200, 800), 0);
  assert.equal(calculatePageProgress(700, 2200, 800), 50);
  assert.equal(calculatePageProgress(5000, 2200, 800), 100);
  assert.equal(calculatePageProgress(0, 800, 800), 100);
});
