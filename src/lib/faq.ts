import { KEN_LIFECYCLE_STAGES, LANE_OPERATING_POLICIES, SUBMISSION_APPROVAL_CRITERIA, TOKEN_ASSIGNMENT_RULES } from "./allocation-policy.ts";
import type { FAQEntry } from "./types.ts";
import { normalizeSearchText } from "./search-text.ts";

export const FAQ_RESEARCH_RETRIEVED_AT = "2026-07-27";

const researchSources = {
  cip: {
    label: "Collective Intelligence Project — Global Dialogues",
    url: "https://www.cip.org/globaldialogues",
    retrievedAt: FAQ_RESEARCH_RETRIEVED_AT,
  },
  metagov: {
    label: "Metagov — mission and projects",
    url: "https://metagov.org/",
    retrievedAt: FAQ_RESEARCH_RETRIEVED_AT,
  },
  polis: {
    label: "Polis — open-source large-group deliberation",
    url: "https://pol.is/home",
    retrievedAt: FAQ_RESEARCH_RETRIEVED_AT,
  },
  loomio: {
    label: "Loomio — open-source collaborative decisions",
    url: "https://www.loomio.com/about/",
    retrievedAt: FAQ_RESEARCH_RETRIEVED_AT,
  },
  challengeGov: {
    label: "Challenge.gov — public crowdsourcing and prize challenges",
    url: "https://www.challenge.gov/assets/document-library/ChallengeGov_Platform_Overview.pdf",
    retrievedAt: FAQ_RESEARCH_RETRIEVED_AT,
  },
  openAiAccess: {
    label: "OpenAI Researcher Access Program",
    url: "https://grants.openai.com/prog/openai_researcher_access_program/",
    retrievedAt: FAQ_RESEARCH_RETRIEVED_AT,
  },
  microsoftStartups: {
    label: "Microsoft for Startups — program overview",
    url: "https://learn.microsoft.com/en-us/startups/microsoft-for-startups/overview",
    retrievedAt: FAQ_RESEARCH_RETRIEVED_AT,
  },
} as const;

export const KEN_DEFINITION =
  "A Ken is a public work order for sustained AI-assisted work: a clear problem, evidence base, run lane, checkpoints, and review trail that the board can inspect from proposal through delivery.";

export const KEN_NAME_ORIGIN =
  "Ken is an older English noun for a range of vision, scope of knowledge, or extent of understanding — the sense preserved in the phrase beyond my ken. In KenMatch, each Ken marks a boundary of what the public wants to know, build, test, or discover, then makes that boundary visible enough for collective design, ranking, funding, and review.";

const lifecycleSummary = KEN_LIFECYCLE_STAGES.map((stage) => `${stage.label}: ${stage.summary}`).join(" ");
const creditSummary = TOKEN_ASSIGNMENT_RULES.map((rule) => `${rule.label}: ${rule.credits} credit${rule.credits === 1 ? "" : "s"} (${rule.cadence}). ${rule.criteria}`).join(" ");
const laneSummary = Object.values(LANE_OPERATING_POLICIES).map((lane) => `${lane.label}: ${lane.bestFor}; bond ${lane.bondCredits}; checkpoints are ${lane.checkpointCadence}.`).join(" ");
const approvalSummary = SUBMISSION_APPROVAL_CRITERIA.map((criterion) => `• ${criterion}`).join(" ");

