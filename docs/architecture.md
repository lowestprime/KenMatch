# KenMatch Architecture

## Stack

- Next.js 16 App Router
- React 19
- Tailwind CSS v4 plus custom CSS variables and theme classes
- libSQL TypeScript client for local-file or remote persistence
- Account-backed signed-in cookies
- Server Actions for sign-in, sign-up, voting, comments, Ken submission, and sponsor intake
- Optional Cloudflare Turnstile and Stripe Checkout integrations for public abuse control and live sponsorship checkout

## Route structure

- `src/app/page.tsx`
  - Overview page with featured Kens, funding snapshot, governance preview, and contributor sample.
- `src/app/kens/page.tsx`
  - Bounded public board with search, category, lane, status, sort, reset, and page controls.
- `src/lib/discovery.ts` and the marketplace CTEs in `src/lib/db.ts`
  - Canonical filter URLs, deterministic reason-labeled discovery, proposer/category diversity, stable tie-breaks, bounded SQL pagination, and viewer-state loading restricted to the selected page.
- `src/app/kens/[slug]/page.tsx`
  - Ken detail view with timing metadata, launch window, compute progression, audit timeline, comments, governance log, and funding context.
- `src/lib/allocation-policy.ts` and `src/components/ken-lifecycle-map.tsx`
  - One canonical eight-stage lifecycle, mechanism callouts, persisted-state mapping, and responsive interactive/print renderers shared by Overview, Governance, and Ken detail.
- `src/app/submit/page.tsx`
  - Ken intake form with tier-aware guidance.
- `src/app/governance/page.tsx`
  - Attestation ladder, blocked Kens, governance log, and category health.
- `src/app/economics/page.tsx`
  - Treasury summary, revenue streams, sponsor commitments, sponsor intake, reserve coverage, and ledger entries.
- `src/app/auth/page.tsx`
  - Account creation and sign-in.
- `src/app/forgot-password/page.tsx`, `src/app/reset/page.tsx`, and `src/app/verify/page.tsx`
  - Email-backed password reset and account verification flows.
- `src/app/account/page.tsx`
  - Profile editing, avatar customization, verification request, bookmarks, and account state.
- `src/app/about/page.tsx`
  - Public About / Contact page with owner-only online editing.
- `src/app/verification/page.tsx`
  - Public identity-verification criteria and participation guidance.
- `src/app/admin/page.tsx`
  - Role-gated operations portal for visitors, privacy-safe historical analytics, notification health, verifications, roles, moderation, and audit log review.
- `public/icon-light.svg`, `public/icon-dark.svg`, `public/*icon*.png`, `src/app/manifest.webmanifest/route.ts`, and the compatibility redirects under `src/app/icon.svg/` and `src/app/apple-touch-icon.svg/`
  - Exact static production icons and previews, one manifest implementation, and redirects that prevent legacy icon URLs from serving a stale second design.
- `src/components/ken-visual.tsx`, `src/lib/taxonomy.ts`, and `public/category-icons/{dark,light}/*.svg`
  - The live, theme-aware Ken category identity v2 renderer plus exact static dark/light reference exports, sharing the production spectrum perimeter and radial jewel while preserving dynamic category, stage, tier, and database-override semantics.
- `src/app/tasks/*`
  - Redirect layer for legacy URLs.
- `src/app/api/health/route.ts`
  - Health probe with public-safe and token-gated detailed responses.
- `src/app/api/stripe/webhook/route.ts`
  - Stripe webhook handler for promoted sponsor commitments.

## Data model

The main data logic lives in `src/lib/db.ts`.

### Core records

- profiles
- accounts
- sessions
- categories
- tasks (internal compatibility name for Kens)
- task_finance
- votes
- task_pulse_votes
- comments
- comment_votes
- runs
- task_timings
- run_updates
- checkpoints
- checkpoint_gates
- governance_events
- revenue_streams
- treasury_entries
- sponsorship_commitments
- profile_attestations
- email_tokens
- bookmarks
- visitors
- visitor_daily_activity
- notification_delivery_events
- site_settings
- audit_log
- request_rate_limits
- security_events

