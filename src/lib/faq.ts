import { KEN_LIFECYCLE_STAGES, LANE_OPERATING_POLICIES, SUBMISSION_APPROVAL_CRITERIA, TOKEN_ASSIGNMENT_RULES } from "./allocation-policy.ts";
import type { FAQEntry } from "./types.ts";

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
];
