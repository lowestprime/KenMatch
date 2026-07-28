# KenMatch Requirements Traceability

This file maps the stable product requirements from `KenMatch_Conception.md` to the current repository state.

## Core alignment

### Public board for long-running AI work
- Implemented on `src/app/kens/page.tsx` and `src/app/kens/[slug]/page.tsx`.
- The board exposes open reading, structured Ken detail, visible timing, and run state.

### Separate public curation from scarce allocation voice
- Public up/down voting is implemented in `src/components/task-pulse-panel.tsx` and persisted through `task_pulse_votes` in `src/lib/db.ts`.
- Quadratic voice allocation is implemented in `src/components/vote-panel.tsx`, `src/lib/allocation.ts`, and `votes` in `src/lib/db.ts`.

### Attributable identity and account-backed participation
- Real accounts and signed-in account cookies are implemented in `src/lib/db.ts`, `src/lib/session.ts`, and `src/app/actions.ts`.
- The public shell and auth pages surface contributor access on `src/components/site-shell.tsx` and `src/app/auth/page.tsx`.

### Sybil resistance and standing
- `profile_attestations` in `src/lib/db.ts` stores provider, status, review time, and sybil-risk signals.
- `src/lib/attestation.ts` converts that state into enforceable participation policy and voice caps.
- The governance page renders these signals in `src/app/governance/page.tsx`.

### Duration tiers and explicit allocation lanes
- Tiering logic remains in `src/lib/allocation.ts`.
- Public lane presentation is shown across `src/app/page.tsx`, `src/app/kens/page.tsx`, `src/components/task-card.tsx`, and `src/app/kens/[slug]/page.tsx`.

### Long-run execution with checkpoints, rollback, and visible stopping conditions
- Run configuration, checkpoints, and rollback notes live in `runs`, `checkpoints`, and `checkpoint_gates` in `src/lib/db.ts`.
- UI rendering appears in `src/app/kens/[slug]/page.tsx`.

### Partial achievement, early completion, and incremental audit trail
- `task_timings` and `run_updates` in `src/lib/db.ts` model launch windows, compute used, completion mode, and incremental evidence.

### Accessible lifecycle graphical abstract
- `src/lib/allocation-policy.ts` is the single source for the eight stages, checkpoint outcomes, delivery variants, pulse/voice distinction, lane assignment, sponsor/rank separation, and contributor-credit aftermath.
- `src/components/ken-lifecycle-map.tsx` renders that policy as a keyboard-operable graphical abstract on Overview and Governance and as current/completed/upcoming progression on Ken detail.
- The renderer includes a complete screen-reader narrative, visible non-color state labels, arrow/Home/End keyboard navigation, reduced-motion and forced-color rules, a two-column 320 px layout, and a static print narrative.
- `tests/lifecycle-policy.test.ts` locks stage order, policy references, funding/rank separation, checkpoint decisions, delivery outcomes, and persisted-stage mapping. Browser evidence and the print contract are recorded in `docs/lifecycle-graphical-abstract.md`.

### Transparent category and Ken intake
- `src/lib/intake-review.ts` records deterministic boundary, readiness, similarity, lane, and bounded risk checks at submission.
- `ken_submissions`, enriched `category_proposals`, and append-only `review_events` preserve status, assignment, timestamps, public reasons, private notes, merge targets, appeals, and immutable transition history.
- Pending user-created Kens are excluded from feed, search, profiles, ranking, pulse, comments, and voice allocation. The proposer and authorized reviewers retain a private detail route.
- `src/lib/review-policy.ts` limits moderators to triage, requires admin/owner authority for final outcomes, rejects own-submission decisions, makes recusal durable, and requires two distinct privileged approvals for high-risk publication.
- `/admin`, `/account#submission-reviews`, and `/reviews` provide role-appropriate queue, submitter, and public-outcome views. Private reviewer notes never enter submitter or public projections.
- Browser evidence covers private-to-public transitions, normalized category collisions, idempotent approval, and distinct-account high-risk quorum. Contract tests cover deterministic intake, authorization, conflict, recusal, event deduplication, and category uniqueness.
- `src/components/ken-timing-strip.tsx` and `src/app/kens/[slug]/page.tsx` render the countdown, elapsed time, progress, and run audit updates.

### Visible blocked work and transparent governance
- Blocked Kens are preserved in the seeded data and shown on `src/app/governance/page.tsx`.
- Ken-level governance logs are rendered once, without duplication, on `src/app/kens/[slug]/page.tsx`.

### Public discussion with ranking and replies
- Threaded comments with voting are implemented in `src/components/discussion-thread.tsx` and persisted in `comments` and `comment_votes` in `src/lib/db.ts`.
- Created timestamps are displayed directly in the public thread UI.

### Scale-safe feed ranking and discovery
- `src/lib/allocation.ts` retains deterministic category-local lane allocation and an ID tie-break; money is not an input.
- `src/lib/discovery.ts` defines canonical filter URLs, reason labels, trusted-pulse ordering, freshness/evidence bands, and proposer/category diversity.
- `src/lib/db.ts` filters, aggregates, ranks, and pages in SQLite/libSQL instead of hydrating the repository-wide corpus for `/kens`.
- `tests/discovery.test.ts` exercises exact ties, concentrated proposers, coordinated untrusted pulse, sparse categories, old checkpoint evidence, blocked work, and 100,000 synthetic Kens.
- The public contract and limits are maintained in `docs/ranking-discovery.md`.