### Why the model is split this way

- `votes` and `task_pulse_votes` are separate so public signal does not collapse into scarce allocation voice.
- `task_timings` and `run_updates` make launch timing, partial delivery, early completion, and long-run auditing explicit.
- `ken_submissions` holds the private intake state for user-created Kens. Seeded demonstration Kens have no intake row, preserving their existing public behavior.
- `review_events` is an append-only, deduplicated decision history shared by Ken and category intake. Public and internal notes are stored separately.
- `src/lib/intake-review.ts` produces versioned deterministic readiness snapshots. These checks are advisory and never publish or suppress records.
- `src/lib/review-policy.ts` enforces role boundaries, own-submission conflicts, permanent recusal, public reasons, idempotent final actions, and two-person approval for high-risk work.
- `/admin` exposes bounded, filterable review queues; `/account#submission-reviews` exposes only the submitter-safe history; `/reviews` publishes final explanations without private reviewer notes.
- `task_finance`, `revenue_streams`, and `treasury_entries` keep funding logic visible without turning governance into a pricing layer, and economics summaries separate committed support from projected support.
- `sponsorship_commitments` tracks projected, simulated, checkout-pending, and paid funding states separately from the immutable treasury ledger.
- `profile_attestations` separates standing, review status, and sybil-risk signals from profile copy, while `src/lib/attestation.ts` converts that state into participation limits and voice caps.
- `email_tokens` powers email verification and password reset links.
- `visitors` retains the purpose-salted lifetime visitor signature and country-level state; `visitor_daily_activity` provides bounded daily aggregate history without raw IP, user-agent, or precise geography.
- `notification_delivery_events` stores delivery outcome, transport source, purpose, recipient count, and time without recipients, subjects, or message content.
- `site_settings` and `audit_log` support notification settings, online About-page editing, and durable redacted audit trails.
- `request_rate_limits` and `security_events` keep public-host abuse controls durable across restarts and deploys using purpose-scoped salted network hashes rather than raw IP addresses.

## UI system

The visual system is centered in `src/app/globals.css`.

`globals.css` is the single owner of semantic Light/OLED palette tokens. `src/components/release-polish-styles.tsx`, `release-hardening-styles.tsx`, and `community-polish-styles.tsx` contain component structure only and must not redefine the page, panel, ink, line, or accent systems. Generic panels are opaque, low-cost surfaces; blur is reserved for functional overlay layers. The evidence and route matrix for this decision are recorded in `docs/visual-system-and-long-page-audit.md`.

### Themes

- `light`
- `oled`

The theme toggle writes only `light` or `oled` to `localStorage`. The layout boot script migrates any old `dark` value to `oled` before hydration.

### Core UI pieces

- `src/components/site-shell.tsx`
  - Compact sticky header, brand, navigation, participation state display, and footer.
- `src/components/reading-progress.tsx`
  - Actual-height-gated reading progress for the five editorial long-form routes; it is intentionally absent from feed, submission, detail, account, and admin workflows.
- `src/components/kenmatch-mark.tsx`
  - Product mark used in the header, footer, and generated icon family.
- `src/components/ken-timing-strip.tsx`
  - Countdown, submission age, compute usage, and progression display.
- `src/components/task-card.tsx`
  - Ken cards for the board and overview page.
- `src/components/task-pulse-panel.tsx`
  - Public upvote/downvote signal panel.
- `src/components/vote-panel.tsx`
  - Quadratic voice allocation panel with visible voice cap.
- `src/components/discussion-thread.tsx`
  - Threaded comments and comment voting.
- `src/components/proposal-form.tsx`
  - Ken intake form.
