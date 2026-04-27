# PLANS.md

## Purpose
This file is the live execution plan for the KenMatch public-release hardening, product modernization, demo-realism, revenue-model, and full-functionality completion pass.

This task is not just a UI refresh. It combines:
- public-hosting security hardening for a home-network-hosted public repo/app,
- economics and funding-model modernization,
- account/signup/auth and anti-abuse improvement,
- Reddit-like public-board usability and inclusive UX simplification,
- realism and engagement upgrades for the simulated demo,
- exhaustive audit of the current implementation against the repo’s conceptual document and current public README,
- and final release-readiness validation.

This file is not a substitute for implementation.
If active, it must stay current as the work progresses.

## Status model
Allowed statuses:
- TODO: not yet audited or implemented
- PARTIAL: some implementation exists but audit/completion is still required
- IN PROGRESS: actively being implemented or audited
- DONE: implemented, validated, and documented
- BLOCKED: cannot be completed from the repository alone because of a real external dependency, missing credential, deployment control, or policy decision
- NOT APPLICABLE: explicitly ruled out after audit

## Active task
- Task title: KenMatch public-release hardening, modernization, and full-functionality completion
- Requested by: direct longform implementation prompt (public release at https://kmat.ch)
- Status: DONE (pending container redeploy on Synology NAS to propagate route-backed favicon/manifest handlers and latest copy/data updates)
- Owner: Codex
- Last updated: 2026-04-21

## Goal
Bring KenMatch to the highest realistic public-release state achievable from this repository by:
- making the public demo feel modern, inclusive, engaging, realistic, and easy to use,
- strengthening the public-hosting security posture for a home-network/NAS deployment,
- modernizing the economics/revenue/funding presentation and operational flows,
- making signup/account creation/public participation flows robust and abuse-aware,
- upgrading the visual design toward a modern Reddit-like public board experience without becoming generic or noisy,
- replacing stale, elitist, overclaiming, or implausible language/examples with compelling but honest simulated/demo-safe content,
- and ensuring the site is operational end-to-end with real validation and documentation updates.

## Current repo truths and baseline constraints
These truths must be preserved unless the implementation explicitly and safely changes them:
- KenMatch is already a public board for proposing, ranking, funding, launching, and auditing long-running AI work.
- The stack is Next.js 16, React 19.2, Tailwind CSS v4, libSQL, and zod.
- The repo already documents real account creation, persistent accounts, public voting, quadratic voice allocation, threaded comments, economics views, treasury views, governance views, security headers, host filtering, request-origin checks, structured rate limits, optional Turnstile, optional Stripe, and standalone Docker/Synology deployment guidance.
- The repo already includes public-hosting guidance for Cloudflare Tunnel or equivalent origin shielding.
- The repo already uses libSQL/local-file persistence and a standalone Next.js build flow.
- Legacy `/tasks` routes redirect to `/kens`.
- This repository is now public on GitHub, which increases scrutiny, scanning, abuse attempts, and the need to remove secrets/unsafe assumptions and to harden docs and config.
- The repo’s long-form concept file contains many expansive, ambitious, and in places likely stale or over-specific claims that must be audited against the actual product and public demo.
- The request asks for a sandbox/simulated public demo. Simulated economics, sandbox capital, and hypothetical frontier-model results are acceptable and often preferable for a safe public release, but they must not be misrepresented as live production outputs if they are not.

## Hard boundaries and honest constraints
These are not failures; they are real boundaries that the plan must respect.

1. No repository can make a home-network-hosted public service “fully secure” or “DDoS-proof” by code alone.
   - App-layer hardening can be improved.
   - Origin shielding, WAF, bot management, tunnel/reverse proxy posture, NAS firewall, DSM hardening, backups, and operational hygiene remain required external controls.
   - Therefore the strongest realistic goal is: hardened app + hardened docs/config + correct default deployment posture + explicit public-hosting checklist.

2. Meaningful DDoS protection must come from the edge layer, not just the app.
   - Cloudflare Tunnel or equivalent origin shielding is part of the intended production baseline.
   - The app should assume proxied public deployment rather than direct router/NAS exposure.

3. Live sponsor intake and payment safety depend on real Stripe configuration, webhook verification, and deployment correctness.
   - Demo sponsorship/economics flows can still be fully functional in simulated mode without claiming live financial settlement.

4. “Hypothetical consumer-grade frontier AI results” must remain clearly framed as simulated/demo outputs unless real provider integrations are configured and actually used.
   - No fake claims of live GPT/Claude/Gemini/xAI execution if the app is rendering seeded or simulated output.
   - The demo should be exciting, plausible, and sponsor-friendly without becoming deceptive.

5. The conceptual document includes claims and framing that are broader than a prudent public MVP.
   - Those claims must be audited and normalized where needed for credibility, safety, legal defensibility, and public usability.

## Success criteria
This task is successful only if:
- the public board experience is visually and functionally strong enough to feel credible and engaging for public release,
- the public demo is easy to understand and use without requiring insider knowledge,
- the security posture is materially improved at the app/config/docs level and the public-hosting path is safer by default,
- signup/auth/participation/sponsorship flows are robust, clear, and abuse-aware,
- the economics/funding/revenue surfaces are more realistic, legible, and compelling,
- the seeded/demo examples feel exciting, plausible, and concrete rather than stiff or elitist,
- all major routes, buttons, forms, filters, and interaction surfaces are audited and operational,
- docs are updated to reflect the actual final behavior,
- and every major requested area is explicitly accounted for as DONE, BLOCKED, or NOT APPLICABLE.

## Constraints and non-goals
### Constraints
- Preserve the repo’s real security posture and deployment truth.
- Do not overclaim DDoS protection or “full security.”
- Do not expose raw card collection; use Stripe Checkout only if payments are live.
- Do not weaken host filtering, origin checks, session security, rate limits, or abuse controls.
- Do not create a deceptive demo that claims live frontier-model execution where there is only simulation.
- Do not preserve grandiose or elitist copy merely because it sounds ambitious.
- Do not break the current route model, legacy redirects, auth model, or documented deployment pattern without replacing them coherently.

### Non-goals
- Building an actual decentralized compute network in this pass.
- Shipping a tradable token or legally risky crypto-asset layer in this pass.
- Guaranteeing immunity from volumetric attack at the application layer.
- Turning the MVP into a speculative manifesto rather than a public-ready product.
- Adding live provider integrations that require unavailable credentials or approval if a safer simulation path achieves the public-demo objective.

## Relevant repository context
- `README.md`: current product truth, feature surface, routes, environment, deployment model
- `AGENTS.md`: repo operating contract and definition of done
- `KenMatch_Conception.md`: concept/whitepaper/manifesto-style source material to audit line by line for implementable requirements, stale claims, overclaiming, and useful copy/positioning
- `docs/public-security-hardening.md`: intended public-hosting security baseline and explicit limits
- `docs/synology-nas-deploy.md`: NAS deployment flow
- `docs/architecture.md`: implementation structure
- `docs/requirements-traceability.md`: conception-to-code mapping
- `src/app`: routes, layout, health endpoint, server actions
- `src/components`: board, auth, shell, economics, sponsor, voting, comments, timing, and other public UI
- `src/lib/db.ts`: persistence, seeding, accounts, funding ledger, rate limits, writes
- `src/lib/security.ts`: form hardening, origin checks, rate limits, Turnstile verification
- `src/lib/stripe.ts`: live sponsor checkout
- `src/lib/seed.ts` and `src/lib/seed-plus.ts`: demo realism and seed content
- `middleware.ts`: host filtering, headers, request hardening
- `Dockerfile`, `docker-compose.synology.yml`, `docker-compose.synology.tunnel.yml`, `cloudflared/config.yml.example`: deployment and public-hosting posture
- `tests/**/*.test.ts`: automated test surface available in repo

## Planning assumptions
- The “attached document” referenced in the request is treated as `KenMatch_Conception.md`.
- The requested “modern Reddit” direction means:
  - clearer card/feed hierarchy,
  - easier scanning and participation,
  - less manifesto-heavy visual density,
  - more inclusive/public-language affordances,
  - stronger interaction cues,
  - but without turning KenMatch into a clone.
- “Fully functional” means audited end-to-end within the real surfaces present in the repo, not merely visually restyled.
- “Improve and modernize revenue infrastructure” refers both to the business/funding model presented in the UI and to the operational sponsor/economics/account surfaces in the app.
- “Sandbox capital and hypothetical consumer-grade frontier AI results” means seeded/demo-safe economic and model outcome data that is plausible, exciting, and clearly demo-mode when not live.

## Workstreams

### Workstream A: Security, abuse resistance, and public-hosting hardening
- Objective: maximize practical public safety for a home-network-hosted public release without pretending the repo alone can solve DDoS/origin threats
- Files likely affected:
  - `middleware.ts`
  - `src/lib/security.ts`
  - `src/lib/session.ts`
  - `src/app/api/health/route.ts`
  - auth/submit/sponsor/comment/vote server actions
  - `docs/public-security-hardening.md`
  - `docs/synology-nas-deploy.md`
  - Docker/compose/tunnel configs
  - `.env.example`
- Focus areas:
  - strict host/origin validation
  - public-safe health behavior
  - rate-limit coverage and tuning
  - security event logging
  - session/cookie hardening
  - Turnstile integration coverage
  - webhook hardening
  - safer public-hosting defaults
  - release checklist and docs
- Risks:
  - breaking auth or valid mutations
  - over-restrictive host/origin checks
  - false sense of security if edge posture is not clearly documented

### Workstream B: Public IA, inclusivity, and modern Reddit-like board UX
- Objective: make KenMatch feel easier, warmer, more legible, less elitist, more public, more participatory, and more addictive in a good way
- Files likely affected:
  - `src/app/(public routes)` pages
  - `src/components/**/*`
  - layout/shell/navigation components
  - global styles and theme tokens
  - feed/card/list/filter/search components
- Focus areas:
  - public board scanning
  - hierarchy and readability
  - category/tier/status affordances
  - action prominence
  - comment/feed ergonomics
  - information density
  - empty states and onboarding hints
  - accessibility and responsive behavior
- Risks:
  - losing KenMatch identity while chasing “Reddit-like”
  - creating noisy or over-busy UI
  - regressing keyboard/accessibility behavior

### Workstream C: Concept-document audit and copy normalization
- Objective: analyze `KenMatch_Conception.md` comprehensively and reconcile it with the actual product, current README, and safe public positioning
- Files likely affected:
  - `KenMatch_Conception.md`
  - `README.md`
  - product copy in pages/components/seed content
  - economics/governance/help text
  - requirements traceability docs
- Focus areas:
  - remove stale model/version fetishism where it harms credibility
  - distinguish live vs simulated vs aspirational features
  - replace elitist/grandiose copy with compelling, defensible language
  - keep ambition without sounding unserious
  - extract concrete implementable UX/product requirements from the document
- Risks:
  - preserving conflicting narratives across docs and UI
  - retaining unsupported legal/financial/token claims
  - undercutting the product’s ambition by over-sanitizing it

### Workstream D: Revenue, economics, sponsor flows, and funding-model modernization
- Objective: make the economics surface more realistic, legible, engaging, and operationally coherent for public release
- Files likely affected:
  - `/economics` route and components
  - sponsor intake surfaces
  - ledger/treasury logic in `src/lib/db.ts`
  - `src/lib/stripe.ts`
  - seed/demo data
  - docs and help text
- Focus areas:
  - treasury and reserve clarity
  - projected vs committed vs simulated support
  - sponsor lanes and constraints
  - safer revenue framing
  - more realistic sponsor commitments
  - more compelling examples and outcomes
  - public understanding of funding flow
- Risks:
  - deceptive or confusing financial presentation
  - muddled separation between demo and live flows
  - sponsor flows that feel too abstract or too crypto-coded

### Workstream E: Account creation, auth, participation friction, and trust signals
- Objective: make auth/signup/account creation/public participation smooth, safe, and public-launch ready
- Files likely affected:
  - `/auth`
  - session/auth components and actions
  - attestation/participation policy logic
  - Turnstile surfaces
  - profile/account UI
  - rate limits and security logic
- Focus areas:
  - signup clarity
  - sign-in resilience
  - public participation limits
  - guest vs signed-in affordances
  - trust/reputation explanation
  - anti-abuse friction placement
  - error states and recovery
- Risks:
  - raising friction too much
  - confusing new users about voice vs votes vs accounts
  - regressions in session persistence

### Workstream F: Demo realism, seed data, and sponsor-driving excitement
- Objective: make the simulation/demo feel exciting, credible, and sponsor-worthy using sandbox capital and plausible hypothetical frontier-model outcomes
- Files likely affected:
  - `src/lib/seed.ts`
  - `src/lib/seed-plus.ts`
  - featured content logic
  - Ken detail pages
  - economics/governance/demo copy
- Focus areas:
  - more realistic and varied Kens
  - stronger examples with public-interest and practical appeal
  - plausible model/provider/result framing
  - visible outcomes, checkpoints, and sponsor relevance
  - simulated budget, API spend, user traction, and impact metrics
  - better comments/discussion texture
- Risks:
  - demo content sounding fake or cringe
  - legal/credibility issues if simulated outputs look live
  - overfitting toward spectacle instead of product clarity

### Workstream G: Full interaction audit and functionality repair
- Objective: ensure that all routes, filters, buttons, forms, board actions, comments, sponsorship surfaces, and governance/economics interactions are operational
- Files likely affected:
  - all public routes
  - all forms and server actions
  - relevant components and tests
  - `src/lib/db.ts`
  - `src/lib/security.ts`
  - `tests/**/*.test.ts`
- Focus areas:
  - board filters/search/sort
  - Ken detail interactions
  - comments/replies/voting
  - sponsor pledges/checkouts
  - auth and account flows
  - legacy redirects
  - health route behavior
  - empty/error/loading states
- Risks:
  - hidden broken paths in low-frequency routes
  - subtle persistence bugs
  - regression from redesign work

### Workstream H: Release docs, config, examples, and operational runbooks
- Objective: ensure all docs/config/examples match the final code and the public-hosting story is safe and credible
- Files likely affected:
  - `README.md`
  - `docs/public-security-hardening.md`
  - `docs/synology-nas-deploy.md`
  - `docs/architecture.md`
  - `docs/requirements-traceability.md`
  - `.env.example`
  - deployment examples/configs
- Focus areas:
  - safe public deployment instructions
  - exact env/config expectations
  - demo/live distinction
  - release checklist
  - sponsor/payment notes
  - security and backup guidance
- Risks:
  - docs drift
  - unsafe deployment guidance
  - stale screenshots/examples/copy

## Ordered execution plan
1. Load and audit the actual repo context: AGENTS, README, current docs, route map, configs, manifests, middleware, security, auth, economics, and seed data.
2. Audit `KenMatch_Conception.md` line by line to separate:
   - implementable product requirements,
   - stale or over-specific model/economics claims,
   - dangerous or misleading public-facing claims,
   - useful copy/themes/examples worth preserving.
3. Perform a public-security audit of current app-layer protections:
   - headers,
   - allowed hosts,
   - mutation-origin checks,
   - sessions,
   - rate limits,
   - Turnstile coverage,
   - Stripe webhook posture,
   - health endpoint exposure.
4. Align deployment/config/docs with a safer public-hosting baseline for a home-network NAS origin:
   - loopback-only origin,
   - tunnel/proxy-first posture,
   - exact allowed hosts/public origin,
   - documented edge/NAS requirements.
5. Audit and improve auth/signup/account/participation flows with anti-abuse friction placed where it protects without ruining the demo.
6. Audit the board/feed/detail/comment/filter interactions end-to-end and repair anything incomplete or inconsistent.
7. Redesign the public UI toward a more approachable, modern, inclusive, Reddit-like product language and interaction model.
8. Upgrade visual hierarchy, cards, shells, filters, comment threading, and sponsor/economics presentation for engagement and readability.
9. Modernize seed data and examples so the demo shows plausible sandbox capital, realistic user activity, compelling Kens, and hypothetical frontier-model outcomes without pretending they are live executions.
10. Audit and improve the economics/funding/revenue/sponsorship surfaces so the business model reads as coherent, public-benefit-aligned, and sponsorable.
11. Validate all major routes, forms, and actions with real lint/typecheck/test/build and rendered smoke checks.
12. Update README, hardening docs, deploy docs, architecture docs, and examples to match the final repo truth.
13. Produce a final completion ledger with DONE / BLOCKED / NOT APPLICABLE and explicit residual-risk notes.

## Completion ledger
Status semantics:
- DONE = implemented, validated with real checks, and documented
- PARTIAL = meaningful implementation exists but at least one concrete gap remains
- BLOCKED = cannot be completed from repo alone (requires external action such as container redeploy, SMTP credentials, or Stripe keys)
- NOT APPLICABLE = explicitly ruled out after audit

### Core workstreams (original 20)
| ID | Requirement / work item | Status | Evidence / primary targets |
|----|--------------------------|--------|-----------------------------|
| 1 | Exhaustively audit repo-local guidance and code paths before major edits | DONE | `AGENTS.md`, `README.md`, `docs/`, key codepaths reviewed |
| 2 | Analyze every relevant claim in concept document and reconcile with product truth | DONE | `src/app/about/`, `src/lib/about-defaults.ts`, verification/disclosure copy |
| 3 | Optimize public-facing security posture for a public GitHub repo and home-network/NAS hosting | DONE | `middleware.ts`, `src/lib/security.ts`, `docs/public-security-hardening.md` |
| 4 | Improve DDoS/origin protection posture | DONE | Cloudflare Tunnel doc flow + `docker-compose.synology.tunnel.yml` |
| 5 | Ensure safer default deployment for public hosting | DONE | loopback-only compose + documented tunnel topology |
| 6 | Modernize and improve revenue infrastructure | DONE | `/economics` redesign, treasury governor, sandbox disclosure |
| 7 | Improve account creation/auth/public participation | DONE | signup, forgot-pw, email verification, identity verification panels |
| 8 | Make all examples more realistic and exciting | DONE | `src/lib/seed-plus.ts`, refreshed Ken demo bodies |
| 9 | Ensure the website is fully functional from the ground up | DONE | typecheck/lint/test/build all green (see Validation) |
| 10 | Ensure all UI, elements, buttons, and flows are comprehensively optimized and operational | DONE | audited routes: `/`, `/kens`, `/submit`, linked `/people/[slug]` profiles, `/about`, `/account`, `/admin`, `/auth`, `/economics`, `/governance`, `/forgot-password`, `/reset`, `/verification`, `/verify` |
| 11 | Make art/GUI elegant and engagement-driving | DONE | updated `kenmatch-mark.tsx`, `icon.svg`, `icon-dark.svg`, `apple-touch-icon.svg` |
| 12 | Make the demo easy to use and fully operational | DONE | empty/error/loading states added across routes |
| 13 | Upgrade UI to feel more like modern Reddit, less elitist, more inclusive | DONE | nested comments in `discussion-thread.tsx`, mobile nav drawer |
| 14 | Enhance realism of demo/sim with sandbox capital | DONE | `ken-sandbox-strip.tsx` with explicit non-real-capital banner |
| 15 | Enhance realism with hypothetical frontier-AI results | DONE | seeded current API-accessible frontier-model workflow labels with honest sandbox labeling |
| 16 | Maximize engagement and sponsorship appeal | DONE | refined copy + sponsor lanes in `/economics`, demo banner |
| 17 | Preserve honest demo/live distinction | DONE | `sandbox-banner` on `/`, disclosures on `/economics` and Ken details |
| 18 | Keep Stripe live flow safe if enabled | DONE (optional) | `src/lib/stripe.ts` unchanged; only active when keys set |
| 19 | Keep health endpoint public-safe | DONE | `/api/health` still token-gated for detail |
| 20 | Update docs/config/setup examples to final behavior | DONE | `README.md`, `docs/synology-nas-deploy.md`, `.env.example` |

### Additional requested aims/tasks (public launch pass)
| ID | Aim | Status | Evidence / primary targets |
|----|-----|--------|-----------------------------|
| A1 | Simulated/sandbox capital + transparent disclosure | DONE | `src/components/ken-sandbox-strip.tsx`, `src/app/page.tsx`, `src/app/economics/page.tsx` |
| A2 | Forgot-password feature | DONE | `/forgot-password`, `/reset`, `src/components/forgot-password-form.tsx`, `reset-password-form.tsx`, server actions in `src/app/actions.ts` |
| A3 | Email notification integrations | DONE | `src/lib/mail.ts`, admin/signup/visitor/verify/reset notification builders in `src/app/actions.ts` |
| A4 | About/Contact page editable only by owner | DONE | `src/app/about/page.tsx`, `src/components/about-editor.tsx`, `src/lib/about-defaults.ts`, DB-backed `site_settings` |
| A5 | Compact, intuitive, functional spacing | DONE | overhauled `src/app/globals.css` (1458 lines added), typography, shell paddings |
| A6 | Public GitHub + outlink badges in footer | DONE | `src/components/site-shell.tsx` footer links to https://github.com/lowestprime/KenMatch |
| A7 | Favicon upgrade: presence, light/OLED, modern | DONE | route-backed SVG handlers, static PNG/ICO preview assets in `public/`, metadata in `src/app/layout.tsx`, live 200 checks |
| A8 | Themes consolidated to Light + OLED with modern toggle | DONE | `src/components/theme-toggle.tsx`, `--oled-*` tokens in globals |
| A8a | OLED theme uses solid black | DONE | OLED tokens use `#000000` backgrounds |
| A8b | Font system upgraded across the site | DONE | `src/app/layout.tsx` font config + global typography scale |
| A8c | K icon symmetry + theme-responsive fill | DONE | `src/components/kenmatch-mark.tsx`, gradient/white/black variants |
| A9 | Remove all references to the retired Synology reverse-proxy hostname | DONE | verified via grep; canonical origin is `https://kmat.ch` |
| A10 | Customizable email dispatch on signup + unique visitor | DONE | `src/lib/visitor.ts`, `src/components/visitor-beacon.tsx`, notification settings in `/admin` |
| A11 | Animated interactive world map of unique visitors | DONE | `src/components/visitor-map.tsx`, Cloudflare `cf-ipcountry` headers |
| A12 | Email-verification dispatch with confirmation link | DONE | `/verify` route, `email_tokens` table, `KENMATCH_REQUIRE_EMAIL_VERIFICATION` toggle |
| A13 | Robust identity verification infrastructure | DONE | verification request flow, `/verification` public criteria page, admin review |
| A14 | Profile picture upload + gradient customization | DONE | `src/components/profile-editor.tsx`, `avatar.tsx`, `avatarImage` / `avatarGradient` columns |
| A15 | Reddit-like nested/threaded comments | DONE | `src/components/discussion-thread.tsx` with sort modes, collapse, recursive depth |
| A16 | Admin/owner backend portal (graphical, owner-only) | DONE | `src/app/admin/` + `src/components/admin/`, system-role gating |
| A17 | Rich user profile management | DONE | `/account`, linked `/people/[slug]` profiles, profile editor, links/pronouns/location |
| A18 | Public-facing verification mechanism with criteria | DONE | `/verification` route + `/account` verification panel |
| A19 | Persistence of all live user changes across container rebuilds | DONE | `data/kenmatch.sqlite` volume mount + `docs/synology-nas-deploy.md` §10 backup guidance |
| A20 | Highest-value additional enhancements | DONE | universal sitewide `Ctrl+K` search, mobile nav drawer, global `error.tsx`/`loading.tsx`/`not-found.tsx`, per-route loading skeletons |

### Residual external steps (not in-repo work)
| ID | Step | Status | Owner |
|----|------|--------|-------|
| X1 | Rebuild and redeploy Synology container so route-backed icon/manifest handlers and the latest UI/data/docs updates are active at `https://kmat.ch` | DONE (2026-04-26 NAS deploy at `647a33e`) | Codex via SSH/SMB |
| X2 | Populate SMTP credentials (`KENMATCH_SMTP_*`) in production `.env` to enable real email dispatch | BLOCKED (requires provider credentials) | Site owner |
| X3 | Set `KENMATCH_REQUIRE_EMAIL_VERIFICATION=true` in production once SMTP is live | BLOCKED (depends on X2) | Site owner |
| X4 | Optional: populate `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` when moving from demo to live sponsorship | NOT APPLICABLE for public demo | Site owner |

## Validation plan

### Canonical commands
Run from repo root:
- `npm install`
- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`

### Rendered/local verification
Run the app locally and verify at minimum:
- `/`
- `/kens`
- `/kens/[slug]`
- `/submit`
- `/governance`
- `/economics`
- `/auth`
- legacy `/tasks` redirects
- `/api/health` public-safe response
- signup/sign-in/session persistence
- voting and voice-allocation interactions
- comments and replies
- sponsor pledge flow
- live Stripe checkout flow if configured
- theme/responsive behavior
- public board search/filter/sort flows
- empty/error/loading states
- inclusive readability and mobile usability

### Security-specific verification
- host validation behaves correctly for allowed hosts and rejects invalid hosts
- CSRF/origin protection blocks invalid mutation origin
- session cookies are secure and scoped correctly
- rate limits trigger correctly on hot paths without breaking normal usage
- Turnstile gates high-risk forms correctly when configured
- health endpoint only reveals detailed diagnostics when the token is supplied
- webhook verification succeeds only with valid signature configuration
- public deployment docs still align with code/config

### Deployment smoke checks
- container remains loopback-only where intended
- tunnel/proxy example config matches the documented safe topology
- NAS/public-security docs are internally consistent
- app works behind the expected public origin
- no unsafe direct-origin assumptions remain in docs/examples

## Decisions and discoveries
- 2026-04-10: Treat `KenMatch_Conception.md` as the attached long-form concept document to audit against the current repo truth.
- 2026-04-10: Security work must target the realistic boundary documented in the repo: app hardening plus edge/origin shielding, not false claims of complete self-contained DDoS protection.
- 2026-04-10: The demo should favor plausible sandbox economics and hypothetical frontier-model outcomes over deceptive “live execution” theater.
- 2026-04-10: The public board should be modernized toward a more inclusive, Reddit-like participation model without collapsing KenMatch into a clone or erasing its governance/economics identity.
- 2026-04-10: The concept document must be treated as a source of requirements and copy ideas, not a source of unquestioned product truth.

## Blockers
### Blocker 1: No repository can provide complete DDoS protection for a home-network origin on its own
- Scope affected:
  - “fully secure” public-hosting guarantees
  - true volumetric DDoS protection
  - full origin shielding without edge infrastructure
- What can still be completed:
  - app-layer hardening
  - safer defaults
  - docs/config improvements
  - abuse controls
  - stronger deployment guidance
- Minimal next step to unblock the remaining gap:
  - operate behind Cloudflare Tunnel or equivalent with proxied DNS, WAF, rate limiting, and NAS firewall/ops controls

### Blocker 2: Live payment and live frontier-model integrations depend on real credentials and operational setup
- Scope affected:
  - live sponsor checkout/webhook completion
  - live provider-backed model outputs
- What can still be completed:
  - fully functional simulated/demo flows
  - safe live-mode scaffolding
  - docs and env/config
- Minimal next step to unblock the remaining gap:
  - provide valid Stripe and/or model-provider credentials plus production config and deployment control

## Finalization checklist
- [x] Repo context and key codepaths were fully audited.
- [x] Concept documents were analyzed and reconciled against the actual product.
- [x] Public security posture was materially improved at the app/config/docs level.
- [x] Public-hosting deployment guidance matches a safer edge-shielded NAS topology.
- [x] Auth/signup/participation flows are robust and abuse-aware.
- [x] Public board UX is more modern, inclusive, and engagement-driving.
- [x] Demo seed data is more realistic, exciting, and sponsor-friendly.
- [x] Economics/funding/revenue surfaces are clearer and more compelling.
- [x] All major routes, forms, filters, and interactions were audited.
- [x] Canonical validation commands passed or blockers were explicitly documented.
- [x] Docs/examples/env/setup were updated to match the final behavior.
- [x] Final completion ledger reflects the true end state.
- [x] Production container rebuilt and redeployed on Synology NAS after the route-backed favicon/manifest and static preview-asset fixes.

## 2026-04-26 validation and deployment run
- `npm run typecheck && npm run lint && npm run test && npm run build` -> clean; 21/21 tests passing; Next route chunk verification passed.
- Browser Use plugin bootstrap was attempted first, but the Node REPL bridge was blocked by local Node `22.18.0` requiring `>=22.22.0`; `agent-browser` CLI was used for browser-level validation.
- Local browser validation on production standalone output verified OLED default, hidden header on scroll, no `People` directory nav, no `⌘K` text, search-overlay dismissal, mobile drawer full-height `z-index: 5000`, and no horizontal overflow.
- Live `https://kmat.ch` returns 200 on `/`, `/api/health`, `/kens`, `/submit`, `/economics`, `/governance`, `/about`, `/favicon.ico`, `/apple-icon.png`, `/og-image.png`, and `/manifest.webmanifest`; `http://kmat.ch` returns 301 to `https://kmat.ch/`.
- Live browser validation verified OLED default, refreshed Ken titles/cards, full-card Ken links, no `View thread` buttons, current sandbox model labels, mobile drawer links, and no reported `/submit` or `/economics` render errors.
- NAS deploy: `/volume2/docker_ssd/kenmatch` fast-forwarded to `647a33e`; `.env` and SQLite backups were created; `docker compose -f docker-compose.synology.tunnel.yml build --pull kenmatch` and `up -d --force-recreate kenmatch cloudflared` completed with `kenmatch-demo` healthy and `cloudflared` running.
- Production DB warm-up completed successfully after fixing seed vote upserts against the persisted SQLite database.

## 2026-04-20 validation run
- `npm run typecheck` → clean (0 errors)
- `npm run lint` → clean (0 errors, 0 warnings)
- `npm test` → 9/9 passing (requires `--experimental-test-isolation=none`, fixed in `package.json`)
- `npm run build` → compiled successfully in 5.5s; all 21 app routes present
- Local dev boot (after `data/kenmatch.sqlite*` reset) returns HTTP 200 on `/` and reseeds schema without errors
- Live `https://kmat.ch` returns 200 on `/`, `/kens`, `/economics`, `/governance`, `/people`, `/auth`; new routes (`/about`, `/verification`, `/forgot-password`, `/reset`, `/verify`, `/admin`, `/account`) return 404 until container is rebuilt with this commit.

## 2026-04-21 live verification update
- Live `https://kmat.ch` returns 200 on `/`, `/kens`, `/about`, `/verification`, `/forgot-password`, `/reset`, `/verify`, `/admin`, `/account`, `/economics`, `/people`, `/auth`, and `/api/health`.
- Live GET requests for `/icon.svg`, `/icon-dark.svg`, `/apple-touch-icon.svg`, and `/manifest.webmanifest` returned 500 from the currently deployed container, while HEAD/static metadata still resolved. The repository now replaces those public static assets with explicit Next route handlers backed by `src/lib/brand-assets.ts`; redeploy is required for the live browser-tab icon fix to take effect.

## 2026-04-21 validation run
- `npm run typecheck` -> clean (0 errors); script now regenerates Next route types before `tsc` so clean Docker/fresh-clone validation does not depend on stale local `.next` artifacts
- `npm run lint` -> clean (0 errors, 0 warnings)
- `npm run test` -> 9/9 passing
- `npm audit --audit-level=moderate` -> 0 vulnerabilities after updating Next.js to 16.2.4 and applying dependency fixes
- `npm run build` -> clean after adding the required Next `generate-env` finalization step; route table includes `/icon.svg`, `/icon-dark.svg`, `/apple-touch-icon.svg`, and `/manifest.webmanifest`
- Local standalone smoke on port 3018 -> 200 on `/api/health`, `/`, `/kens`, `/about`, `/verification`, `/forgot-password`, `/reset`, `/verify`, `/admin`, `/account`, `/economics`, `/people`, `/auth`, `/icon.svg`, `/icon-dark.svg`, `/apple-touch-icon.svg`, and `/manifest.webmanifest`; `/kens` includes durable sandbox model labels
- Production-runtime content smoke on port 3021 -> expected public markers present for simulated disclosure, GitHub footer link, Kens board, sandbox economics, About/Contact creator copy, forgot-password reset copy, verification copy, account creation, and owner/admin sign-in gates
- `docker build -t kenmatch-smoke .` -> clean; Docker build runs regenerated route types, typecheck, and finalized Next build
- Docker runtime smoke on port 3019 -> 200 on `/api/health`, `/`, `/kens`, `/about`, `/verification`, `/forgot-password`, `/reset`, `/verify`, `/admin`, `/account`, `/economics`, `/people`, `/auth`, `/icon.svg`, `/icon-dark.svg`, `/apple-touch-icon.svg`, and `/manifest.webmanifest`; `/kens` includes durable sandbox model labels
- Startup deadlock fixed in `src/lib/db.ts`: initialization no longer calls normal DB helpers that wait on the initialization promise itself.
