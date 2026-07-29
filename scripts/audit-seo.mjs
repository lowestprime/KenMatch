import process from "node:process";

const auditOrigin = (process.env.KENMATCH_AUDIT_ORIGIN ?? "http://127.0.0.1:3100").replace(/\/$/, "");
const expectedCanonicalOrigin = (
  process.env.KENMATCH_AUDIT_CANONICAL_ORIGIN
  ?? process.env.KENMATCH_CANONICAL_ORIGIN
  ?? "https://kmat.ch"
).replace(/\/$/, "");
const auditHostHeader = process.env.KENMATCH_AUDIT_HOST_HEADER?.trim();
const auditForwardedProto = process.env.KENMATCH_AUDIT_FORWARDED_PROTO?.trim();

const publicPaths = [
  "/",
  "/kens",
  "/discuss",
  "/profiles",
  "/submit",
  "/governance",
  "/economics",
  "/about",
  "/faq",
  "/glossary",
  "/reviews",
  "/verification",
];

const privatePaths = ["/auth", "/account", "/admin", "/forgot-password"];
const errors = [];
const notes = [];

function fail(message) {
  errors.push(message);
}

function decodeHtml(value) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", "\"")
    .replaceAll("&#x27;", "'")
    .replaceAll("&#39;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">");
}