- `src/components/auth-panels.tsx`
  - Sign-in and sign-up UI.
- `src/components/forgot-password-form.tsx` and `src/components/reset-password-form.tsx`
  - Account recovery UI.
- `src/components/profile-editor.tsx`
  - Account profile, avatar, external link, and verification-request UI.
- `src/app/people/[slug]/page.tsx`
  - Linked public profile surface for contributors referenced from Kens and comments; `/people` itself redirects to the Ken board rather than exposing a directory.
- `src/components/about-editor.tsx`

Admin audit history is fetched with `listAuditLogPage` in `src/lib/db.ts`. Filtering and pagination happen in SQL, metadata redaction is centralized in `src/lib/audit-log.ts`, and the admin renderer exposes complete event bodies through expandable/copyable details instead of a fixed-height nested scroller.
  - Owner-only online About / Contact editor.
- `src/components/admin/*`
  - Admin and owner management surfaces.
- `src/components/admin/historical-analytics.tsx`
  - Owner/admin-only server-rendered traffic, account, country, and notification trends with equal previous-period comparisons and semantic table equivalents.
- `src/components/visitor-map.tsx`
  - Anonymized country-level visitor geography display based on Cloudflare country headers and deterministic country centroids.
- `src/components/sponsor-form.tsx`
  - Public sponsorship intake with general, category, Ken, or safety-reserve restriction options.
- `src/components/turnstile-widget.tsx`
  - Optional Cloudflare Turnstile widget for higher-risk forms.

## Accounts and sign-in

- `src/lib/session.ts` reads and writes the signed-in account cookie.
- `src/app/actions.ts` creates accounts, opens sign-ins, sends verification/reset email, enforces rate limits, and clears sign-ins.
- `src/lib/db.ts` stores accounts, hashed session tokens, email tokens, profile state, and licensing-consent state.
- `src/lib/mail.ts` dispatches SMTP-backed verification, password reset, and admin notification messages when SMTP is configured.

## Deployment model

- `next.config.ts` enables standalone output and the deployment build settings used by this repo.
- `npm run build` runs Next's experimental compile mode and then generate-env mode so the standalone artifact has its static environment inlined before Docker copies it; `scripts/repair-next-route-chunks.mjs` then verifies app-route chunk references and repairs single clear hash-name mismatches before deployment.
- `src/proxy.ts` enforces host filtering, cross-site request blocking, and security headers for public deployments. Next.js 16 reports it as the app proxy/middleware boundary in production builds.
- `Dockerfile` runs the standalone server generated by `npm run build` as a non-root user, with OCI source labels and a container healthcheck.
- `docker-compose.synology.yml` mounts persistent app data, uses a read-only root filesystem, tmpfs for `/tmp`, and binds only to loopback.
- `docker-compose.synology.tunnel.yml` adds a `cloudflared` sidecar option for Synology-hosted public deployments.
- `public/.gitkeep`, the exact SVG/PNG/ICO icon family, and the static `og-image.png` / `share-image.png` pair keep browser and preview metadata byte-stable; `npm run start` copies those assets into `.next/standalone` before launching the standalone server.

## Economics engine

- `src/lib/economics.ts` computes revenue stream summaries, treasury coverage, and the treasury governor split.
- `summarizeEconomics` aggregates revenue streams, treasury entries, and sponsorship commitments into the `EconomicsSummary` used by public economics surfaces.
- Revenue engines include `enterprise`, `data-licensing`, `compute-arbitrage`, `sponsorship`, and `private-lane`.

## Seed data

- `src/lib/seed.ts` holds realistic demo Kens and categories.
- `src/lib/seed-plus.ts` adds attestation state, timing, audit updates, structured treasury entries, sponsor commitments, the private-lane revenue stream, and simulated model-outcome data.

The current demo intentionally includes both desirable Kens and a blocked offensive example so the visible governance boundary can be inspected in the public UI.
