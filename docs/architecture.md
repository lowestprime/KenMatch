# KenMatch Architecture

## Stack

- Next.js 16 App Router for the full-stack web surface.
- React 19.2 hooks and server actions for the interactive voting and proposal flows.
- Tailwind CSS v4 with CSS-first theme variables for styling.
- Node.js built-in SQLite for a zero-config local merit ledger and task store. This is excellent for a self-contained prototype, but the API is still flagged experimental in Node 22 and should be swapped for Postgres/LibSQL or another stable production database before a public deployment.

## Why this stack

- The repository started as a blank slate with only product docs, so the implementation had to cover routing, server-side data access, forms, and a bold front-end in one coherent system.
- Next.js App Router keeps the read-heavy governance views server-rendered while still allowing modern server actions for write flows.
- React 19.2 features like `useActionState`, `useDeferredValue`, and `useEffectEvent` fit the proposal intake and voting interactions cleanly.
- Tailwind v4's CSS-first configuration makes it easy to define a strong visual system without introducing extra build complexity.
- Local SQLite keeps the repo self-contained while still giving the project a real persistence layer instead of a static JSON mock.

## Main modules

- [src/lib/allocation.ts](/C:/Users/Cooper/Desktop/kenmatch/src/lib/allocation.ts)
  - Quadratic cost math, allocation eligibility, and tier assignment.
- [src/lib/db.ts](/C:/Users/Cooper/Desktop/kenmatch/src/lib/db.ts)
  - Database initialization, seeding, hydration, proposal creation, and vote persistence.
- [src/lib/seed.ts](/C:/Users/Cooper/Desktop/kenmatch/src/lib/seed.ts)
  - Seeded demo proposals, votes, runs, checkpoints, and governance events.
- [src/app/actions.ts](/C:/Users/Cooper/Desktop/kenmatch/src/app/actions.ts)
  - Server actions for proposal submission, profile switching, and vote updates.
- [src/components](/C:/Users/Cooper/Desktop/kenmatch/src/components)
  - Presentation and interaction components for the shell, board filters, task cards, voting, and proposal forms.

## Routes

- [src/app/page.tsx](/C:/Users/Cooper/Desktop/kenmatch/src/app/page.tsx)
  - Overview, featured allocations, metrics, categories, and recent governance decisions.
- [src/app/tasks/page.tsx](/C:/Users/Cooper/Desktop/kenmatch/src/app/tasks/page.tsx)
  - Searchable and filterable proposal board.
- [src/app/tasks/[slug]/page.tsx](/C:/Users/Cooper/Desktop/kenmatch/src/app/tasks/[slug]/page.tsx)
  - Full proposal detail, run metadata, checkpoints, vote ledger, and governance log.
- [src/app/submit/page.tsx](/C:/Users/Cooper/Desktop/kenmatch/src/app/submit/page.tsx)
  - Structured proposal intake.
- [src/app/governance/page.tsx](/C:/Users/Cooper/Desktop/kenmatch/src/app/governance/page.tsx)
  - Policy boundaries, recent decisions, and blocked-task transparency.

## Data model summary

- Profiles: earned voice credits, specialty, and credibility.
- Categories: the public domains that organize the tier ladders.
- Tasks: the proposal core, including problem framing, deliverables, evaluation, evidence, and requested tier.
- Votes: profile-bound quadratic allocations.
- Runs: active execution lanes with runtime, backend, and rollback metadata.
- Checkpoints: the audit trail for long-running work.
- Governance events: safety-council and allocation-chamber decisions.