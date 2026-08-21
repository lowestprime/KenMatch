# Technical SEO Implementation

Last reviewed: 2026-07-28

## Code ownership

- `src/lib/seo.ts`: canonical URL, public/private metadata, query-index policy,
  shared descriptions, and structured-data helpers.
- `src/app/robots.ts`: crawler policy and sitemap location.
- `src/app/sitemap.ts`: public static and database-backed dynamic entries.
- `src/proxy.ts`: canonical-origin redirects and private response headers.
- `src/components/json-ld.tsx`: script-safe JSON-LD rendering.
- Route `page.tsx` files: visible route-specific metadata and matching schemas.
- `scripts/audit-seo.mjs`: response and rendered-document contract checks.
- `tests/seo.test.ts`: deterministic policy and social-asset checks.

## Canonical and noindex rules

`KENMATCH_CANONICAL_ORIGIN`, or `NEXT_PUBLIC_SITE_URL` when the former is absent,
owns the canonical origin. The proxy redirects a request whose forwarded public
origin differs from that value while preserving path and query.

Public routes emit absolute canonical URLs. Private account, admin, authentication,
recovery, verification-token, and API routes receive `X-Robots-Tag:
noindex, nofollow, noarchive` at the proxy boundary. Their page metadata also
declares noindex where HTML can render.

Valid single category and lane filters are deliberate indexable landing pages.
Search, sort, stage, pagination, combined filters, and invalid values canonicalize
to the base feed and declare noindex.

## Sitemap data boundaries

Database sitemap reads are public projections:

- Kens must be approved/public and not private intake.
- Profiles must not be suspended.
- Discussions must be publicly readable.
- Last-modified values come from actual public activity.
- Static page dates use the most recent public changelog/about/governance update.

No account, reviewer, visitor, audit, contact, email, or internal moderation data
enters the sitemap.

## Schema boundaries

Schemas are conservative and match rendered content:

- one site-level `WebSite`;
- one site-level `Project`, because KenMatch is a project rather than a claimed
  registered corporation;
- `FAQPage` only for visible FAQ entries;
- `BreadcrumbList` for FAQ and public detail routes;
- `CreativeWork` for a public Ken;
- `ProfilePage` and `Person` for a public profile;
- `DiscussionForumPosting` for a public discussion.

Schemas are omitted for private, suspended, unapproved, or missing records.
Serialized values escape `<` to prevent executable script content.

## Asset evidence

The protected Open Graph and share images are both valid 2400 x 1199 PNG files.
The declared metadata uses those dimensions and the `image/png` content type.
SVG remains the preferred in-app mark format; PNG and ICO fallbacks are retained
for crawler and platform compatibility.

## Performance boundary

This implementation reduces avoidable discovery cost but does not claim passing
field Core Web Vitals without real-user evidence. The app uses generated,
self-hosted Next font resources with `display: swap`, stable image dimensions,
server pagination, low-cost surfaces, and no added SEO client bundle. Local
browser measurements are lab evidence only.

## Validation

Against a running candidate:

```powershell
$env:KENMATCH_AUDIT_ORIGIN = "http://127.0.0.1:3100"
npm run audit:seo
```

For a production server reached through loopback while preserving its public
proxy context:

```powershell
$env:KENMATCH_AUDIT_ORIGIN = "http://127.0.0.1:3101"
$env:KENMATCH_AUDIT_CANONICAL_ORIGIN = "https://kmat.ch"
$env:KENMATCH_AUDIT_HOST_HEADER = "kmat.ch"
$env:KENMATCH_AUDIT_FORWARDED_PROTO = "https"
npm run audit:seo
```

The audit checks:

- robots and sitemap response status and type;
- absence of private routes in the sitemap;
- title, description, canonical, Open Graph, Twitter, one `h1`, and parseable
  JSON-LD for public HTML;
- public dynamic examples discovered from the sitemap;
- noindex and base canonical behavior for query variants;
- noindex headers for private and API surfaces;
- structured 404 status and noindex behavior.

Run the project checks and browser matrix separately. A metadata declaration is
not accepted as proof until the candidate response has been inspected.

## Local acceptance evidence

The July 29, 2026 isolated candidate run used an empty, separately seeded local
database and canonical origin `https://kmat.ch`.

- Response audit: 12 public static pages, 34 sitemap entries, two available
  public dynamic examples, query variants, four private routes, the health API,
  and a structured 404 passed.
- The same response matrix passed against the optimized standalone server while
  forwarding the production `kmat.ch` host and HTTPS context through loopback.
- Sitemap defect found and repaired: the initial run returned HTTP 500 because a
  projection referenced obsolete changelog columns. The corrected projection is
  now covered by an in-memory schema contract test.
- Browser: Overview, FAQ, filtered Feed, public Ken detail, and About community
  sections rendered at 1280 x 720 and 390 x 844 with one `h1`, expected
  canonical/schema records, zero document overflow, and zero console warnings.
- Local Ken-detail lab navigation measured 370 ms TTFB, 460 ms DOM content
  loaded, 558 ms load, and 624 ms first contentful paint. These values are
  development-machine observations, not production Core Web Vitals or a
  performance guarantee.
- The only clipped node detected by the broad element scan was the intentional
  `.sr-only` lifecycle narrative.

Artifacts are stored under `output/playwright/seo/` and are not committed.
