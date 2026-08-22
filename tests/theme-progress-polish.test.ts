import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { seedChangelogEntries } from "../src/lib/seed-plus.ts";

const globalStyles = readFileSync(new URL("../src/app/globals.css", import.meta.url), "utf8");
const releasePolishStyles = readFileSync(new URL("../src/components/release-polish-styles.tsx", import.meta.url), "utf8");
const releaseHardeningStyles = readFileSync(new URL("../src/components/release-hardening-styles.tsx", import.meta.url), "utf8");
const communityPolishStyles = readFileSync(new URL("../src/components/community-polish-styles.tsx", import.meta.url), "utf8");

test("semantic interface text uses accessible purple accents in both themes", () => {
  assert.match(
    globalStyles,
    /:root\s*\{[\s\S]*?--accent-text:\s*#6d28d9;[\s\S]*?--accent-strong:\s*var\(--accent-text\);[\s\S]*?--success:\s*var\(--accent-text\);/,
  );
  assert.match(
    globalStyles,
    /html\[data-theme="dark"\],[\s\S]*?html\[data-theme="oled"\]\s*\{[\s\S]*?--accent-text:\s*#c4a5ff;[\s\S]*?--accent-strong:\s*var\(--accent-text\);[\s\S]*?--success:\s*var\(--accent-text\);/,
  );

  const authoredStyles = [globalStyles, releasePolishStyles, releaseHardeningStyles, communityPolishStyles].join("\n");
  assert.doesNotMatch(authoredStyles, /\bcolor\s*:\s*var\(--accent-blue\)/i);
  assert.doesNotMatch(authoredStyles, /\bcolor\s*:\s*#(?:315dff|6ea8ff|2563eb|1d4ed8)\b/i);
});

test("About hero typography is compact, balanced, and defined in one stylesheet", () => {
  assert.match(
    globalStyles,
    /\.about-hero\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1\.35fr\)\s+minmax\(18rem,\s*0\.65fr\);[^}]*align-items:\s*start;/s,
  );
  assert.match(
    globalStyles,
    /\.about-hero h1\s*\{[^}]*max-width:\s*18ch;[^}]*font-size:\s*3\.9rem;[^}]*line-height:\s*1\.02;/s,
  );
  assert.match(globalStyles, /@media \(max-width:\s*640px\)[\s\S]*?\.about-hero h1\s*\{[^}]*font-size:\s*2rem;/s);
  assert.doesNotMatch(releasePolishStyles, /\.about-hero/);
});

test("public changelog records the theme, progress, layout, and dependency maintenance release", () => {
  const entry = seedChangelogEntries.find((candidate) => candidate.id === "purple-progress-about-polish");
  assert.ok(entry);
  assert.equal(entry.entryDate, "2026-08-22");
  assert.equal(entry.visible, true);
  assert.match(entry.summary, /purple accents/i);
  assert.match(entry.summary, /every route/i);
  assert.match(entry.details ?? "", /brace-expansion, js-yaml, and nanoid/i);
});
