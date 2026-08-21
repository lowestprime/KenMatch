# Funding Capacity and Run Governance

## Scope

This document defines KenMatch's implemented sandbox contract for funding scarcity, run quality, stopping conditions, and release decisions. It does not promise live compute availability, financial return, a launch date, or successful output.

## Capacity accounting

General launch coverage uses only the positive balance of committed, unrestricted, general-scope entries in the compute treasury. The calculation excludes:

- projected funding;
- simulated funding;
- category-restricted or Ken-restricted funding;
- safety-reserve funding;
- sponsor interest that has not settled as a compatible committed treasury entry.

The public page still displays excluded balances with their state and restriction so the calculation can be inspected. Estimated monthly public burn remains an operating estimate, not a guarantee.

## State machine

| State | Automatic threshold | New launches | Existing runs |
| --- | --- | --- | --- |
| `normal` | Coverage at or above target | May launch within rank, lane, budget, and safety rules | Continue through published gates and caps |
| `constrained` | At least half of target | Only already-budgeted days/weeks runs; months wait | Continue to the next approved checkpoint |
| `new-launches-paused` | At least one month but below half target | Paused | Move to next safe checkpoint, then pause |
| `critical-maintenance-only` | Below one month | Stopped | Pause at earliest safe point; only rollback/evidence preservation proceeds |

Safety response, security, rollback, evidence preservation, essential maintenance, moderation, and public records are protected in every state. Rank and queue position do not change because funding is scarce.

The automatic state recalculates from current compatible committed coverage. Owner/admin controls may impose a stricter public state for provider instability, safety, or operations. A manual override cannot make the state less restrictive than the automatic result and remains until explicitly returned to automatic mode.

## Output quality contract

Every run must expose:

1. named deliverables;
2. acceptance criteria;
3. source and provenance requirements;
4. compute and runtime caps;
5. checkpoint gates;
6. reviewer decisions;
7. artifact labels plus a site-relative/HTTPS URL or SHA-256 digest for release;
8. correction history;
9. failure, partial-delivery, and rollback state;
10. an explicit final release decision.

A progress update is not a release. The public Ken page states when no release decision exists.

## Stop reasons

The canonical reason codes are:

- safety escalation;
- failed acceptance;
- provenance failure;
- budget or runtime cap;
- repeated provider or tool failure;
- duplication or supersession;
- scope invalidation;
- reviewer redirect;
- successful early completion;
- owner emergency with a public audit note.

Every stop preserves available evidence and records the actor, role, time, public reason, optional checkpoint, and artifact trace. Successful early completion is not failure. Useful partial delivery requires its own partial-release decision.

## Decision ownership

Programmatic rules cover schema validation, credit arithmetic, category-local lane rank, deterministic ties, eligibility, rate limits, and caps. Automated intake warnings are advisory. Public benefit, category fit, safety, evidence quality, checkpoint quality, sponsor compatibility, and final release remain human judgments with named accountability. Storing a judgment in software does not make it objective.

## Persistence and operations

- `run_decision_events` is append-only in application behavior.
- Seed writes use insert-if-absent and never overwrite decision history.
- Admin writes require an authenticated admin/owner, origin/rate-limit guards, a compatible event type/code, and a public reason.
- Release writes require an artifact label and URL or SHA-256 digest.
- Terminal writes update lifecycle/timing status in the same libSQL batch as the decision event.
- All admin mutations also enter the private redacted admin audit log.

## Validation

Focused policy and database-contract coverage lives in:

- `tests/economics.test.ts`
- `tests/run-governance.test.ts`
- `tests/run-governance-database-contract.test.ts`

Validation completed on July 29, 2026:

- `npm run typecheck`, `npm run lint`, `npm run test`, and `npm run build` pass; the full suite contains 98 passing tests.
- The production standalone output returns `200` from `/api/health`.
- Desktop `/economics` and mobile `/governance` show the global critical-maintenance notice, all four policy states, no horizontal overflow, and no console warnings.
- Desktop and mobile Ken detail views show pending or approved release state, checkpoint counts, append-only decision history, artifact links/digests, and readable summary tiles without mid-word breaks.
- The loopback-only test-auth route signs in an isolated owner against `output/playwright/capacity-governance/browser.sqlite`.
- Admin capacity controls record a restrictive request, preserve the stricter automatic treasury floor, add a private audit entry, and restore automatic policy.
- An admin correction write appears immediately in the public Rare-Disease Mechanism Atlas decision history without changing its release state.
- Admin capacity and decision controls fit a 390-by-844 viewport with no horizontal overflow or console warnings.

Local screenshots are retained under `output/playwright/capacity-governance/`; that directory is intentionally excluded from version control.
