import assert from "node:assert/strict";
import test from "node:test";

import { overlapPixels, overlappingPositions } from "./tiling.js";

test("overlapping positions cover the full source with twelve-percent overlap", () => {
  const positions = overlappingPositions(5_000, 900);
  assert.equal(positions[0], 0);
  assert.equal(positions.at(-1), 4_100);
  assert.equal(overlapPixels(900), 108);
  for (let index = 1; index < positions.length; index += 1) {
    assert.ok((positions[index] ?? 0) - (positions[index - 1] ?? 0) <= 792);
  }
});

test("short pages produce one tile", () => {
  assert.deepEqual(overlappingPositions(700, 900), [0]);
});
