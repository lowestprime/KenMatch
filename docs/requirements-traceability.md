# KenMatch Requirements Traceability

This file maps the stable, implementation-relevant requirements from [KenMatch_Conception.md](/C:/Users/Cooper/Desktop/kenmatch/KenMatch_Conception.md) and the repository's initial README brief, which has now been superseded by the implementation-focused project README.

## Stable requirements extracted from the source docs

1. Democratize access to sustained frontier compute rather than short-lived chat access.
2. Use earned, non-purchasable allocation power instead of pay-to-win spending.
3. Structure the allocation ladder as months / weeks / days with per-category ranking.
4. Treat safety review, auditability, and rollback as first-class product requirements.
5. Keep execution-layer neutrality across APIs, leased clusters, and decentralized supply.
6. Make contribution legible through proposals, curation, checkpoints, and governance logs.

## How the implementation satisfies those requirements

- Sustained compute as the core resource
  - Implemented as visible run records, checkpoint cadence, runtime hours, and budget lanes in [src/lib/seed.ts](/C:/Users/Cooper/Desktop/kenmatch/src/lib/seed.ts) and surfaced on [src/app/tasks/[slug]/page.tsx](/C:/Users/Cooper/Desktop/kenmatch/src/app/tasks/[slug]/page.tsx).
- Earned, non-purchasable voice
  - Implemented as profile-bound voice credits and quadratic vote spend in [src/lib/allocation.ts](/C:/Users/Cooper/Desktop/kenmatch/src/lib/allocation.ts), [src/lib/db.ts](/C:/Users/Cooper/Desktop/kenmatch/src/lib/db.ts), and [src/components/vote-panel.tsx](/C:/Users/Cooper/Desktop/kenmatch/src/components/vote-panel.tsx).
- Months / weeks / days tiering
  - Implemented directly in [src/lib/allocation.ts](/C:/Users/Cooper/Desktop/kenmatch/src/lib/allocation.ts) and displayed across [src/app/page.tsx](/C:/Users/Cooper/Desktop/kenmatch/src/app/page.tsx), [src/app/tasks/page.tsx](/C:/Users/Cooper/Desktop/kenmatch/src/app/tasks/page.tsx), and task detail views.
- Safety and legitimacy
  - Implemented via blocked proposals, monitor status, governance logs, and proposal intake review in [src/lib/db.ts](/C:/Users/Cooper/Desktop/kenmatch/src/lib/db.ts), [src/app/governance/page.tsx](/C:/Users/Cooper/Desktop/kenmatch/src/app/governance/page.tsx), and [src/app/submit/page.tsx](/C:/Users/Cooper/Desktop/kenmatch/src/app/submit/page.tsx).
- Execution-layer neutrality
  - Reflected in backend metadata for API meshes, leased GPU fleets, self-hosted inference, and marketplace capacity in [src/lib/seed.ts](/C:/Users/Cooper/Desktop/kenmatch/src/lib/seed.ts).
- Proposal structure over vague prompts
  - Enforced in the submission form and schema validation in [src/components/proposal-form.tsx](/C:/Users/Cooper/Desktop/kenmatch/src/components/proposal-form.tsx) and [src/app/actions.ts](/C:/Users/Cooper/Desktop/kenmatch/src/app/actions.ts).

## Deliberate implementation choices made from ambiguous or unstable source material

- The conception document includes speculative sections about legal form, monetization, and specific vendor/model names. The app preserves the stable product thesis but does not hard-code those speculative claims as product truth.
- The prototype keeps identity simple by using switchable demo profiles instead of production auth. That preserves the governance logic while keeping the repo runnable locally.
- The public prototype follows the raw per-category tier protocol exactly, but also records in the governance log that a production rollout would likely add minimum-vote thresholds before granting month-scale lanes.