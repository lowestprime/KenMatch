import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const homePage = readFileSync(new URL("../src/app/page.tsx", import.meta.url), "utf8");
const globalStyles = readFileSync(new URL("../src/app/globals.css", import.meta.url), "utf8");
const siteShell = readFileSync(new URL("../src/components/site-shell.tsx", import.meta.url), "utf8");

test("mobile header auth action keeps its compact label on one line", () => {
  assert.match(
    globalStyles,
    /\.site-utility-row\s*>\s*\.cta-compact\s*\{[^}]*flex:\s*0\s+0\s+auto;[^}]*white-space:\s*nowrap;[^}]*overflow-wrap:\s*normal;[^}]*word-break:\s*normal;/s,
  );
});

test("home category summaries reserve an intrinsic-width count column", () => {
  assert.match(homePage, /className="category-summary-header [^"]*"/);
  assert.match(homePage, /className="category-summary-main [^"]*"/);
  assert.match(homePage, /className="category-summary-count tag"/);
  assert.match(
    globalStyles,
    /\.category-summary-header\s*\{[^}]*display:\s*grid;[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)\s+auto;[^}]*align-items:\s*start;/s,
  );
  assert.match(
    globalStyles,
    /\.category-summary-count\.tag\s*\{[^}]*flex:\s*0\s+0\s+auto;[^}]*max-width:\s*none;[^}]*white-space:\s*nowrap;[^}]*overflow-wrap:\s*normal;[^}]*word-break:\s*normal;/s,
  );
});

test("authenticated desktop headers yield tagline space without clipping tabs", () => {
  assert.match(siteShell, /className=\{`site-brand-row\$\{viewer \? " is-authenticated" : ""\}`\}/);
  assert.match(
    globalStyles,
    /@media \(min-width:\s*1081px\) and \(max-width:\s*1500px\)\s*\{\s*\.site-brand-row\.is-authenticated\s*\{[^}]*grid-template-columns:\s*minmax\(9\.5rem,\s*auto\)\s+minmax\(0,\s*1fr\)\s+auto;/s,
  );
  assert.match(
    globalStyles,
    /\.site-brand-row\.is-authenticated\s+\.site-brand-text\s*>\s*span\s*\{[^}]*display:\s*none;/s,
  );
});
