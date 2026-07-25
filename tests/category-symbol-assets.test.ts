import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const themes = ["dark", "light"] as const;
const slugs = [
  "science-health",
  "open-tools",
  "research-synthesis",
  "engineering-systems",
  "safety-evaluation",
  "frontier-creative",
  "fallback-prism",
] as const;
const brandStops = ["#1d4ed8", "#4c1d95", "#b08d1a", "#991b1b", "#6d28d9"];

test("category icon export matrix is complete", async () => {
  for (const theme of themes) {
    const directory = path.join(process.cwd(), "public", "category-icons", theme);
    const files = (await readdir(directory)).filter((file) => file.endsWith(".svg")).sort();
    assert.deepEqual(files, slugs.map((slug) => `${slug}.svg`).sort());
  }
});

test("category SVG exports are accessible, brand-aligned, and self-contained", async () => {
  for (const theme of themes) {
    for (const slug of slugs) {
      const file = path.join(process.cwd(), "public", "category-icons", theme, `${slug}.svg`);
      const source = await readFile(file, "utf8");
      assert.match(source, /viewBox="0 0 96 96"/);
      assert.match(source, /role="img"/);
      assert.match(source, /<title id="title">/);
      assert.match(source, /<desc id="desc">/);
      assert.doesNotMatch(source, /<(?:script|image)\b/i);
      assert.doesNotMatch(source, /class="(?:keyline|glint)"/);
      assert.doesNotMatch(source, /category-symbol-(?:keyline|glint)/);
      assert.doesNotMatch(source, /(?:href|xlink:href)=["'](?:https?:|\/\/|data:)/i);
      for (const stop of brandStops) assert.ok(source.includes(stop), `${file} is missing ${stop}`);
    }
  }
});

test("live category renderer retains the new core identity and runtime microindicators", async () => {
  const source = await readFile(path.join(process.cwd(), "src", "components", "ken-visual.tsx"), "utf8");
  assert.doesNotMatch(source, /category-symbol-(?:keyline|glint)/);
  for (const token of [
    "useId()",
    "category-symbol-core-identity",
    "category-symbol-status-mark",
    "category-symbol-tier-segment",
    "data-tier-segments={activeSegments}",
    'variant?: "card" | "detail" | "inline"',
  ]) {
    assert.ok(source.includes(token), `Missing ${token}`);
  }
});
