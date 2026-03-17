# KenMatch Requirements Traceability

This file maps the stable, implementation-relevant requirements from [KenMatch_Conception.md](/C:/Users/Cooper/Desktop/kenmatch/KenMatch_Conception.md) and the repository's initial README brief, which has now been superseded by the implementation-focused project README.

## Stable requirements extracted from the source docs

1. Democratize access to sustained frontier compute rather than short-lived chat access.
2. Use earned, non-purchasable allocation power instead of pay-to-win spending.
3. Keep the allocation ladder as months / weeks / days with per-category ranking.
4. Preserve the Reddit / Stack Exchange / group-buy aspect: public ranking, comments, curation, and debate before execution.
5. Treat safety review, auditability, checkpoints, and rollback as first-class product requirements.
6. Preserve execution-layer neutrality across APIs, leased clusters, and decentralized supply.
7. Add quality stakes or other anti-spam credibility signals for submissions.
8. Reflect the public/commercial dual-flywheel: public curation on one side, enterprise packaging / licensing on the other.
9. Keep governance and denied work visible instead of opaque.

## How the implementation satisfies those requirements

- Sustained compute as the core resource
  - Implemented as run records, checkpoint cadence, runtime hours, and budget lanes in [src/lib/seed.ts](/C:/Users/Cooper/Desktop/kenmatch/src/lib/seed.ts) and surfaced on [src/app/tasks/[slug]/page.tsx](/C:/Users/Cooper/Desktop/kenmatch/src/app/tasks/[slug]/page.tsx).
- Earned, non-purchasable voice
  - Implemented as profile-bound voice credits and quadratic vote spend in [src/lib/allocation.ts](/C:/Users/Cooper/Desktop/kenmatch/src/lib/allocation.ts), [src/lib/db.ts](/C:/Users/Cooper/Desktop/kenmatch/src/lib/db.ts), and [src/components/vote-panel.tsx](/C:/Users/Cooper/Desktop/kenmatch/src/components/vote-panel.tsx).
- Months / weeks / days tiering
  - Implemented directly in [src/lib/allocation.ts](/C:/Users/Cooper/Desktop/kenmatch/src/lib/allocation.ts) and displayed across [src/app/page.tsx](/C:/Users/Cooper/Desktop/kenmatch/src/app/page.tsx), [src/app/tasks/page.tsx](/C:/Users/Cooper/Desktop/kenmatch/src/app/tasks/page.tsx), and task detail views.
- Public curation and discussion
  - Implemented as task pulse votes, threaded comments, and comment voting in [src/lib/db.ts](/C:/Users/Cooper/Desktop/kenmatch/src/lib/db.ts), [src/components/task-pulse-panel.tsx](/C:/Users/Cooper/Desktop/kenmatch/src/components/task-pulse-panel.tsx), and [src/components/discussion-thread.tsx](/C:/Users/Cooper/Desktop/kenmatch/src/components/discussion-thread.tsx).
- Safety and legitimacy
  - Implemented via blocked proposals, monitor status, governance logs, checkpoint gates, and proposal intake review in [src/lib/db.ts](/C:/Users/Cooper/Desktop/kenmatch/src/lib/db.ts), [src/app/governance/page.tsx](/C:/Users/Cooper/Desktop/kenmatch/src/app/governance/page.tsx), and [src/app/submit/page.tsx](/C:/Users/Cooper/Desktop/kenmatch/src/app/submit/page.tsx).
- Execution-layer neutrality
  - Reflected in backend metadata for API meshes, leased GPU fleets, self-hosted inference, and marketplace capacity in [src/lib/seed.ts](/C:/Users/Cooper/Desktop/kenmatch/src/lib/seed.ts).
- Quality stakes
  - Implemented as proposal bonds stored in task finance metadata and surfaced on the marketplace, detail pages, and submission form.
- Public/commercial flywheel
  - Implemented as revenue streams, treasury entries, sponsor pools, enterprise packaging notes, and economics views in [src/lib/seed.ts](/C:/Users/Cooper/Desktop/kenmatch/src/lib/seed.ts), [src/lib/economics.ts](/C:/Users/Cooper/Desktop/kenmatch/src/lib/economics.ts), and [src/app/economics/page.tsx](/C:/Users/Cooper/Desktop/kenmatch/src/app/economics/page.tsx).
- Visible governance
  - Implemented as logged safety-council / allocation-chamber events and blocked-task visibility in [src/app/governance/page.tsx](/C:/Users/Cooper/Desktop/kenmatch/src/app/governance/page.tsx).

## Deliberate implementation choices made from ambiguous or unstable source material

- The conception document includes speculative sections about legal form and specific vendor/model names. The app preserves the stable product thesis but does not hard-code those unstable references as permanent architecture.
- The public/commercial flywheel is modeled as explicit revenue and treasury infrastructure rather than as tradable blockchain assets. That keeps the product thesis testable without implementing speculative token markets.
- Identity remains simple via switchable demo profiles instead of production authentication. That preserves the merit and governance logic while keeping the repo runnable locally.
- The prototype follows the raw per-category tier protocol exactly, while the governance log still records that a production rollout would likely add minimum-vote or minimum-signal thresholds before granting month-scale lanes.
