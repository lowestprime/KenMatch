import assert from "node:assert/strict";
import test from "node:test";

import {
  CONTACT_ATTACHMENT_LIMITS,
  CONTACT_OWNER_EMAIL,
  contactSchema,
  sanitizeContactAttachmentName,
  validateContactAttachmentMeta,
} from "../src/lib/contact.ts";
import {
  FAQ_ENTRIES,
  FAQ_RESEARCH_RETRIEVED_AT,
  KEN_DEFINITION,
  filterFAQEntries,
} from "../src/lib/faq.ts";
import { GLOSSARY_ENTRIES, filterGlossaryEntries } from "../src/lib/glossary.ts";
import { PRODUCT_TRUTH_ITEMS } from "../src/lib/product-truth.ts";

test("FAQ includes a direct Ken definition entry", () => {
  const entry = FAQ_ENTRIES.find((item) => item.id === "what-is-a-ken");
  assert.ok(entry);
  assert.ok(entry.answer.includes(KEN_DEFINITION));
  assert.ok(FAQ_ENTRIES.some((item) => item.keywords.includes("sponsor")));
});

test("FAQ covers the complete strategic question queue with dated primary sources", () => {
  const requiredIds = [
    "closest-equivalents",
    "differentiation",
    "societal-value",
    "candidate-partners",
    "clone-resilience",
    "provider-dependency",
    "operational-resilience",
    "why-trust",
    "account-benefit",
    "incentives-implemented",
    "classification",
    "funding-scarcity",
    "quality-contract",
    "stop-conditions",
    "objective-subjective",
    "scale-discovery",
  ];
  for (const id of requiredIds) {
    assert.ok(FAQ_ENTRIES.some((entry) => entry.id === id), `missing FAQ entry ${id}`);
  }
  const sourced = FAQ_ENTRIES.filter((entry) => entry.sources?.length);
  assert.ok(sourced.length >= 6);
  assert.ok(sourced.every((entry) => entry.sources?.every((source) => source.retrievedAt === FAQ_RESEARCH_RETRIEVED_AT)));
});

test("FAQ filtering is normalized, deterministic, and resettable", () => {
  const byProvider = filterFAQEntries(FAQ_ENTRIES, "FRONTIER MODEL", "all");
  assert.ok(byProvider.some((entry) => entry.id === "provider-dependency"));
  assert.deepEqual(
    filterFAQEntries(FAQ_ENTRIES, "", "all").map((entry) => entry.id),
    FAQ_ENTRIES.map((entry) => entry.id),
  );
  assert.ok(filterFAQEntries(FAQ_ENTRIES, "", "privacy").every((entry) => entry.category === "privacy"));
});

test("glossary covers required operational terms and shared policy constants", () => {
  const requiredIds = [
    "ken",
    "public-pulse",
    "allocation-credit",
    "quadratic-cost",
    "quality-bond",
    "category",
    "category-proposal",
    "lane",
    "days-lane",
    "weeks-lane",
    "months-lane",
    "queued-lane",
    "blocked-lane",
    "lifecycle",
    "intake-review",
    "board-approval",
    "checkpoint",
    "checkpoint-gate",
    "run-budget",
    "rollback-plan",
    "release-gate",
    "partial-delivery",
    "early-completion",
    "post-run-audit",
    "attestation",
    "verification",
    "sybil-risk-band",
    "public-board",
    "safety-validity-review",
    "sponsor-restriction",
    "support-state",
    "treasury",
    "reserve",
    "coverage",
    "public-benefit",
    "sandbox",
    "moderation-role",
    "audit-log",
    "evidence-provenance",
  ];
  assert.equal(new Set(GLOSSARY_ENTRIES.map((entry) => entry.id)).size, GLOSSARY_ENTRIES.length);
  for (const id of requiredIds) {
    assert.ok(GLOSSARY_ENTRIES.some((entry) => entry.id === id), `missing glossary term ${id}`);
  }
  const credit = GLOSSARY_ENTRIES.find((entry) => entry.id === "allocation-credit");
  assert.match(credit?.operationalDefinition ?? "", /begins with 3 credits/i);
  assert.ok(GLOSSARY_ENTRIES.every((entry) => entry.implementation.length && entry.governingRules.length && entry.route));
});

test("glossary filtering supports implementation state and normalized search", () => {
  assert.ok(filterGlossaryEntries(GLOSSARY_ENTRIES, "QUADRATIC", "all").some((entry) => entry.id === "quadratic-cost"));
  assert.ok(filterGlossaryEntries(GLOSSARY_ENTRIES, "", "proposed").every((entry) => entry.status === "proposed"));
  assert.deepEqual(filterGlossaryEntries(GLOSSARY_ENTRIES, "", "all"), GLOSSARY_ENTRIES);
});

test("public truth matrix reflects the operational review and privacy boundaries", () => {
  const review = PRODUCT_TRUTH_ITEMS.find((item) => item.id === "review");
  const analytics = PRODUCT_TRUTH_ITEMS.find((item) => item.id === "analytics");
  assert.equal(review?.status, "operational");
  assert.match(review?.evidence ?? "", /dual-control high-risk approval/i);
  assert.match(review?.limitation ?? "", /no external volunteer moderator cohort/i);
  assert.match(analytics?.limitation ?? "", /raw IPs.*not retained/i);
});

test("contact schema accepts complete feedback and rejects short bodies", () => {
  const valid = contactSchema.safeParse({
    title: "Partnership question",
    topic: "partnership",
    replyEmail: "reader@example.com",
    bodyMarkdown: "This is a specific partnership question with enough detail.",
  });
  assert.equal(valid.success, true);

  const invalid = contactSchema.safeParse({
    title: "Bad",
    topic: "question",
    replyEmail: "not-an-email",
    bodyMarkdown: "Too short",
  });
  assert.equal(invalid.success, false);
});

test("contact attachment validation enforces size and type limits", () => {
  assert.equal(
    validateContactAttachmentMeta({
      name: "note.md",
      type: "text/markdown",
      size: 100,
      nextTotalBytes: 100,
    }),
    null,
  );
  assert.match(
    validateContactAttachmentMeta({
      name: "archive.exe",
      type: "application/x-msdownload",
      size: 100,
      nextTotalBytes: 100,
    }) ?? "",
    /unsupported/i,
  );
  assert.match(
    validateContactAttachmentMeta({
      name: "large.pdf",
      type: "application/pdf",
      size: CONTACT_ATTACHMENT_LIMITS.maxFileBytes + 1,
      nextTotalBytes: CONTACT_ATTACHMENT_LIMITS.maxFileBytes + 1,
    }) ?? "",
    /larger than 2 MB/i,
  );
});

test("contact helper exposes anonymized owner fallback and safe filenames", () => {
  assert.equal(CONTACT_OWNER_EMAIL, "owner@kmat.ch");
  assert.equal(sanitizeContactAttachmentName("../bad<script>.png"), ".._bad_script_.png");
});
