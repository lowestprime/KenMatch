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
- Task title: KenMatch public-release hardening and modernization
- Requested by: direct longform implementation prompt
- Status: IN PROGRESS
- Owner: Codex
- Last updated: 2026-04-10

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
- PARTIAL = current docs indicate meaningful implementation exists but it still requires direct audit/completion
- TODO = no trustworthy completion claim yet
- BLOCKED = cannot be completed from repo alone

| ID | Requirement / work item | Current state | Status | Evidence / primary targets |
|----|--------------------------|---------------|--------|-----------------------------|
| 1 | Exhaustively audit repo-local guidance and code paths before major edits | Required by repo AGENTS | TODO | `AGENTS.md`, `README.md`, docs, key codepaths |
| 2 | Analyze every relevant word/claim in the attached concept document and reconcile with current product truth | `KenMatch_Conception.md` exists and is expansive | TODO | `KenMatch_Conception.md`, `README.md`, docs |
| 3 | Optimize public-facing security posture for a public GitHub repo and home-network/NAS hosting | App-layer hardening already documented | PARTIAL | `middleware.ts`, `src/lib/security.ts`, security docs |
| 4 | Improve DDoS/origin protection posture | Repo/docs already state edge protection is required | PARTIAL | tunnel/proxy docs, middleware, deploy configs |
| 5 | Ensure safer default deployment for public hosting | Loopback-only + tunnel guidance already documented | PARTIAL | compose files, hardening docs |
| 6 | Modernize and improve revenue infrastructure | Economics and sponsor surfaces already exist | PARTIAL | `/economics`, sponsor flows, ledger logic |
| 7 | Improve account creation/auth/public participation | Real account creation and sessions already documented | PARTIAL | `/auth`, auth/session logic, Turnstile/rate limits |
| 8 | Make all examples more realistic and exciting | Seed/demo data already exists | PARTIAL | `src/lib/seed.ts`, `src/lib/seed-plus.ts` |
| 9 | Ensure the website is fully functional from the ground up | Major surface exists but requires exhaustive audit | PARTIAL | all routes, forms, actions, tests |
| 10 | Ensure all UI, elements, buttons, and flows are comprehensively optimized and operational | Existing feature-rich UI documented | PARTIAL | all components/routes |
| 11 | Make art/GUI elegant and engagement-driving | Current README promises strong visual hierarchy and updated icons | PARTIAL | shell/theme/icon/UI system |
| 12 | Make the demo easy to use and fully operational | Core demo already exists | PARTIAL | board/detail/auth/economics/governance flows |
| 13 | Upgrade UI to feel more like modern Reddit, less elitist, more inclusive | Not evidenced as complete in docs | TODO | shell/feed/cards/comments/tabs/copy |
| 14 | Enhance realism of demo/sim with sandbox capital | Existing economics/demo seed surface exists | PARTIAL | seed data, economics pages |
| 15 | Enhance realism with hypothetical consumer-grade frontier-AI results | Existing sandbox-backed demo data documented | PARTIAL | seed data, Ken detail content, disclosure copy |
| 16 | Maximize engagement and sponsorship appeal | Sponsor/economics flows exist but need UX/copy/data audit | PARTIAL | economics/sponsor/detail pages |
| 17 | Preserve honest demo/live distinction | Required to avoid deceptive claims | TODO | seed/data/copy/docs |
| 18 | Keep Stripe live flow safe if enabled | Optional Stripe is already documented | PARTIAL | `src/lib/stripe.ts`, webhook route, docs |
| 19 | Keep health endpoint public-safe | Public-safe health split already documented | PARTIAL | `src/app/api/health/route.ts` |
| 20 | Update docs/config/setup examples to final behavior | Required whenever behavior changes | TODO | README, docs, env, examples |

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
- [ ] Repo context and key codepaths were fully audited.
- [ ] `KenMatch_Conception.md` was analyzed and reconciled against the actual product.
- [ ] Public security posture was materially improved at the app/config/docs level.
- [ ] Public-hosting deployment guidance matches a safer edge-shielded NAS topology.
- [ ] Auth/signup/participation flows are robust and abuse-aware.
- [ ] Public board UX is more modern, inclusive, and engagement-driving.
- [ ] Demo seed data is more realistic, exciting, and sponsor-friendly.
- [ ] Economics/funding/revenue surfaces are clearer and more compelling.
- [ ] All major routes, forms, filters, and interactions were audited.
- [ ] Canonical validation commands passed or blockers were explicitly documented.
- [ ] Docs/examples/env/setup were updated to match the final behavior.
- [ ] Final completion ledger reflects the true end state.