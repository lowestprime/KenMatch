# KenMatch

KenMatch is a full-stack prototype for democratizing access to sustained frontier compute. It now models the broader product surface implied by [KenMatch_Conception.md](/C:/Users/Cooper/Desktop/kenmatch/KenMatch_Conception.md): structured proposal intake, earned quadratic allocation voice, public up/down curation, threaded discussion, proposal bonds, checkpoint-gated execution, and a treasury-backed commercial flywheel.

## What this implementation does

- Runs a real proposal marketplace instead of a static landing page.
- Treats voice as earned, non-purchasable credits bound to contributor profiles.
- Separates public curation from allocation: Reddit/Stack Exchange-style pulse voting and threaded comments shape quality, while quadratic voice commits scarce compute.
- Ranks tasks by quadratic support and maps them into `months`, `weeks`, `days`, `queued`, or `blocked` per category.
- Exposes safety-council and allocation-chamber decisions as visible governance events.
- Models long-horizon execution with seeded runs, checkpoint cadence, release gates, rollback plans, and execution-backend neutrality.
- Adds a financialization layer consistent with the conception brief: sponsor pools, enterprise packaging notes, preference-data value notes, treasury routing, and founder/treasury splits.
- Supports light and dark mode with a more visual, motion-rich interface.

## Stack

- [Next.js 16](https://nextjs.org/blog/next-16)
- [React 19.2](https://react.dev/blog/2025/10/01/react-19-2)
- [Tailwind CSS v4](https://tailwindcss.com/blog/tailwindcss-v4)
- [Node.js SQLite API](https://nodejs.org/api/sqlite.html)

## Getting started

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

## Scripts

```bash
npm run dev
npm run lint
npm run typecheck
npm run test
npm run build
```

## Project map

- [src/app](/C:/Users/Cooper/Desktop/kenmatch/src/app) contains the routes and server actions.
- [src/components](/C:/Users/Cooper/Desktop/kenmatch/src/components) contains the interactive UI, including theme switching, pulse voting, and threaded discussion.
- [src/lib](/C:/Users/Cooper/Desktop/kenmatch/src/lib) contains the allocation math, economics helpers, persistence layer, session helper, and seed data.
- [docs/requirements-traceability.md](/C:/Users/Cooper/Desktop/kenmatch/docs/requirements-traceability.md) maps source-document requirements to implementation.
- [docs/architecture.md](/C:/Users/Cooper/Desktop/kenmatch/docs/architecture.md) explains the stack and module layout.

## Product interpretation notes

The conception document is deliberately expansive. This implementation now preserves more of its stable product primitives directly in code.

Implemented as product requirements:

- sustained frontier compute as the scarce resource
- earned, non-purchasable allocation power
- public proposal ranking and curation
- Reddit/Stack Exchange-style threaded discussion and up/down voting
- proposal quality bonds and visible checkpoint release gates
- months / weeks / days tiering
- safety review, auditability, checkpoints, and rollback
- execution-layer neutrality
- a public/commercial dual-flywheel that funds the treasury without selling governance voice

Still intentionally not treated as hard product truth in the code:

- specific vendor/model names as permanent architecture
- legal or corporate-form recommendations as executable product logic
- tradable token issuance or speculative crypto mechanics

## Local data and persistence

The prototype uses a zero-config SQLite database at `data/kenmatch.sqlite`, seeded automatically from [src/lib/seed.ts](/C:/Users/Cooper/Desktop/kenmatch/src/lib/seed.ts). The database stores proposals, votes, pulse votes, comments, checkpoint gates, revenue streams, and treasury entries so the repo exercises real persistence rather than static mocks.

Because the current implementation uses Node's built-in SQLite API, it is best viewed as a strong local prototype with a clear production upgrade path to Postgres, LibSQL, or another stable database engine.

## Source material

- [KenMatch_Conception.md](/C:/Users/Cooper/Desktop/kenmatch/KenMatch_Conception.md)
- the repository's original README brief, now superseded by this implementation-focused README

The conception doc and the original brief were the design source for this build; the implementation details and architecture choices are documented in the `docs/` folder.
