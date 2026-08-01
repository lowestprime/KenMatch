import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { createClient } from "@libsql/client";

import {
  PRIVATE_INDEX_PATH_PREFIXES,
  PUBLIC_STATIC_SITEMAP_ROUTES,
  breadcrumbJsonLd,
  canonicalUrl,
  classifyKensQuery,
  isPrivateIndexPath,
  jsonLdString,
  seoDescription,
  SOCIAL_IMAGE_HEIGHT,
  SOCIAL_IMAGE_WIDTH,
} from "../src/lib/seo.ts";
import { PUBLIC_CONTENT_LAST_MODIFIED_SQL } from "../src/lib/seo-sitemap.ts";

test("private indexing policy covers sensitive surfaces without hiding public verification", () => {
  for (const path of [
    "/account",
    "/account/security",
    "/admin",
    "/api/health",
    "/auth",
    "/forgot-password",
    "/reset/token",
    "/verify/token",
  ]) {
    assert.equal(isPrivateIndexPath(path), true, path);
  }
  assert.equal(isPrivateIndexPath("/verification"), false);
  assert.equal(isPrivateIndexPath("/kens"), false);
  assert.deepEqual(PRIVATE_INDEX_PATH_PREFIXES, [
    "/account",
    "/admin",
    "/api",
    "/auth",
    "/forgot-password",
    "/reset",
    "/verify",
    "/visual-audit",
  ]);
});

test("Ken feed indexing accepts only canonical base, category, and lane states", () => {
  const categories = new Set(["science-health", "open-software"]);
  assert.deepEqual(classifyKensQuery({}, categories), {
    index: true,
    canonicalPath: "/kens",
    kind: "base",
    value: null,
  });
  assert.deepEqual(classifyKensQuery({ category: "science-health" }, categories), {
    index: true,
    canonicalPath: "/kens?category=science-health",
    kind: "category",
    value: "science-health",
  });
  assert.deepEqual(classifyKensQuery({ tier: "months" }, categories), {
    index: true,
    canonicalPath: "/kens?tier=months",
    kind: "lane",
    value: "months",
  });
  for (const params of [
    { q: "health" },
    { page: "2" },
    { category: "unknown" },
    { category: "science-health", tier: "months" },
    { tier: ["months", "weeks"] },
  ]) {
    assert.deepEqual(classifyKensQuery(params, categories), {
      index: false,
      canonicalPath: "/kens",
      kind: "noncanonical",
      value: null,
    });
  }
});

test("canonical and description helpers normalize deterministic search metadata", () => {
  assert.equal(canonicalUrl("/faq"), "https://kmat.ch/faq");
  assert.equal(seoDescription("  A   compact   sentence.  "), "A compact sentence.");
  const long = seoDescription("evidence ".repeat(40), 90);
  assert.ok(long.length <= 90);
  assert.ok(long.endsWith("…"));
  assert.equal(/\s{2,}/.test(long), false);
});

test("structured data serialization escapes executable markup and builds ordered breadcrumbs", () => {
  const data = breadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "FAQ", path: "/faq" },
  ]);
  assert.equal(data.itemListElement.length, 2);
  assert.equal(data.itemListElement[0].position, 1);
  assert.equal(data.itemListElement[1].item, "https://kmat.ch/faq");
  const serialized = jsonLdString({ value: "</script><script>alert(1)</script>" });
  assert.equal(serialized.includes("<"), false);
  assert.deepEqual(JSON.parse(serialized), { value: "</script><script>alert(1)</script>" });
});

test("public static sitemap routes are unique and never overlap private prefixes", () => {
  const paths = PUBLIC_STATIC_SITEMAP_ROUTES.map((route) => route.path);
  assert.equal(new Set(paths).size, paths.length);
  assert.ok(paths.includes("/faq"));
  assert.ok(paths.includes("/glossary"));
  assert.ok(paths.includes("/verification"));
  for (const path of paths) assert.equal(isPrivateIndexPath(path), false, path);
});

function readPngDimensions(buffer: Buffer) {
  assert.deepEqual([...buffer.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
  assert.equal(buffer.subarray(12, 16).toString("ascii"), "IHDR");
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

test("protected social preview fallbacks are valid PNGs with declared dimensions", async () => {
  for (const file of ["public/og-image.png", "public/share-image.png"]) {
    const buffer = await readFile(file);
    assert.deepEqual(readPngDimensions(buffer), {
      width: SOCIAL_IMAGE_WIDTH,
      height: SOCIAL_IMAGE_HEIGHT,
    });
  }
});

test("public sitemap content date query follows the current changelog schema", async () => {
  const client = createClient({ url: "file::memory:" });
  await client.batch([
    `CREATE TABLE changelog_entries (
      id TEXT PRIMARY KEY,
      entryDate TEXT NOT NULL,
      visible INTEGER NOT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    )`,
    "CREATE TABLE site_settings (key TEXT PRIMARY KEY, updatedAt TEXT NOT NULL)",
    "CREATE TABLE governance_events (id TEXT PRIMARY KEY, createdAt TEXT NOT NULL)",
    `INSERT INTO changelog_entries VALUES (
      'release', '2026-07-28', 1, '2026-07-27T00:00:00.000Z', '2026-07-29T00:00:00.000Z'
    )`,
    "INSERT INTO site_settings VALUES ('about.page', '2026-07-26T00:00:00.000Z')",
    "INSERT INTO governance_events VALUES ('event', '2026-07-25T00:00:00.000Z')",
  ], "write");
  const result = await client.execute(PUBLIC_CONTENT_LAST_MODIFIED_SQL);
  assert.equal(result.rows[0]?.lastModified, "2026-07-29T00:00:00.000Z");
  client.close();
});
