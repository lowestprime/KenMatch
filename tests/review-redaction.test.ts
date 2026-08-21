import assert from "node:assert/strict";
import test from "node:test";

import {
  redactCategoryProposalForSubmitter,
  redactKenSubmissionForPublic,
  redactReviewEventForPublic,
} from "../src/lib/review-redaction.ts";
import type {
  CategoryProposalRecord,
  KenSubmissionRecord,
  ReviewEventRecord,
} from "../src/lib/types.ts";

test("submitter review records retain status but redact reviewer identities and private notes", () => {
  const category = {
    id: "proposal-a",
    proposerProfileId: "profile-a",
    proposerName: "Proposer",
    name: "Public health",
    slug: "public-health",
    description: "A bounded category.",
    publicBenefit: "Auditable public benefit.",
    exampleKens: ["One", "Two"],
    reviewStatus: "second-review",
    reviewNote: "One more reviewer is required.",
    internalReviewNote: "Private moderator context.",
    reviewedBy: "account-reviewer-a",
    assigneeAccountId: "account-reviewer-b",
    mergedCategoryId: null,
    intakeResultJson: "{}",
    reviewedAt: "2026-07-27T12:00:00.000Z",
    firstApprovalBy: "account-reviewer-a",
    createdAt: "2026-07-27T11:00:00.000Z",
    updatedAt: "2026-07-27T12:00:00.000Z",
  } satisfies CategoryProposalRecord;

  const redacted = redactCategoryProposalForSubmitter(category);
  assert.equal(redacted.reviewStatus, "second-review");
  assert.equal(redacted.reviewNote, category.reviewNote);
  assert.equal(redacted.internalReviewNote, null);
  assert.equal(redacted.reviewedBy, null);
  assert.equal(redacted.firstApprovalBy, null);
  assert.equal(redacted.assigneeAccountId, "redacted");
});

test("public Ken intake records expose assignment state without account identifiers", () => {
  const submission = {
    id: "submission-a",
    taskId: "task-a",
    taskSlug: "task-a",
    taskTitle: "A bounded Ken",
    taskSummary: "A concise public summary.",
    proposerProfileId: "profile-a",
    proposerName: "Proposer",
    requestedTier: "weeks",
    estimatedTier: "weeks",
    intakeStatus: "approved",
    intakeResultJson: "{}",
    riskFlags: [],
    reviewNote: "Approved after review.",
    internalReviewNote: "Private moderator context.",
    assigneeAccountId: "account-reviewer-a",
    mergedTaskId: null,
    firstApprovalBy: "account-reviewer-b",
    submittedAt: "2026-07-27T11:00:00.000Z",
    assignedAt: "2026-07-27T11:30:00.000Z",
    reviewedAt: "2026-07-27T12:00:00.000Z",
    updatedAt: "2026-07-27T12:00:00.000Z",
  } satisfies KenSubmissionRecord;

  const redacted = redactKenSubmissionForPublic(submission);
  assert.equal(redacted.intakeStatus, "approved");
  assert.equal(redacted.internalReviewNote, null);
  assert.equal(redacted.firstApprovalBy, null);
  assert.equal(redacted.assigneeAccountId, "redacted");
});

test("public review events keep accountable display names but remove internal payloads", () => {
  const event = {
    id: "event-a",
    entityType: "ken-submission",
    entityId: "submission-a",
    action: "approved",
    fromStatus: "second-review",
    toStatus: "approved",
    actorAccountId: "account-reviewer-a",
    actorName: "Reviewer",
    publicNote: "Approved against the published criteria.",
    internalNote: "Private moderator context.",
    metadataJson: JSON.stringify({ assigneeAccountId: "account-reviewer-a" }),
    isPublic: true,
    createdAt: "2026-07-27T12:00:00.000Z",
  } satisfies ReviewEventRecord;

  const redacted = redactReviewEventForPublic(event);
  assert.equal(redacted.actorName, "Reviewer");
  assert.equal(redacted.publicNote, event.publicNote);
  assert.equal(redacted.actorAccountId, null);
  assert.equal(redacted.internalNote, null);
  assert.equal(redacted.metadataJson, null);
});
