import type {
  CategoryProposalRecord,
  KenSubmissionRecord,
  ReviewEventRecord,
} from "@/lib/types";

const REDACTED_ASSIGNMENT = "redacted";

export function redactCategoryProposalForSubmitter(
  proposal: CategoryProposalRecord,
): CategoryProposalRecord {
  return {
    ...proposal,
    internalReviewNote: null,
    reviewedBy: null,
    assigneeAccountId: proposal.assigneeAccountId ? REDACTED_ASSIGNMENT : null,
    firstApprovalBy: null,
  };
}

export function redactKenSubmissionForPublic(
  submission: KenSubmissionRecord,
): KenSubmissionRecord {
  return {
    ...submission,
    internalReviewNote: null,
    assigneeAccountId: submission.assigneeAccountId ? REDACTED_ASSIGNMENT : null,
    firstApprovalBy: null,
  };
}

export function redactReviewEventForPublic(
  event: ReviewEventRecord,
): ReviewEventRecord {
  return {
    ...event,
    actorAccountId: null,
    internalNote: null,
    metadataJson: null,
  };
}
