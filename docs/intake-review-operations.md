# Intake review operations

Last updated: 2026-07-27

## Queue model

New user-created Kens are inserted with a `ken_submissions` record in `pending` state. They do not appear in the public feed, search, contributor profile task lists, ranking, pulse, comments, or scarce-voice allocation until approved. Seeded/demo Kens have no submission record and retain their existing behavior.

Category proposals use the same lifecycle:

`pending` → `needs-revision` / `held` / `second-review` → `approved` / `merged` / `rejected`

A rejected or merged record may move to `appealed`, then back to review through a reason-coded appeal resolution.

## Deterministic first pass

`src/lib/intake-review.ts` stores a versioned JSON snapshot at submission. Checks are deterministic and advisory:

- normalized category name and slug;
- exact collision rejection;
- token-set similarity hints;
- category boundary and distinct examples;
- public-benefit specificity;
- deliverable and evaluation readiness;
- evidence presence;
- requested lane versus estimated scope;
- bounded high-risk term scan.

Do not describe this as algorithmic moderation. It cannot publish or reject anything.

## Decision procedure

1. Assign an eligible reviewer.
2. Inspect the submission, readiness checks, duplicate hints, and risk flags.
3. Recuse if the proposer, sponsor, subject, or expected outcome creates a conflict.
4. Use revision or hold for remediable or high-risk gaps.
5. Record a concise public reason for any public-facing outcome.
6. Put sensitive operational context only in the private reviewer note.
7. For high-risk approval, wait for a second distinct admin/owner.
8. Use merge only when the target is an existing public category or Ken.
9. Do not delete the original record.

## Notification behavior

Admin notification settings independently control:

- new Ken submissions;
- new category proposals;
- submitter review decisions.

If SMTP is not configured, database state and audit history still commit. Email delivery is a notification hook, never part of the transaction's correctness.

## Migration and rollback

Database initialization only adds tables and columns. Existing tasks are never backfilled into `ken_submissions`, which preserves seeded/demo visibility.

Category creation and its proposal transition run in one libSQL write batch. A uniqueness or write failure rolls back the batch. Repeating an already-final approval returns a no-change result, and review-event dedupe keys prevent duplicate history rows.

Before deployment:

```powershell
npm run typecheck
npm run lint
npm run test
npm run build
```

After deployment, verify `/admin#ken-submissions`, `/admin#category-proposals`, `/account#submission-reviews`, `/reviews`, and a private pending Ken URL as proposer, reviewer, and signed-out visitor.
