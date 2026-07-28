# Admin Historical Analytics

## Scope

KenMatch exposes historical operating telemetry only inside the role-gated `/admin` route for owner and admin accounts. It complements the existing lifetime visitor map; it is not a public analytics endpoint and it does not add third-party tracking.

The July 28, 2026 implementation covers:

- unique visitors by day, week, or month;
- page views by day, week, or month;
- first-time and returning visitor estimates;
- new accounts over time;
- current versus equal-length previous-period country distribution;
- transactional email delivery health; and
- collection start, latest activity, and retention state.

## Measurement contract

### Visitor signature

The existing visitor signature is a purpose-salted SHA-256 digest of the transient request IP address and user-agent string. Historical analytics adds no fingerprint inputs. The raw IP address, user-agent string, region, city, latitude, and longitude are not retained.

The signature is a coarse operating estimate, not a person-level identity:

- `first-time` means the signature's first observed day falls in the selected period or bucket;
- `returning` means the same signature was first observed before the selected bucket; and
- `unknown country` means Cloudflare did not provide a usable country code.

VPN changes, shared networks, browser changes, rotating addresses, bots, and cleared clients can split or combine apparent visitors. The UI therefore labels these values as visitor estimates and never presents them as identified people.

### Page views, not sessions

`pageViews` counts requests observed by the existing server visitor beacon. The schema cannot defend a session boundary, so the UI does not label this metric as sessions or visits.

### Accounts and email

New accounts are counted from `accounts.createdAt`.

Notification telemetry stores only:

- a bounded purpose label;
- `sent`, `failed`, or `not-configured`;
- environment, database, or no transport;
- recipient count; and
- event time.

It does not store recipients, subjects, message bodies, attachments, or provider responses.

## Storage and retention

`visitor_daily_activity` stores one row per UTC day and salted visitor ID. Its composite primary key is `(day, visitorId)`. A repeated observation increments that day's page-view count and updates the last-seen time.

`notification_delivery_events` stores the bounded delivery-health fields above.

Both tables use a 400-day retention window. Expired records are deleted during writes. The longest UI range is 365 days so it remains inside the retention boundary.

Historical collection starts when this schema is deployed. No earlier daily series is reconstructed from lifetime `visitors` rows. When lifetime traffic predates the first daily aggregate, `/admin` explicitly reports that pre-upgrade history is unknown.

Compatibility columns from earlier versions remain in existing SQLite files but are cleared during initialization and excluded from every read and write projection:

- `visitors.region`, `city`, `latitude`, `longitude`, and `userAgent`;
- `audit_log.ipAddress`;
- `contact_submissions.ipAddress` and `userAgent`; and
- `security_events.ipAddress`.

Rate-limit keys and security-event network references are purpose-scoped salted SHA-256 values prefixed with `sha256:`. Legacy unhashed rate-limit identifiers are removed on initialization.

## Query and access boundaries

`getAdminHistoricalAnalytics` in `src/lib/db.ts` performs aggregation, bucketing, country comparison, and previous-period summaries in SQLite/libSQL. It returns bounded aggregate rows only.

Supporting indexes:

- `visitor_daily_activity(day)`;
- `visitor_daily_activity(countryCode, day)`;
- `notification_delivery_events(createdAt)`;
- `notification_delivery_events(status, createdAt)`; and
- `accounts(createdAt)`.

The function is invoked by `src/app/admin/page.tsx` only after the signed-in role gate. Moderators can use review queues but do not execute or receive historical analytics. No route handler exposes these queries.

## Rendering and accessibility

`src/components/admin/historical-analytics.tsx` uses server-rendered inline SVG rather than a chart package. This choice:

- adds no client JavaScript or chart dependency;
- keeps rendering deterministic;
- avoids loading a visualization runtime on an already dense admin route; and
- allows the same aggregate payload to produce print-friendly HTML.

Every SVG figure has a programmatic title and description. Each mark exposes an exact-value SVG title, and all chart data is repeated in expandable semantic HTML tables with captions, scoped headers, and keyboard-operable disclosure controls. Country comparisons include text values alongside color. Forced-colors mode replaces palette fills and strokes with system colors.

## Browser evidence

Local review used the isolated `output/playwright/kenmatch-review.sqlite` database and owner-only test-auth route.

- `output/playwright/admin-historical-analytics-desktop-1366.png`
- `output/playwright/admin-historical-analytics-mobile-390.png`
- `output/playwright/admin-historical-charts-mobile-390.png`

Verified behavior:

- clean schema initialization from a fresh Next.js process;
- 30-day/day and 90-day/month views;
- query-string and anchor persistence;
- current and equal previous period labels;
- chart accessible names and exact-value tables;
- intentional horizontal scrolling only inside wide data tables;
- `scrollWidth === clientWidth` at 390px for the document; and
- no post-fix browser console error or hydration warning.
