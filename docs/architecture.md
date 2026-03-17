# KenMatch Architecture

## Stack

- Next.js 16 App Router for the full-stack web surface.
- React 19.2 with server actions and modern client hooks for curation, discussion, and auth flows.
- Tailwind CSS v4 with CSS-first theme variables and custom utility classes for the visual system.
- [libSQL TypeScript](https://docs.turso.tech/sdk/ts/quickstart) for a stable SQLite-compatible local database and an easy remote upgrade path for public deployment.
- `zod` for environment parsing and form validation.

## Why this stack

- The conception document demanded a real product, not a brochure. Next.js App Router covers read-heavy pages, authenticated write flows, and deployment routing in one system.
- React server actions keep proposal, vote, pulse, comment, and auth mutations close to the pages that use them.
- Tailwind v4 plus custom CSS variables let the app carry a distinct light/dark visual language without introducing another styling runtime.
- libSQL keeps local development zero-config while supporting a remote production database via the same client API.

## Main modules

- [src/lib/db.ts](/C:/Users/Cooper/Desktop/kenmatch/src/lib/db.ts)
  - Schema initialization, seed loading, snapshot hydration, account/session persistence, proposal creation, voting, pulse, comments, economics, and health checks.
- [src/lib/session.ts](/C:/Users/Cooper/Desktop/kenmatch/src/lib/session.ts)
  - Cookie-backed session lookup and mutation helpers.
- [src/app/actions.ts](/C:/Users/Cooper/Desktop/kenmatch/src/app/actions.ts)
  - Server actions for auth, proposal submission, quadratic voting, pulse voting, comment creation, and comment voting.
- [src/components](/C:/Users/Cooper/Desktop/kenmatch/src/components)
  - Shell, theme toggle, auth panels, proposal form, vote panel, pulse panel, discussion thread, and marketplace cards.

## Routes

- [src/app/page.tsx](/C:/Users/Cooper/Desktop/kenmatch/src/app/page.tsx)
  - Overview, protocol framing, featured tasks, governance highlights, and economic flywheel summary.
- [src/app/tasks/page.tsx](/C:/Users/Cooper/Desktop/kenmatch/src/app/tasks/page.tsx)
  - Searchable and filterable proposal board.
- [src/app/tasks/[slug]/page.tsx](/C:/Users/Cooper/Desktop/kenmatch/src/app/tasks/[slug]/page.tsx)
  - Full proposal detail, finance metadata, pulse, quadratic voice, checkpoints, governance events, and discussion.
- [src/app/submit/page.tsx](/C:/Users/Cooper/Desktop/kenmatch/src/app/submit/page.tsx)
  - Structured proposal intake with quality-bond-aware auth gating.
- [src/app/governance/page.tsx](/C:/Users/Cooper/Desktop/kenmatch/src/app/governance/page.tsx)
  - Policy boundaries, attestation states, recent decisions, and blocked-task transparency.
- [src/app/economics/page.tsx](/C:/Users/Cooper/Desktop/kenmatch/src/app/economics/page.tsx)
  - Revenue streams, treasury ledger, and funded-task packaging logic.
- [src/app/auth/page.tsx](/C:/Users/Cooper/Desktop/kenmatch/src/app/auth/page.tsx)
  - Contributor sign-in and sign-up.
- [src/app/api/health/route.ts](/C:/Users/Cooper/Desktop/kenmatch/src/app/api/health/route.ts)
  - Deployment health probe.

## Deployment model

- Local development uses `KENMATCH_DB_FILE` and a file-backed libSQL database.
- Production deployment should point `DATABASE_URL` and `DATABASE_AUTH_TOKEN` at a managed remote libSQL database.
- Security headers are configured in [next.config.ts](/C:/Users/Cooper/Desktop/kenmatch/next.config.ts).
- Environment expectations are documented in [.env.example](/C:/Users/Cooper/Desktop/kenmatch/.env.example).
