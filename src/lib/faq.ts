import type { FAQEntry } from "@/lib/types";

export const KEN_DEFINITION =
  "A Ken is a bounded public proposal for sustained AI-assisted work, with sources, checkpoints, and review.";

export const FAQ_ENTRIES: FAQEntry[] = [
  {
    id: "what-is-a-ken",
    category: "basics",
    question: "What is a Ken?",
    answer:
      `${KEN_DEFINITION} A good Ken is specific enough to inspect, valuable enough to deserve scarce attention, and structured so progress can be reviewed publicly instead of disappearing into a private chat or private lab queue.`,
    keywords: ["ken", "definition", "proposal", "ai work", "checkpoint"],
  },
  {
    id: "why-kenmatch-exists",
    category: "basics",
    question: "Why does KenMatch exist?",
    answer:
      "KenMatch exists to make the prioritization layer for long-horizon frontier AI work visible. As models become more capable, the public should be able to help define which scientific, technical, safety, and public-benefit problems deserve sustained attention instead of leaving that allocation entirely to private capital and closed institutional access.",
    keywords: ["mission", "public", "frontier ai", "allocation", "capital"],
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
    id: "lanes",
    category: "allocation",
    question: "What are Months, Weeks, and Days lanes?",
    answer:
      "Lanes describe the maximum duration and review cadence for a Ken. Months lanes are for the top long-horizon work in each category, Weeks lanes are for multi-step research or build runs, and Days lanes are for focused deliverables with clear acceptance checks. Queued Kens are still gathering signal; Blocked Kens are held by safety or governance review.",
    keywords: ["lanes", "tier", "months", "weeks", "days", "queued", "blocked"],
  },
  {
    id: "voice-vs-pulse",
    category: "participation",
    question: "What is the difference between pulse and allocation credits?",
    answer:
      "Pulse is quick forum-style signal: support or concern. Allocation credits are scarcer and intentionally harder to concentrate, so spending more voice on the same Ken costs more. This lets broad support matter without letting one account cheaply dominate a category.",
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
      "Blocked Kens stay visible so the safety boundary can be inspected. A blocked record does not mean KenMatch endorses the work; it documents why public signal, sponsorship, or curiosity cannot override an unsafe or inappropriate run.",
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
