import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const visitorMap = readFileSync(new URL("../src/components/visitor-map.tsx", import.meta.url), "utf8");
const globalStyles = readFileSync(new URL("../src/app/globals.css", import.meta.url), "utf8");

test("visitor map separates visual dots from desktop pointer targets", () => {
  assert.match(visitorMap, /className="visitor-bubble-layer" aria-hidden="true"/);
  assert.match(visitorMap, /className="visitor-bubble-hit-layer"/);
  assert.match(visitorMap, /className="visitor-bubble-target"/);
  assert.doesNotMatch(visitorMap, /tabIndex=\{aggregate \? 0 : -1\}/);
});

test("mobile visitor map uses full ranked country controls with compliant targets", () => {
  assert.match(visitorMap, /const rankedCountries = \[\.\.\.mapped\]\.sort/);
  assert.match(visitorMap, /rankedCountries\.map\(\(country\) =>/);
  assert.match(visitorMap, /aria-label="Visitor countries, highest traffic first"/);
  assert.match(
    globalStyles,
    /\.visitor-country-list\s*\{[^}]*flex-wrap:\s*nowrap;[^}]*overflow-x:\s*auto;/s,
  );
  assert.match(
    globalStyles,
    /\.visitor-country-list button\s*\{[^}]*flex:\s*0\s+0\s+auto;[^}]*min-height:\s*2\.75rem;/s,
  );
  assert.match(
    globalStyles,
    /@media \(max-width:\s*760px\)[\s\S]*?\.visitor-bubble-hit-layer\s*\{\s*display:\s*none;/,
  );
});
