# KenMatch Architecture

## Stack

- Next.js 16 App Router for the full-stack product surface.
- React 19.2 server actions and client hooks for proposal intake, allocation voting, public pulse voting, comments, and theming.
- Tailwind CSS v4 with CSS-first theme variables for the visual system and light/dark mode.
- Node.js built-in SQLite for a zero-config local merit ledger, social layer, and treasury store. This is excellent for a self-contained prototype, but the API is still flagged experimental in Node 22 and should be swapped for Postgres/LibSQL or another stable production database before a public deployment.

## Why this stack

- The repository started with product docs, not an app, so the implementation had to cover routing, server-side data access, and a sophisticated front-end in one coherent system.
- Next.js App Router keeps read-heavy governance and economics views server-rendered while still allowing modern write flows through server actions.
- React 19.2 features like `useActionState`, `useDeferredValue`, and `useEffectEvent` fit the proposal intake, voting, filter, and discussion interactions cleanly.
- Tailwind v4's CSS-first configuration makes it easy to define a strong visual system with theme variables and animated glass surfaces without introducing extra build complexity.
- Local SQLite keeps the repo runnable without infrastructure while still giving the project a real persistence layer instead of static JSON.

## Main modules

- [src/lib/allocation.ts](/C:/Users/Cooper/Desktop/kenmatch/src/lib/allocation.ts)
  - Quadratic cost math, allocation eligibility, and tier assignment.
- [src/lib/economics.ts](/C:/Users/Cooper/Desktop/kenmatch/src/lib/economics.ts)
  - Revenue split and treasury summary helpers.
- [src/lib/db.ts](/C:/Users/Cooper/Desktop/kenmatch/src/lib/db.ts)
  - Database initialization, seeding, hydration, proposal creation, allocation voting, pulse voting, comment persistence, and economics snapshots.
- [src/lib/seed.ts](/C:/Users/Cooper/Desktop/kenmatch/src/lib/seed.ts)
  - Seeded proposals, finance metadata, votes, discussion, checkpoints, governance events, and treasury entries.
- [src/app/actions.ts](/C:/Users/Cooper/Desktop/kenmatch/src/app/actions.ts)
  - Server actions for proposal submission, profile switching, allocation voting, pulse voting, and comment flows.
- [src/components](/C:/Users/Cooper/Desktop/kenmatch/src/components)
  - Shell, theme toggle, board filters, task cards, voting panels, discussion threads, and proposal forms.

## Routes

- [src/app/page.tsx](/C:/Users/Cooper/Desktop/kenmatch/src/app/page.tsx)
  - Overview, featured allocations, scenario gallery, governance snapshot, and revenue flywheel preview.
- [src/app/tasks/page.tsx](/C:/Users/Cooper/Desktop/kenmatch/src/app/tasks/page.tsx)
  - Searchable and filterable proposal board with public pulse and allocation context.
- [src/app/tasks/[slug]/page.tsx](/C:/Users/Cooper/Desktop/kenmatch/src/app/tasks/[slug]/page.tsx)
  - Full proposal detail, public pulse, quadratic allocation, run metadata, checkpoint gates, governance log, and threaded discussion.
- [src/app/submit/page.tsx](/C:/Users/Cooper/Desktop/kenmatch/src/app/submit/page.tsx)
  - Structured proposal intake with proposal bonds.
- [src/app/governance/page.tsx](/C:/Users/Cooper/Desktop/kenmatch/src/app/governance/page.tsx)
  - Policy boundaries, category status, denial transparency, and governance rationale.
- [src/app/economics/page.tsx](/C:/Users/Cooper/Desktop/kenmatch/src/app/economics/page.tsx)
  - Revenue streams, treasury ledger, sponsor-ready lanes, and the public/commercial flywheel.

## Data model summary

- Profiles: earned voice credits, specialty, credibility, and bonded-credit accounting.
- Categories: the public domains that organize the tier ladders.
- Tasks: the proposal core, including problem framing, deliverables, evaluation, evidence, and requested tier.
- Task finance: proposal bonds, sponsor pools, checkpoint approval targets, enterprise packaging notes, and data-value notes.
- Votes: profile-bound quadratic allocations.
- Task pulse votes: public up/down curation separate from allocation spend.
- Comments and comment votes: threaded discussion and quality triage.
- Runs: active execution lanes with runtime, backend, and rollback metadata.
- Checkpoints and checkpoint gates: the audit trail and release controls for long-running work.
- Governance events: safety-council and allocation-chamber decisions.
- Revenue streams and treasury entries: the commercial engine that refills public compute capacity.
