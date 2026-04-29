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
- `src/components/ken-timing-strip.tsx` and `src/app/kens/[slug]/page.tsx` render the countdown, elapsed time, progress, and run audit updates.

### Visible blocked work and transparent governance
- Blocked Kens are preserved in the seeded data and shown on `src/app/governance/page.tsx`.
- Ken-level governance logs are rendered once, without duplication, on `src/app/kens/[slug]/page.tsx`.

### Public discussion with ranking and replies
- Threaded comments with voting are implemented in `src/components/discussion-thread.tsx` and persisted in `comments` and `comment_votes` in `src/lib/db.ts`.
- Created timestamps are displayed directly in the public thread UI.

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
- Product icon and favicon support are implemented through `src/components/kenmatch-mark.tsx`, `src/lib/brand-assets.ts`, and the route-backed icon/manifest handlers under `src/app/*/route.ts`.

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
- Public-hosting request filtering is implemented in `middleware.ts`.
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
