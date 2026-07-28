import assert from "node:assert/strict";
import test from "node:test";

import {
  evaluateCategoryIntake,
  evaluateKenIntake,
  normalizedReviewSlug,
  textSimilarity,
} from "../src/lib/intake-review.ts";
import {
  assertReviewActionAuthorized,
  canPerformReviewAction,
  nextReviewStatus,
} from "../src/lib/review-policy.ts";

test("category intake normalizes collisions and surfaces deterministic similarity hints", () => {
  assert.equal(normalizedReviewSlug("  Science, Health & Safety  "), "science-health-safety");
  assert.equal(textSimilarity("Public health evidence", "Evidence for public health"), 0.75);

  const result = evaluateCategoryIntake(
    {
      name: "Public Health Evidence",
      description: "Review public-health evidence, reproducibility, provenance, and shared evaluation methods while excluding individual clinical advice.",
      publicBenefit: "Produce open, transparent, and auditable evidence resources that communities and public-interest researchers can inspect and reuse.",
      exampleKens: ["Living evidence map for rare disease", "Reproducible public-health benchmark registry"],
    },
    [
      {
        id: "health-evidence",
        name: "Health Evidence",
        description: "Public-health evidence and reproducibility.",
      },
    ],
  );

  assert.equal(result.normalizedSlug, "public-health-evidence");
  assert.equal(result.similarityHints[0]?.id, "health-evidence");
  assert.equal(result.checks.find((item) => item.id === "examples")?.level, "pass");
});

test("category intake rejects vague boundaries and one repeated example", () => {
  const result = evaluateCategoryIntake({
    name: "Other",
    description: "Anything else that seems useful for people and projects.",
    publicBenefit: "It may be useful.",
    exampleKens: ["Same example", "Same example"],
  });

  assert.equal(result.outcome, "review");
  assert.equal(result.checks.find((item) => item.id === "category-boundary")?.level, "attention");
  assert.equal(result.checks.find((item) => item.id === "examples")?.level, "attention");
});

test("Ken intake estimates scope, highlights duplicates, and requires quorum for high risk", () => {
  const result = evaluateKenIntake(
    {
      title: "Critical Infrastructure Exploit Audit",
      summary: "Build a public audit harness for long-running infrastructure security evaluations.",
      problem: "Existing infrastructure evaluations lack reproducible checkpoints and visible evidence.",
      whyNow: "Model capabilities and public dependency on these systems are increasing.",
      publicBenefit: "Publish open, auditable safety checks and reproducible evidence for public-interest infrastructure operators and researchers.",
      deliverables: ["Threat-model registry", "Reproducible test harness", "Public evidence report"],
      evaluationCriteria: ["Independent replay succeeds", "Every finding has a source", "Unsafe tests stay sandboxed"],
      riskFlags: ["Could expose an exploit against critical infrastructure"],
      evidence: ["Public NIST infrastructure security guidance", "Prior reproducibility benchmark"],
      requestedTier: "days",
    },
    [{ id: "existing-audit", title: "Infrastructure Security Audit", summary: "A reproducible public test harness." }],
  );

  assert.equal(result.highRisk, true);
  assert.equal(result.outcome, "high-risk");
  assert.notEqual(result.estimatedTier, "days");
  assert.equal(result.scopeMismatch, true);
  assert.equal(result.similarityHints[0]?.id, "existing-audit");
  assert.equal(nextReviewStatus("approve", {
    highRisk: true,
    firstApprovalBy: null,
    actorAccountId: "admin-a",
  }), "second-review");
  assert.equal(nextReviewStatus("approve", {
    highRisk: true,
    firstApprovalBy: "admin-a",
    actorAccountId: "admin-b",
  }), "approved");
  assert.equal(nextReviewStatus("approve", {
    highRisk: true,
    firstApprovalBy: "admin-a",
    actorAccountId: "admin-a",
  }), "second-review");
});

test("review policy separates triage from publishing and rejects conflicts", () => {
  assert.equal(canPerformReviewAction("moderator", "request-revision"), true);
  assert.equal(canPerformReviewAction("moderator", "hold"), true);
  assert.equal(canPerformReviewAction("moderator", "approve"), false);
  assert.equal(canPerformReviewAction("admin", "approve"), true);
  assert.equal(canPerformReviewAction("contributor", "assign"), false);

  assert.throws(
    () => assertReviewActionAuthorized({
      role: "admin",
      action: "approve",
      actorProfileId: "same-profile",
      proposerProfileId: "same-profile",
    }),
    /own submission/,
  );
  assert.throws(
    () => assertReviewActionAuthorized({
      role: "admin",
      action: "reject",
      actorProfileId: "reviewer",
      proposerProfileId: "proposer",
      actorPreviouslyRecused: true,
    }),
    /recused/,
  );
});