export const FAQ_ENTRIES: FAQEntry[] = [
  {
    id: "what-is-a-ken",
    category: "basics",
    question: "What is a Ken?",
    answer:
      `${KEN_DEFINITION} Think of a Ken as a public, inspectable brief for work that may need more continuity than a normal prompt: the problem, source material, proposed outputs, risks, and checkpoint gates are visible before scarce compute is allocated.`,
    keywords: ["ken", "definition", "proposal", "ai work", "checkpoint", "work order"],
  },
  {
    id: "why-called-ken",
    category: "basics",
    question: "Why is it called a Ken?",
    answer: KEN_NAME_ORIGIN,
    keywords: ["ken", "name", "etymology", "beyond my ken", "knowledge", "vision", "understanding"],
  },
  {
    id: "why-kenmatch-exists",
    category: "basics",
    question: "Why does KenMatch exist?",
    answer:
      "KenMatch exists because future AI systems may become able to address long-horizon intellectual work more comprehensively than any individual expert, but the public still needs a way to decide which problems deserve sustained attention. The prototype tests a public ranking, checkpoint, and funding layer so creativity, taste, evidence, and public benefit can guide frontier compute instead of leaving allocation only to private capital or closed institutional queues.",
    keywords: ["mission", "public", "frontier ai", "allocation", "capital", "public benefit"],
  },
  {
    id: "what-is-the-board",
    category: "operations",
    question: "Who is the board, and how much power does it have?",
    answer:
      "The board is not a private committee that can secretly pick winners. It is the public operating surface where contributors propose Kens, add evidence, spend scarce allocation credits, discuss risks, and inspect checkpoints. Verified reviewers and moderators can help enforce submission quality, safety boundaries, and reproducibility requirements; sponsors can fund capacity; owner/admin operators keep the prototype running. None of those roles should let money buy rank, hide objections, skip review gates, or convert a public Ken into private control.",
    keywords: ["board", "roles", "governance", "moderator", "reviewer", "sponsor", "owner", "power"],
  },
  {
    id: "discussion-tab",
    category: "participation",
    question: "What is the Discussion tab for?",
    answer:
      "Discussion is the non-Ken-specific commons. It is where users can workshop prompt designs, debate category boundaries, propose rules, review funding norms, explain safety concerns, and preserve reusable evidence before those ideas become specific Kens. Per-Ken threads stay attached to the Ken they affect; broader ecosystem debate belongs in Discussion so the Feed remains focused on executable work.",
    keywords: ["discussion", "forum", "reddit", "comments", "community", "meta", "prompt design"],
  },
  {
    id: "profiles-bookmarks",
    category: "participation",
    question: "How do profiles and saved items fit into KenMatch?",
    answer:
      "Profiles make contribution history legible: submitted Kens, public role, verification state, expertise, links, and visible participation capacity. Bookmarks let signed-in users save Kens they want to revisit from Account. The intended next step is to extend the same save pattern to discussion posts and high-value comments so contributors can build a personal research queue across the whole ecosystem.",
    keywords: ["profile", "profiles", "bookmarks", "saved", "favorites", "account", "comments"],
  },
  {
    id: "sandbox-status",
    category: "operations",
    question: "Are the current runs, dollar amounts, and sponsor totals real?",
    answer:
      "No. The public prototype uses clearly labeled sandbox data for funding, pilot users, run results, and model execution. The point is to show the governance and product shape before live commitments, provider integrations, or production execution are represented as real.",
    keywords: ["sandbox", "simulated", "funding", "sponsors", "prototype"],
  },
  {
    id: "lifecycle",
    category: "operations",
    question: "What happens from Ken submission to completion?",
    answer:
      `The lifecycle is deliberately public and checkpointed. ${lifecycleSummary}`,
    keywords: ["lifecycle", "stages", "approval", "run", "checkpoint", "audit"],
  },
  {
    id: "approval-requirements",
    category: "allocation",
    question: "What does a Ken need before it can be approved and run?",
    answer:
      `A Ken must be specific, inspectable, useful, and reviewable before it should receive scarce compute. Approval checks include: ${approvalSummary}`,
    keywords: ["approval", "requirements", "submit", "review", "criteria", "run"],
  },
  {
    id: "lanes",
    category: "allocation",
    question: "What are Months, Weeks, and Days lanes?",
    answer:
      `Lanes describe the maximum duration and review cadence for a Ken. ${laneSummary} Queued Kens are still gathering signal; Blocked Kens are held by review.` ,
    keywords: ["lanes", "tier", "months", "weeks", "days", "queued", "blocked"],
  },
  {
    id: "credits-earned",
    category: "allocation",
    question: "How are allocation credits assigned, replenished, or earned?",
    answer:
      `Allocation credits are scarce voice credits, not money. Current policy: ${creditSummary} Awards should point to visible public work, verification evidence, or accepted checkpoint contributions so credit assignment remains auditable.`,
    keywords: ["credits", "tokens", "replenishment", "earn", "voice", "award", "verification"],
  },
  {
    id: "voice-vs-pulse",
    category: "participation",
    question: "What is the difference between pulse and allocation credits?",
    answer:
      "Pulse is quick forum-style signal: support or concern. Allocation credits are scarcer and intentionally harder to concentrate, so spending more voice on the same Ken costs quadratically. This lets broad support matter without letting one account cheaply dominate a category.",
    keywords: ["pulse", "voice", "credits", "vote", "quadratic"],
  },
  {
    id: "money-rank",
    category: "backing",
    question: "Can money buy rank?",
    answer:
      "No. Sponsorship can support compute, review, moderation, and operations, but it does not buy public rank, release approvals, hidden priority, or extra voice. Restrictions and sponsor context stay visible so readers can inspect where backing is attached.",
    keywords: ["money", "sponsor", "rank", "backing", "funding"],
  },
  {
    id: "sponsor-incentives",
    category: "backing",
    question: "What do sponsors or backers receive?",
    answer:
      "Backers can fund compute supply, review capacity, moderation, delivery support, or restricted public-good pools. They receive transparent attribution, a visible funding trail, and a clearer path from public demand to completed artifacts, but they do not receive votes, ranking power, safety overrides, or private control of public Kens.",
    keywords: ["sponsor", "backer", "incentive", "funding", "treasury", "attribution"],
  },
  {
    id: "contributor-incentives",
    category: "participation",
    question: "How are successful contributors rewarded?",
    answer:
      "Contributors can earn credibility, verification capacity, and allocation-credit awards when their proposals, evidence, review notes, tests, reproducibility work, or checkpoint contributions materially improve a successful Ken. The rule is simple: rewards should be tied to visible contributions that helped the public board make or validate a better decision.",
    keywords: ["contributor", "reward", "credits", "successful", "checkpoint", "reputation"],
  },
  {
    id: "who-can-participate",
    category: "participation",
    question: "Who can participate?",
    answer:
      "Anyone can read public Kens. Accounts are needed to vote, comment, submit Kens, request verification, or build a contributor reputation. Attestation can increase participation capacity when a contributor has evidence of relevant expertise, but the prototype is designed to avoid making status or wealth the default gate.",
    keywords: ["account", "verification", "attestation", "participation"],
  },
  {
    id: "categories",
    category: "allocation",
    question: "What do categories do?",
    answer:
      "Categories group Kens by domain so different kinds of work are not forced into one global list. Each category has its own rankings and visual marker, and category chips anywhere on the site link directly to the filtered Feed view for that category.",
    keywords: ["category", "filter", "domain", "feed"],
  },
  {
    id: "blocked-kens",
    category: "safety",
    question: "Why show blocked Kens?",
    answer:
      "Blocked Kens stay visible so the boundary can be inspected. A blocked record does not mean KenMatch endorses the work; it documents why public signal, sponsorship, or curiosity cannot override a blocked or inappropriate run.",
    keywords: ["blocked", "safety", "governance", "boundary"],
  },
  {
    id: "privacy",
    category: "privacy",
    question: "What visitor data is collected?",
    answer:
      "The admin visitor map uses country-level Cloudflare geolocation headers and salted visitor hashes for operating awareness. It is not designed for personal tracking, and public UI should describe it as approximate country-level traffic rather than identity data.",
    keywords: ["privacy", "visitor", "map", "cloudflare", "salted hash"],
  },
  {
    id: "submitting",
    category: "participation",
    question: "What makes a strong Ken submission?",
    answer:
      "A strong Ken names the concrete output, the unmet need, why the timing matters, who benefits, what evidence should ground the work, what checkpoints should stop or redirect it, and what risks require review.",
    keywords: ["submit", "proposal", "evidence", "deliverables", "risk"],
  },
  {
    id: "contact",
    category: "operations",
    question: "How do I send a question, suggestion, or partnership inquiry?",
    answer:
      "Use the contact form on this FAQ page or the About page. It supports a title, markdown body, reply email, topic, and small attachments. Messages are routed to the KenMatch owner when SMTP is configured and saved locally either way.",
    keywords: ["contact", "email", "feedback", "attachments", "partnership"],
  },
  {
    id: "closest-equivalents",
    category: "basics",
    question: "Does anything like KenMatch already exist?",
    answer:
      "No direct equivalent was found in the bounded July 2026 review. Several systems match one part of the pattern: Reddit, Hacker News, and Stack Exchange curate discussion; Polis and Loomio support deliberation and decisions; Challenge.gov and Kaggle organize public challenges; the Collective Intelligence Project gathers public input for AI governance; and Metagov develops digital-governance infrastructure. KenMatch’s intended combination is narrower and more operational: rank bounded public AI work, assign duration lanes, keep money out of rank, and preserve checkpoints through delivery. “No direct equivalent found” is not proof that no competitor exists.",
    keywords: ["competitor", "equivalent", "alternative", "reddit", "polis", "loomio", "challenge"],
    sources: [researchSources.polis, researchSources.loomio, researchSources.challengeGov, researchSources.cip, researchSources.metagov],
  },
  {
    id: "differentiation",
    category: "basics",
    question: "How is KenMatch different, and what is actually defensible?",
    answer:
      "The differentiator is the joined public record: a Ken begins as an inspectable work order, competes in a category-local lane using non-purchasable quadratic voice, receives disclosed backing that cannot buy rank, and remains visible through checkpoints, redirects, partial delivery, and audit. None of those mechanisms alone is a durable moat, and the current code can be copied. Defensibility would have to come from trusted governance, accumulated public evidence, contributor reputation, reproducible artifacts, provider independence, and a community that prefers an auditable neutral record over a closed feature inside another platform.",
    keywords: ["unique", "differentiation", "moat", "defensible", "copy", "clone"],
    sources: [researchSources.cip, researchSources.metagov],
  },
  {
    id: "societal-value",
    category: "basics",
    question: "What novel public value could KenMatch create?",
    answer:
      "KenMatch could make unmet needs legible before an institution or wealthy sponsor chooses them, preserve dissent and failed approaches, and convert public judgment into an auditable queue for sustained AI-assisted work. Its value is not that voting makes a result true. It is that people can collectively surface priorities, attach evidence and acceptance criteria, inspect who influenced a decision, and reuse the resulting artifacts and correction history.",
    keywords: ["public value", "society", "necessary", "collective intelligence", "benefit"],
    sources: [researchSources.cip, researchSources.metagov],
  },
  {
    id: "candidate-partners",
    category: "backing",
    question: "Which organizations could be credible partner candidates?",
    answer:
      "Candidate classes—not announced partners—include frontier-model or cloud providers with public researcher/startup-access programs; universities and public-interest research groups that can supply reviewers and evaluation methods; civic-governance organizations such as the Collective Intelligence Project or Metagov; foundations and public agencies funding transparent public goods; and open-source maintainers able to test real deliverables. Current examples show that subsidized API or startup credits and public-input programs exist, but eligibility, terms, and strategic interest can change. Any relationship would require written scope, conflict disclosure, data boundaries, and an explicit rule that support buys capacity rather than rank.",
    keywords: ["partner", "openai", "microsoft", "university", "foundation", "provider"],
    sources: [researchSources.openAiAccess, researchSources.microsoftStartups, researchSources.cip, researchSources.metagov],
  },
  {
    id: "clone-resilience",
    category: "operations",
    question: "What if Reddit, a frontier lab, or another large platform clones the idea?",
    answer:
      "KenMatch cannot guarantee protection from copying, and it should not depend on a proprietary ranking trick. The resilience strategy is portability and trust: open rules, exportable public records, provider-neutral run plans, category-local governance, visible conflicts, reproducible artifacts, and a strict separation between sponsorship and rank. A larger host could reproduce the interface; it would still need to earn confidence that ranking, moderation, and provider incentives do not silently control outcomes. KenMatch should make migration and independent verification possible so community history is not trapped by one operator.",
    keywords: ["reddit", "stack exchange", "hacker news", "clone", "capture", "platform"],
    sources: [researchSources.loomio, researchSources.metagov],
  },
  {
    id: "provider-dependency",
    category: "operations",
    question: "How can KenMatch survive dependence on frontier-model and compute providers?",
    answer:
      "It cannot eliminate that dependency. The correct design is to expose it: provider adapters, budgets, model and tool provenance, portable checkpoints, retry and redirect reasons, and acceptance tests that are not defined by the provider. The current prototype has production-shaped run and checkpoint records but no configured public long-horizon provider execution. A future deployment should support more than one provider, retain a provider-independent artifact format, and pause safely when cost, policy, or reliability changes.",
    keywords: ["provider", "model", "dependency", "openai", "anthropic", "compute", "outage"],
    sources: [researchSources.openAiAccess, researchSources.microsoftStartups],
  },
  {
    id: "operational-resilience",
    category: "operations",
    question: "How resilient is KenMatch operationally and economically today?",
    answer:
      "Today it is a public prototype, not a guaranteed utility. It has account-backed records, deterministic allocation rules, sandbox funding states, health checks, documented backups and rollback, and a container deployment path. Material concentration risks remain: one operator, a single primary deployment, locally managed persistence, external email and payment services, and no live multi-provider execution pool. The product truth surface below identifies these states so resilience is measured rather than asserted.",
    keywords: ["resilience", "operations", "economic", "uptime", "backup", "single operator"],
  },
  {
    id: "why-trust",
    category: "operations",
    question: "Why should a user or backer trust KenMatch’s claims?",
    answer:
      "Trust should come from verifiable constraints, not the founder’s assurances: source-visible rules, sandbox labels beside simulated numbers, money/rank separation, reason-coded decisions, public checkpoints, correction history, restricted admin access, and independently reproducible tests and artifacts. KenMatch does not guarantee that public ranking is wise, that every review is unbiased, or that every run will succeed. Its obligation is to make evidence, uncertainty, conflicts, failures, and implementation status inspectable enough to challenge.",
    keywords: ["trust", "claims", "proof", "audit", "transparency", "backer"],
  },
  {
    id: "account-benefit",
    category: "participation",
    question: "Why make an account and keep participating?",
    answer:
      "Reading remains open. An account lets you attach accountable pulse and scarce voice, comment, bookmark work, submit Kens and category proposals, request verification, follow review status, and build a public contribution record. Continued participation can improve what enters the queue and can earn bounded credit for accepted proposals or useful checkpoint work. No financial return, job, execution date, or influence outcome is guaranteed.",
    keywords: ["account", "benefit", "participate", "bookmark", "reputation", "incentive"],
  },
  {
    id: "incentives-implemented",
    category: "participation",
    question: "How are user, reviewer, creator, and backer incentives implemented?",
    answer:
      "Current incentives are concrete but limited. Contributors receive public attribution, saved work, an inspectable history, baseline/monthly voice, and bounded reviewed credit awards for accepted Kens, verification, or useful checkpoint contributions. Reviewers gain attributable evidence of useful work but no private ranking multiplier. Backers receive disclosed attribution and an auditable path from support to capacity, never votes or release control. Future revenue sharing, employment, prizes, or tradable tokens are not implemented and are not promised.",
    keywords: ["incentives", "creator", "reviewer", "backer", "credits", "reward"],
  },
  {
    id: "classification",
    category: "operations",
    question: "What is KenMatch’s current organizational and business-model classification?",
    answer:
      "Technically, KenMatch is an independently operated, open-source civic-tech and public-interest coordination prototype with a production-shaped web application and simulated compute marketplace. It is not currently a DAO, blockchain protocol, cooperative, public agency, or guaranteed compute utility. A public-benefit corporate form and open-source-plus-managed-services model have been proposed in concept documents, but no public UI should imply that a particular legal entity, partnership, nonprofit status, or revenue model already exists until it is formally established and documented.",
    keywords: ["classification", "business model", "organization", "pbc", "dao", "nonprofit"],
  },
  {
    id: "funding-scarcity",
    category: "backing",
    question: "What happens when funding or compute capacity is inadequate?",
    answer:
      "The public board and historical records should remain available. Capacity moves through explicit states: normal, constrained, new launches paused, and critical-maintenance-only. New runs can wait without losing rank; active runs may continue only to a safe checkpoint; safety, integrity, backup, and incident work take precedence; restricted funds remain restricted; and users see why execution is waiting. The current prototype models treasury and coverage but does not guarantee an adequate live pool or an execution date.",
    keywords: ["funding", "scarcity", "run out", "shutdown", "capacity", "pause", "queue"],
  },
  {
    id: "quality-contract",
    category: "safety",
    question: "How is the quality of a Ken’s output enforced?",
    answer:
      "Quality is not inferred from model confidence or popularity. A run must name deliverables, acceptance criteria, source and provenance requirements, checkpoint gates, artifact links or digests, reviewer decisions, correction history, rollback needs, and an explicit release outcome. A failed threshold can produce revision, redirect, pause, block, or partial delivery. The prototype implements many of these records in sandbox form; a live provider run would still require qualified reviewers and domain-specific tests.",
    keywords: ["quality", "output", "acceptance", "checkpoint", "review", "artifact"],
  },
  {
    id: "stop-conditions",
    category: "safety",
    question: "When can a long-running Ken stop before its maximum runtime?",
    answer:
      "A run can stop or pause for safety escalation, failed acceptance thresholds, missing or invalid provenance, budget/runtime cap, repeated tool or provider failure, duplication or supersession, invalidated scope, reviewer redirect, owner operational emergency with an audit note, or successful early completion. The decision must distinguish failure from useful partial delivery and successful early completion, preserve available evidence, name the reason and actor, and remain in the audit trail.",
    keywords: ["stop", "termination", "pause", "early completion", "failure", "runtime"],
  },
  {
    id: "objective-subjective",
    category: "operations",
    question: "Which KenMatch decisions are objective, and which require human judgment?",
    answer:
      "Programmatic checks include schema validation, credit arithmetic, quadratic cost, deterministic tie-breaking, lane limits, rate limits, timing caps, and explicit eligibility rules. Automated warnings can flag missing fields, collisions, or risk terms. Human judgment remains necessary for public benefit, category boundaries, safety and validity, evidence quality, checkpoint quality, sponsor fit, conflict handling, and final release. Entering a subjective decision through software does not make it objective; the reviewer and reason must stay visible.",
    keywords: ["objective", "subjective", "automated", "human", "algorithm", "judgment"],
  },
  {
    id: "scale-discovery",
    category: "allocation",
    question: "How should discovery remain reliable when Ken volume grows?",
    answer:
      "Eligibility, evidence, popularity, scarce voice, freshness, and discovery stay separate. The canonical lane order is deterministic and category-local. The current feed uses bounded SQL pages, stable ID tie-breaks, visible reason labels, controlled opportunities for new and under-reviewed work, proposer/category diversity, and resurfacing for old work with checkpoint evidence. Blocked and review records are handled explicitly; money never enters either order; and no opaque model silently chooses priority. Property tests cover exact ties, coordinated untrusted pulse, a dominant proposer, sparse categories, old checkpoint-backed work, blocked records, and inputs through 100,000 Kens. Those tests protect algorithm behavior but are not a production throughput guarantee.",
    keywords: ["scale", "ranking", "discovery", "100000", "freshness", "brigading", "pagination"],
  },
  {
    id: "submitted-ken-review",
    category: "operations",
    question: "Does a submitted Ken enter a review queue?",
    answer:
      "The intended contract is explicit intake rather than immediate silent publication: automated readiness warnings, risk and duplicate hints, requested-versus-estimated lane, revision, approve, reject, or merge decisions, reviewer assignment, timestamps, immutable history, and submitter-visible status. The complete queue is being implemented against the existing submission and seeded-data model; until it is validated, KenMatch should not claim that every one of those review states is operational.",
    keywords: ["submitted ken", "review queue", "intake", "revision", "approve", "reject"],
  },
  {
    id: "moderation-boundaries",
    category: "safety",
    question: "Will KenMatch use volunteer moderators, and how is capture limited?",
    answer:
      "Broad discretionary moderator power is not the default. Safe volunteer capabilities are narrow: flag or triage, request revision, propose a reason-coded action, place a temporary high-risk hold, declare expertise, recuse, and participate in an appeal or second review. Public evidence is not silently deleted; moderation volume does not buy voice; conflicts and sponsor pressure are recorded; high-impact decisions require stronger review. A complete role, recusal, and appeal workflow must pass authorization and audit tests before it is described as operational.",
    keywords: ["moderation", "volunteer", "capture", "appeal", "recusal", "conflict"],
  },
];

export function filterFAQEntries(
  entries: FAQEntry[],
  query: string,
  category: FAQEntry["category"] | "all",
) {
  const normalized = normalizeSearchText(query);
  return entries.filter((entry) => {
    if (category !== "all" && entry.category !== category) return false;
    if (!normalized) return true;
    return normalizeSearchText([
      entry.question,
      entry.answer,
      entry.category,
      ...entry.keywords,
    ].join(" ")).includes(normalized);
  });
}
