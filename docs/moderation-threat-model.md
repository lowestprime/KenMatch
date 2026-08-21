# KenMatch moderation threat model

Last reviewed: 2026-07-27

## Scope and goals

KenMatch moderation protects intake integrity and public safety without giving volunteer reviewers control over ranking or permission to silently erase evidence. Review actions are distinct from pulse, scarce voice, category rank, sponsorship, and contributor-credit allocation.

The deterministic intake evaluator is advisory. It checks schema readiness, public-benefit specificity, evaluation readiness, text similarity, lane mismatch, and a bounded high-risk term list. It never publishes, merges, rejects, or suppresses a submission.

## Threats and controls

| Threat | Failure mode | Current control |
| --- | --- | --- |
| Favoritism | A reviewer advances friends or preferred topics. | Reviewers cannot act on their own submission; assignment and every transition are append-only; public outcomes require a reason. |
| Retaliation | A reviewer blocks a critic or rival. | Moderators cannot reject; rejection requires admin/owner authority and a public reason; submitters can appeal. |
| Covert suppression | Material disappears without a record. | No intake action deletes a task, category proposal, or review event. Rejected and merged records remain in submitter and public outcome history. |
| Sponsor pressure | Funding influences publication or rank. | Review state contains no sponsor-ranking control; sponsorship remains separate from rank; all publication decisions are reason coded. |
| Moderator cliques | A group captures final outcomes. | Moderator powers are limited to assignment, recusal, revision requests, and temporary holds. Final publication, merge, and rejection require admin/owner authority. |
| Sybil infiltration | New accounts gain review authority or manufacture signal. | Only owner-granted roles receive reviewer powers; public participation remains governed by attestation and rate limits. Moderation volume earns no voice. |
| Selective enforcement | Similar cases receive unexplained different treatment. | The same deterministic readiness result is stored at submission; public reasons and immutable histories permit comparison and appeal. |
| Review-volume incentives | Reviewers optimize action counts rather than quality. | No automatic credits, rank, or compensation are awarded for moderation volume. |
| Conflicts of interest | A reviewer handles their own or conflicted submission. | Own-submission actions are rejected. Recusal is permanent for that reviewer and entity; assignment must target another eligible reviewer. |
| Owner/admin override abuse | Privileged staff silently bypass controls. | Owner overrides remain append-only and visible in review and general audit logs. High-risk publication requires a second distinct approval. |
| Evidence deletion | A decision destroys challenged material. | Review records are append-only; the application exposes no hard-delete review action. Public notes remain available where safe. |
| Privacy leakage | Private notes or personal details become public. | Public and internal notes are separate fields. Submitters and `/reviews` receive only public notes; operational visitor and audit views are hidden from moderators. |

## Role boundaries

| Capability | Contributor | Moderator | Admin | Owner |
| --- | ---: | ---: | ---: | ---: |
| Submit or appeal own record | Yes | Yes | Yes | Yes |
| View assigned intake details | No | Yes | Yes | Yes |
| Assign reviewer or recuse | No | Yes | Yes | Yes |
| Request revision | No | Yes | Yes | Yes |
| Temporary high-risk hold | No | Yes | Yes | Yes |
| Approve to public voting | No | No | Yes | Yes |
| Merge or reject | No | No | Yes | Yes |
| Resolve appeal | No | No | Yes | Yes |
| Change roles | No | No | No | Yes |

The server re-reads the account role on every decision. Hiding a button is not treated as authorization.

## High-risk quorum

If the deterministic intake snapshot marks a Ken or category as high risk, the first admin/owner approval changes the record to `second-review`. A second, distinct admin/owner must approve it. Repeating the first actor's approval is idempotent and cannot satisfy quorum.

## Appeals

Only the original proposer can appeal a rejected or merged outcome. Appeals require a factual public explanation, are rate limited, clear assignment, and return the record to a visible `appealed` queue. Resolution is a separate, reason-coded event. A reviewer who previously recused cannot decide the appeal.

## Audit and retention

- `review_events` is append-only in application code and has a unique dedupe key.
- Public-facing decisions are also summarized in `/reviews`.
- General privileged actions are duplicated into `audit_log`.
- No review action performs a hard delete.
- Private notes must not contain secrets, unnecessary personal data, or copied credentials.

## Residual risks

- Admin and owner roles remain trusted operators and can change database contents outside the application.
- The deterministic high-risk term list cannot identify every sensitive project; human review remains authoritative.
- Multi-admin quorum depends on at least two independent privileged accounts being available.
- Production deployment should add off-host, append-only audit export before supporting a large volunteer moderator program.
