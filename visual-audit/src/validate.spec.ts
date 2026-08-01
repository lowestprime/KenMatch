import assert from "node:assert/strict";
import test from "node:test";

import { stateCovered } from "./validate.js";
import type { CaptureRecord } from "./types.js";

const captures = [
  { theme: "light", auth: "anonymous", state: "default" },
  { theme: "oled", auth: "user", state: "ken-stage:running" },
  { theme: "oled", auth: "admin", state: "lane-state:months" },
] as CaptureRecord[];

test("state coverage derives theme, auth, stage, and lane states", () => {
  assert.equal(stateCovered("light-theme", captures), true);
  assert.equal(stateCovered("oled-theme", captures), true);
  assert.equal(stateCovered("anonymous", captures), true);
  assert.equal(stateCovered("signed-in-user", captures), true);
  assert.equal(stateCovered("ken-stage", captures), true);
  assert.equal(stateCovered("lane-state", captures), true);
  assert.equal(stateCovered("maintenance", captures), false);
});
