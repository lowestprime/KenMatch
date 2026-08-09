import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const homePage = readFileSync(new URL("../src/app/page.tsx", import.meta.url), "utf8");
const globalStyles = readFileSync(new URL("../src/app/globals.css", import.meta.url), "utf8");

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