function attributes(tag) {
  const values = new Map();
  for (const match of tag.matchAll(/([:\w-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g)) {
    values.set(match[1].toLowerCase(), decodeHtml(match[2] ?? match[3] ?? match[4] ?? ""));
  }
  return values;
}

function tags(html, name) {
  return [...html.matchAll(new RegExp(`<${name}\\b[^>]*>`, "gi"))].map((match) => ({
    raw: match[0],
    attrs: attributes(match[0]),
  }));
}

function metaContent(html, key, value) {
  const wanted = value.toLowerCase();
  return tags(html, "meta")
    .filter((tag) => (tag.attrs.get(key)?.toLowerCase() ?? "") === wanted)
    .map((tag) => tag.attrs.get("content") ?? "");
}

function canonicalLinks(html) {
  return tags(html, "link")
    .filter((tag) => (tag.attrs.get("rel") ?? "").toLowerCase().split(/\s+/).includes("canonical"))
    .map((tag) => tag.attrs.get("href") ?? "");
}

function equivalentUrl(left, right) {
  try {
    return new URL(left).toString() === new URL(right).toString();
  } catch {
    return false;
  }
}

function titleValues(html) {
  return [...html.matchAll(/<title\b[^>]*>([\s\S]*?)<\/title>/gi)]
    .map((match) => decodeHtml(match[1].replace(/<[^>]+>/g, "").trim()));
}

function jsonLdValues(html) {
  return [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)]
    .filter((match) => attributes(`<script ${match[1]}>`).get("type")?.toLowerCase() === "application/ld+json")
    .map((match) => match[2].trim());
}

function hasNoindex(html) {
  return [...metaContent(html, "name", "robots"), ...metaContent(html, "name", "googlebot")]
    .some((value) => value.toLowerCase().includes("noindex"));
}

async function get(path, init = {}) {
  try {
    const headers = new Headers(init.headers);
    if (auditHostHeader) {
      headers.set("host", auditHostHeader);
      headers.set("x-forwarded-host", auditHostHeader);
    }
    if (auditForwardedProto) headers.set("x-forwarded-proto", auditForwardedProto);
    const response = await fetch(`${auditOrigin}${path}`, {
      redirect: "follow",
      signal: AbortSignal.timeout(60_000),
      ...init,
      headers,
    });
    return {
      response,
      body: await response.text(),
    };
  } catch (error) {
    throw new Error(`${path}: ${error instanceof Error ? error.message : String(error)}`, { cause: error });
  }
}

function validatePublicHtml(path, response, html, expectedCanonical = path) {
  if (response.status !== 200) {
    fail(`${path}: expected HTTP 200, received ${response.status}`);
    return;
  }
  if (!response.headers.get("content-type")?.toLowerCase().includes("text/html")) {
    fail(`${path}: expected text/html response`);
  }

  const titles = titleValues(html);
  if (titles.length !== 1 || !titles[0]) {
    fail(`${path}: expected exactly one non-empty title, received ${titles.length}`);
  }

  const descriptions = metaContent(html, "name", "description").filter(Boolean);
  if (descriptions.length !== 1) {
    fail(`${path}: expected exactly one non-empty description, received ${descriptions.length}`);
  }

  const canonical = canonicalLinks(html);
  const wantedCanonical = new URL(expectedCanonical, `${expectedCanonicalOrigin}/`).toString();
  if (canonical.length !== 1 || !equivalentUrl(canonical[0], wantedCanonical)) {
    fail(`${path}: canonical ${JSON.stringify(canonical)} did not equal ${wantedCanonical}`);
  }

  if (hasNoindex(html)) {
    fail(`${path}: public canonical page unexpectedly declares noindex`);
  }

  const ogTitle = metaContent(html, "property", "og:title").filter(Boolean);
  const ogDescription = metaContent(html, "property", "og:description").filter(Boolean);
  const ogImage = metaContent(html, "property", "og:image").filter(Boolean);
  const twitterCard = metaContent(html, "name", "twitter:card").filter(Boolean);
  if (ogTitle.length !== 1 || ogDescription.length !== 1 || ogImage.length !== 1) {
    fail(`${path}: expected one complete Open Graph title/description/image record`);
  }
  if (twitterCard.length !== 1 || twitterCard[0] !== "summary_large_image") {
    fail(`${path}: expected one summary_large_image Twitter card`);
  }

  const h1Count = (html.match(/<h1\b/gi) ?? []).length;
  if (h1Count !== 1) {
    fail(`${path}: expected one h1, received ${h1Count}`);
  }

  for (const [index, value] of jsonLdValues(html).entries()) {
    try {
      JSON.parse(value);
    } catch (error) {
      fail(`${path}: JSON-LD block ${index + 1} is invalid (${error instanceof Error ? error.message : "parse error"})`);
    }
  }
}

function sitemapLocations(xml) {
  return [...xml.matchAll(/<loc>([\s\S]*?)<\/loc>/gi)].map((match) => decodeHtml(match[1].trim()));
}

async function main() {
  notes.push(`Audit target: ${auditOrigin}`);
  notes.push(`Expected canonical origin: ${expectedCanonicalOrigin}`);
  if (auditHostHeader) notes.push(`Forwarded public host: ${auditHostHeader}`);
  if (auditForwardedProto) notes.push(`Forwarded public protocol: ${auditForwardedProto}`);

  const robots = await get("/robots.txt");
  if (robots.response.status !== 200) fail(`/robots.txt: HTTP ${robots.response.status}`);
  if (!robots.response.headers.get("content-type")?.toLowerCase().includes("text/plain")) {
    fail("/robots.txt: expected text/plain content type");
  }
  if (!robots.body.includes(`Sitemap: ${expectedCanonicalOrigin}/sitemap.xml`)) {
    fail("/robots.txt: missing canonical sitemap declaration");
  }
  for (const privatePath of ["/account", "/admin", "/api", "/auth", "/forgot-password", "/reset", "/verify"]) {
    if (!robots.body.includes(`Disallow: ${privatePath}`)) {
      fail(`/robots.txt: missing Disallow for ${privatePath}`);
    }
  }

  const sitemap = await get("/sitemap.xml");
  if (sitemap.response.status !== 200) fail(`/sitemap.xml: HTTP ${sitemap.response.status}`);
  if (!sitemap.response.headers.get("content-type")?.toLowerCase().includes("xml")) {
    fail("/sitemap.xml: expected XML content type");
  }
  const locations = sitemapLocations(sitemap.body);
  if (locations.length < publicPaths.length) {
    fail(`/sitemap.xml: expected at least ${publicPaths.length} locations, received ${locations.length}`);
  }
  for (const path of publicPaths) {
    const expected = new URL(path, `${expectedCanonicalOrigin}/`).toString();
    if (!locations.includes(expected)) fail(`/sitemap.xml: missing ${expected}`);
  }
  for (const location of locations) {
    const pathname = new URL(location).pathname;
    if (
      ["/account", "/admin", "/api", "/auth", "/forgot-password", "/reset", "/verify"]
        .some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
    ) {
      fail(`/sitemap.xml: private location leaked: ${location}`);
    }
    if (new URL(location).origin !== expectedCanonicalOrigin) {
      fail(`/sitemap.xml: noncanonical origin: ${location}`);
    }
  }

  for (const path of publicPaths) {
    const { response, body } = await get(path);
    validatePublicHtml(path, response, body);
  }

  const dynamicSamples = [
    locations.find((location) => new URL(location).pathname.startsWith("/kens/")),
    locations.find((location) => new URL(location).pathname.startsWith("/people/")),
    locations.find((location) => new URL(location).pathname.startsWith("/discuss/")),
  ].filter(Boolean);
  for (const location of dynamicSamples) {
    const url = new URL(location);
    const { response, body } = await get(`${url.pathname}${url.search}`);
    validatePublicHtml(url.pathname, response, body, `${url.pathname}${url.search}`);
  }
  notes.push(`Validated ${dynamicSamples.length} public dynamic sitemap examples.`);

  for (const variant of [
    ["/kens?q=mechanism", "/kens"],
    ["/kens?sort=new&page=2", "/kens"],
    ["/discuss?sort=new", "/discuss"],
  ]) {
    const { response, body } = await get(variant[0]);
    if (response.status !== 200) fail(`${variant[0]}: HTTP ${response.status}`);
    if (!hasNoindex(body)) fail(`${variant[0]}: missing noindex`);
    const canonical = canonicalLinks(body);
    const expected = new URL(variant[1], `${expectedCanonicalOrigin}/`).toString();
    if (canonical.length !== 1 || !equivalentUrl(canonical[0], expected)) {
      fail(`${variant[0]}: expected canonical ${expected}, received ${JSON.stringify(canonical)}`);
    }
  }

  for (const path of privatePaths) {
    const { response, body } = await get(path);
    if (![200, 303, 307, 308].includes(response.status)) {
      fail(`${path}: unexpected HTTP ${response.status}`);
    }
    const xRobots = response.headers.get("x-robots-tag")?.toLowerCase() ?? "";
    if (!xRobots.includes("noindex")) fail(`${path}: missing X-Robots-Tag noindex`);
    if (response.headers.get("content-type")?.toLowerCase().includes("text/html") && !hasNoindex(body)) {
      fail(`${path}: HTML response missing noindex metadata`);
    }
  }

  const health = await get("/api/health");
  if (health.response.status !== 200) fail(`/api/health: HTTP ${health.response.status}`);
  if (!(health.response.headers.get("x-robots-tag") ?? "").toLowerCase().includes("noindex")) {
    fail("/api/health: missing X-Robots-Tag noindex");
  }

  const missing = await get("/__kenmatch_seo_audit_missing__");
  if (missing.response.status !== 404) fail(`/missing: expected HTTP 404, received ${missing.response.status}`);
  if (!hasNoindex(missing.body)) fail("/missing: expected noindex metadata");
  if ((missing.body.match(/<h1\b/gi) ?? []).length !== 1) fail("/missing: expected one h1");

  if (errors.length > 0) {
    process.stderr.write(`${JSON.stringify({ ok: false, errors, notes }, null, 2)}\n`);
    process.exitCode = 1;
    return;
  }

  process.stdout.write(`${JSON.stringify({
    ok: true,
    publicPages: publicPaths.length,
    dynamicPages: dynamicSamples.length,
    sitemapLocations: locations.length,
    notes,
  }, null, 2)}\n`);
}

await main().catch((error) => {
  process.stderr.write(`SEO audit failed to run: ${error instanceof Error ? error.stack : String(error)}\n`);
  process.exitCode = 1;
});
