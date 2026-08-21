# Ranking and Discovery

KenMatch separates the allocation ladder from feed discovery. The allocation
ladder decides lane eligibility inside a category. The feed decides which
public records a reader sees first. Neither path uses sponsorship, budget, or
other money fields as a ranking input.

## Canonical category allocation

`src/lib/allocation.ts` is the canonical allocation implementation.

1. A Ken is eligible only when it has at least one allocation-credit vote, is
   past review, is not blocked, and has a non-pending, non-blocked safety state.
2. Eligible Kens are partitioned by category.
3. Each category is ordered by total allocation-credit voice descending,
   creation time ascending, title ascending, and Ken ID ascending.
4. Ranks 1-3 enter the Months lane, 4-10 enter Weeks, and 11-100 enter Days.
5. Ineligible work remains Queued. Safety-blocked or stage-blocked work remains
   visible in the Blocked lane.

The final ID comparison makes exact ties deterministic. Funding fields are
absent from the comparator.

## Default discovery

The default `/kens` sort is `active`, labeled **Discovery**. It uses explicit
signals already visible on a Ken:

- checkpoint momentum: completed checkpoints or public run updates;
- new and under-reviewed: at most 30 days old with no more than two supporters;
- category leader: rank 1 in the category-local allocation ladder;
- high voice: at least 10 allocation-credit votes;
- broad pulse: at least three positive pulse voters with a two-to-one positive
  ratio;
- active run: Running or Scheduled;
- explicit Under review and Blocked states.

These labels are rendered on feed cards. They are explanations, not hidden
model outputs.

The discovery order first keeps blocked and review-only work behind eligible
work. Within eligible work it uses deterministic proposer rounds, bounded
category rounds, evidence/freshness bands, stage, checkpoint evidence, voice,
trusted pulse, activity, and Ken ID. This gives new categories and
under-reviewed work a bounded opportunity while retaining old work with strong
checkpoint evidence. A prolific proposer cannot fill the first page merely by
submitting more Kens.

The optional sort modes remain literal:

- **Broad pulse** prioritizes pulse from verified, low-risk participants,
  followed by positive breadth, net pulse, total pulse participation, voice,
  activity, and ID.
- **Voice** prioritizes allocation-credit voice and supporter breadth.
- **Recent activity** uses the latest public vote, pulse, comment, update,
  timing, governance, or creation timestamp.
- **Newest first** uses creation time.

Every sort has Ken ID as its final stable tie-break. Pulse is a discovery
signal only; it does not change the category-local allocation ladder.

## Scale boundary

`getMarketplaceData` no longer calls the repository-wide `hydrate()` path.
SQLite/libSQL performs aggregate CTEs, category-local window ranking, filtering,
and deterministic ordering. The application receives at most 20 rows by
default, with a hard maximum of 50. `/kens?page=N` is canonical bounded
pagination; out-of-range pages redirect to the last valid page.

Only viewer state for the selected task IDs is loaded after the page query:
allocation votes, pulse votes, and bookmarks. Categories and the viewer's
public profile are loaded separately. Comments, accounts, checkpoints, runs,
and unrelated task records are not materialized into the application process
for a feed request.

Search is case-insensitive and treats `%`, `_`, and the escape marker as
literal user input. It searches the existing title, problem, public-benefit,
category, packaging, simulation, outcome, sponsor-fit, and model-lineup fields.
Results still pass through the same bounded SQL page.

The database initializes composite indexes for:

- task stage, safety, category, creation time, and ID;
- category-local task discovery;
- vote and pulse aggregation/activity;
- comment, update, checkpoint, and governance activity.

The aggregate query may use temporary B-trees for its window functions and
final mixed-signal ordering. The bounded `LIMIT` prevents result
materialization in the Next.js process; the composite indexes reduce source
scans and support exact filters and activity aggregation.

## Adversarial validation

`tests/discovery.test.ts` covers:

- 10, 100, 10,000, and 100,000 synthetic Kens;
- exact ties and input-order independence;
- one dominant proposer;
- coordinated untrusted pulse compared with trusted breadth;
- high voice with low breadth;
- a sparse new category;
- old checkpoint-backed work;
- blocked and unsafe records;
- canonical filter/reset/page URL generation.

The 100,000-record test checks uniqueness, deterministic ordering after input
reversal, and a generous 15-second upper bound. This is an algorithmic
regression guard, not a production throughput guarantee. Production-scale
latency still depends on the deployed libSQL service, data distribution,
concurrent traffic, and query-plan monitoring.

## Deliberate limits

- Attestation reduces the influence of untrusted pulse in the pulse view; it
  cannot prove that verified people are uncoordinated.
- Allocation-credit voice can still reflect organized advocacy. Quadratic cost,
  per-Ken limits, participation policy, and public totals make concentration
  harder and more visible, but do not make collective judgment infallible.
- Discovery diversity does not alter lane rank.
- Search uses escaped SQL matching rather than a semantic model. A future
  full-text index can improve latency without changing the public ordering
  contract.
