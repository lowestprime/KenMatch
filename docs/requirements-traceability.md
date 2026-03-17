# KenMatch Requirements Traceability

This file maps the stable, implementation-relevant requirements in [KenMatch_Conception.md](../KenMatch_Conception.md) to the current codebase.

## Stable requirements extracted from the conception document

1. Democratize access to sustained frontier compute rather than short-lived chat turns.
2. Keep governance voice earned and non-purchasable.
3. Preserve the months / weeks / days allocation protocol by category.
4. Add Reddit / Stack Exchange / group-buy style public curation and discussion.
5. Keep blocked work visible and attach public rationale to safety decisions.
6. Gate long-running execution behind checkpoints, release conditions, and rollback plans.
7. Separate the public curation engine from the commercial revenue engine.
8. Make contribution, identity, and legitimacy more attributable than anonymous crowd spam.

## Where those requirements are implemented

- Sustained compute as the scarce resource
  - Run metadata, runtime hours, budgets, and checkpoint cadence live in [src/lib/db.ts](../src/lib/db.ts) and render on [src/app/tasks/[slug]/page.tsx](../src/app/tasks/[slug]/page.tsx).
- Earned, non-purchasable voice
  - Quadratic voice, profile-bound credits, and proposal bonds are enforced in [src/lib/allocation.ts](../src/lib/allocation.ts), [src/lib/db.ts](../src/lib/db.ts), and [src/components/vote-panel.tsx](../src/components/vote-panel.tsx).
- Months / weeks / days allocation
  - Ranking and tier assignment remain explicit in [src/lib/allocation.ts](../src/lib/allocation.ts) and are surfaced across [src/app/page.tsx](../src/app/page.tsx), [src/app/tasks/page.tsx](../src/app/tasks/page.tsx), and [src/app/tasks/[slug]/page.tsx](../src/app/tasks/[slug]/page.tsx).
- Public curation beyond quadratic voting
  - Task pulse voting, comment voting, replies, and comment staking live in [src/lib/db.ts](../src/lib/db.ts), [src/app/actions.ts](../src/app/actions.ts), [src/components/task-pulse-panel.tsx](../src/components/task-pulse-panel.tsx), and [src/components/discussion-thread.tsx](../src/components/discussion-thread.tsx).
- Visible safety boundaries
  - Governance logs and blocked proposals are exposed on [src/app/governance/page.tsx](../src/app/governance/page.tsx) and [src/app/tasks/[slug]/page.tsx](../src/app/tasks/[slug]/page.tsx).
- Checkpoint-gated execution
  - Release gates and checkpoint approval thresholds are modeled in [src/lib/db.ts](../src/lib/db.ts) and rendered in [src/app/tasks/[slug]/page.tsx](../src/app/tasks/[slug]/page.tsx).
- Public curation engine vs revenue engine
  - Revenue streams, treasury entries, sponsor pools, packaging notes, and data-value notes live in [src/lib/db.ts](../src/lib/db.ts) and [src/app/economics/page.tsx](../src/app/economics/page.tsx).
- Attributable identity and session-based legitimacy
  - Real accounts and sessions now replace the old profile switcher in [src/lib/db.ts](../src/lib/db.ts), [src/lib/session.ts](../src/lib/session.ts), and [src/app/auth/page.tsx](../src/app/auth/page.tsx).

## Still interpretive rather than fully resolved in code

- External attestation providers and anti-sybil infrastructure are modeled as contributor states and metadata, but not yet integrated with third-party identity systems.
- Legal incorporation, off-platform enterprise packaging, and real treasury operations are represented in the product model and docs, not wired to actual legal or payment infrastructure.