### Funding, treasury, and commercialization split
- Ken finance metadata is stored in `task_finance`.
- Revenue streams, sponsor commitments, and treasury ledger data live in `revenue_streams`, `sponsorship_commitments`, and `treasury_entries`.
- Supporting summary logic in `src/lib/economics.ts` distinguishes committed support from projected support, simulated runway, restricted funding, and safety reserve coverage so optimistic sponsorship does not masquerade as committed treasury support.
- Public rendering is implemented on `src/app/economics/page.tsx`.

### High-skill creative and research outputs
- The prior broad `creative-works`, `public-interest`, and `everyday-services` demo categories are explicitly retired in `src/lib/seed.ts`.
- Current launch categories focus on science/health mechanism discovery, open software, research synthesis, engineering systems, safety/evaluation, and frontier creative outputs only when the proposed artifact is bounded, auditable, and technically demanding.

### Modern public-facing interface and theming
- Responsive shell, compact sticky header, and visual system live in `src/components/site-shell.tsx` and `src/app/globals.css`.
- Light and true-black OLED themes are implemented in `src/components/theme-toggle.tsx`, `src/app/layout.tsx`, and `src/app/globals.css`.
- Semantic theme tokens have one owner in `src/app/globals.css`; Light uses a cool-neutral daytime field and OLED retains a true-black base. Baseline and final computed-style, overflow, and screenshot evidence are recorded in `docs/visual-system-and-long-page-audit.md`.
- Editorial long routes opt into the actual-height-gated `src/components/reading-progress.tsx`; task-oriented routes retain normal document scrolling without a progress indicator.
- Admin audit history uses server-side filtering and pagination in `src/lib/db.ts`, structured redaction in `src/lib/audit-log.ts`, and expandable/copyable full metadata in `src/components/admin/audit-feed.tsx`.
- Product icon and favicon support are implemented through the exact static assets in `public/`, `src/components/kenmatch-mark.tsx`, the single manifest handler at `src/app/manifest.webmanifest/route.ts`, and compatibility redirects for the legacy SVG endpoints.
- Ken category identity is implemented by the inline, theme-aware renderer in `src/components/ken-visual.tsx`, static palette assignments in `src/lib/taxonomy.ts`, database-backed color overrides, and repository-tracked reference exports under `public/category-icons/`.

### Account recovery, email verification, notifications, and admin operations
- Email verification and forgot-password flows are implemented in `src/app/actions.ts`, `src/lib/db.ts`, `src/lib/mail.ts`, `src/app/forgot-password/page.tsx`, `src/app/reset/page.tsx`, and `src/app/verify/page.tsx`.
- Owner/admin notifications for signup, first visitor, verification requests, and Ken submissions are configurable from `src/app/admin/page.tsx` and persisted in `site_settings`.
- The owner-editable About / Contact page is implemented on `src/app/about/page.tsx`, `src/components/about-editor.tsx`, and `site_settings`.
- User profile management, avatar customization, verification requests, and bookmarks are implemented in `src/app/account/page.tsx`, `src/components/profile-editor.tsx`, and `profiles` / `bookmarks`.

### Visitor telemetry and persistence resilience
- Unique visitors are anonymized with a salted hash and persisted in `visitors` through `src/lib/visitor.ts`.
- The admin visitor map is rendered by `src/components/visitor-map.tsx` and uses Cloudflare geolocation request headers when present.
- Synology persistence and recovery steps are documented in `docs/synology-nas-deploy.md`; live writes are stored outside the container image in the mounted `data/` directory.

### Public deployment and self-hosting readiness
- Standalone Next.js output is configured in `next.config.ts`.
- Docker deployment lives in `Dockerfile` and `docker-compose.synology.yml`.
- Health checks are exposed through `src/app/api/health/route.ts`.
- Public-hosting request filtering is implemented in `src/proxy.ts`.
- Synology-specific public-hosting guidance and hardening checklists live in `docs/synology-nas-deploy.md` and `docs/public-security-hardening.md`.
- Synology NAS deployment instructions live in `docs/synology-nas-deploy.md`.

## Honest boundaries

### Internal naming
- The public product language is now `Ken` / `Kens`.
- Some internal code and database identifiers still use `task` for compatibility and to avoid high-risk schema churn.

### Anti-sybil integrations
- The current build models attestation state, provider metadata, review timestamps, sybil-risk bands, rate limits, origin checks, Turnstile hooks, and enforceable participation policy in-app.
- External identity providers and stronger attestations can still be layered on top of the current schema.

### Treasury integrations
- The economics layer is production-shaped but still partly demo-backed because simulated runway remains part of the seeded public ledger.
- Live sponsor checkout is wired for Stripe Checkout plus webhook confirmation, but accounting exports, CRM sync, and broader payments operations are still future integrations.
