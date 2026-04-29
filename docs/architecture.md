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
  - Public board with search, category, lane, and status filters.
- `src/app/kens/[slug]/page.tsx`
  - Ken detail view with timing metadata, launch window, compute progression, audit timeline, comments, governance log, and funding context.
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
  - Role-gated operations portal for visitors, notifications, verifications, roles, moderation, and audit log review.
- `src/app/icon.svg/route.ts`, `src/app/icon-dark.svg/route.ts`, `src/app/apple-touch-icon.svg/route.ts`, `src/app/manifest.webmanifest/route.ts`, and `public/*icon*.png`
  - Route-backed SVG icons, static preview-safe PNG/ICO assets, and web manifest entries for browser tabs, installed surfaces, and rich-message previews.
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
- site_settings
- audit_log
- request_rate_limits
- security_events

### Why the model is split this way

- `votes` and `task_pulse_votes` are separate so public signal does not collapse into scarce allocation voice.
- `task_timings` and `run_updates` make launch timing, partial delivery, early completion, and long-run auditing explicit.
- `task_finance`, `revenue_streams`, and `treasury_entries` keep funding logic visible without turning governance into a pricing layer, and economics summaries separate committed support from projected support.
- `sponsorship_commitments` tracks projected, simulated, checkout-pending, and paid funding states separately from the immutable treasury ledger.
- `profile_attestations` separates standing, review status, and sybil-risk signals from profile copy, while `src/lib/attestation.ts` converts that state into participation limits and voice caps.
- `email_tokens` powers email verification and password reset links.
- `visitors`, `site_settings`, and `audit_log` support owner/admin operations, visitor mapping, notification settings, online About-page editing, and durable audit trails.
- `request_rate_limits` and `security_events` keep public-host abuse controls durable across restarts and deploys.

## UI system

The visual system is centered in `src/app/globals.css`.

### Themes

- `light`
- `oled`

The theme toggle writes only `light` or `oled` to `localStorage`. The layout boot script migrates any old `dark` value to `oled` before hydration.

### Core UI pieces

- `src/components/site-shell.tsx`
  - Compact sticky header, brand, navigation, participation state display, and footer.
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
  - Owner-only online About / Contact editor.
- `src/components/admin/*`
  - Admin and owner management surfaces.
- `src/components/visitor-map.tsx`
  - Anonymized visitor geography display based on persisted Cloudflare request headers.
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
- `public/.gitkeep`, generated PNG favicons, `favicon.ico`, and `og-image.png` keep preview metadata available to crawlers and mobile message apps; `npm run start` copies those assets into `.next/standalone` before launching the standalone server.

## Economics engine

- `src/lib/economics.ts` computes revenue stream summaries, treasury coverage, and the treasury governor split.
- `summarizeEconomics` aggregates revenue streams, treasury entries, and sponsorship commitments into the `EconomicsSummary` used by public economics surfaces.
- Revenue engines include `enterprise`, `data-licensing`, `compute-arbitrage`, `sponsorship`, and `private-lane`.

## Seed data

- `src/lib/seed.ts` holds realistic demo Kens and categories.
- `src/lib/seed-plus.ts` adds attestation state, timing, audit updates, structured treasury entries, sponsor commitments, the private-lane revenue stream, and simulated model-outcome data.

The current demo intentionally includes both desirable Kens and a blocked offensive example so the visible governance boundary can be inspected in the public UI.
