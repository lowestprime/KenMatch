import {
  categoryProposalStatuses,
  kenSubmissionStatuses,
  type CategoryProposalStatus,
  type KenSubmissionStatus,
  type SystemRole,
} from "./types.ts";

export const reviewActions = [
  "assign",
  "recuse",
  "request-revision",
  "hold",
  "approve",
  "merge",
  "reject",
  "appeal",
  "resolve-appeal",
] as const;
export type ReviewAction = (typeof reviewActions)[number];

export const categoryReviewStatuses = categoryProposalStatuses;
export type CategoryReviewStatus = CategoryProposalStatus;
export { kenSubmissionStatuses };

const reviewerRoles = new Set<SystemRole>(["moderator", "admin", "owner"]);
const publishingRoles = new Set<SystemRole>(["admin", "owner"]);

export function isReviewerRole(role: SystemRole) {
  return reviewerRoles.has(role);
}

export function isPublishingRole(role: SystemRole) {
  return publishingRoles.has(role);
}

export function canPerformReviewAction(role: SystemRole, action: ReviewAction) {
  if (action === "appeal") return role === "contributor";
  if (!isReviewerRole(role)) return false;
  if (action === "approve" || action === "merge" || action === "reject" || action === "resolve-appeal") {
    return isPublishingRole(role);
  }
  return true;
}

export function assertReviewActionAuthorized(input: {
  role: SystemRole;
  action: ReviewAction;
  actorProfileId: string;
  proposerProfileId: string;
  actorPreviouslyRecused?: boolean;
}) {
  if (!canPerformReviewAction(input.role, input.action)) {
    throw new Error("Your role cannot perform this review action.");
  }
  if (input.actorProfileId === input.proposerProfileId) {
    throw new Error("Reviewers cannot act on their own submission.");
  }
  if (input.actorPreviouslyRecused && input.action !== "assign") {
    throw new Error("A reviewer who recused cannot decide this submission.");
  }
}

export function nextReviewStatus(
  action: ReviewAction,
  options: { highRisk?: boolean; firstApprovalBy?: string | null; actorAccountId?: string } = {},
): CategoryReviewStatus | KenSubmissionStatus {
  switch (action) {
    case "request-revision":
      return "needs-revision";
    case "hold":
      return "held";
    case "merge":
      return "merged";
    case "reject":
      return "rejected";
    case "appeal":
      return "appealed";
    case "resolve-appeal":
      return "pending";
    case "approve":
      if (
        options.highRisk
        && (!options.firstApprovalBy || options.firstApprovalBy === options.actorAccountId)
      ) {
        return "second-review";
      }
      return "approved";
    case "assign":
    case "recuse":
      return "pending";
  }
}

export function decisionNeedsPublicReason(action: ReviewAction) {
  return ["request-revision", "hold", "approve", "merge", "reject", "resolve-appeal"].includes(action);
}

export function isSameFinalDecision(status: string, action: ReviewAction) {
  return (
    (action === "approve" && status === "approved")
    || (action === "merge" && status === "merged")
    || (action === "reject" && status === "rejected")
  );
}

export function reviewStatusLabel(status: CategoryReviewStatus | KenSubmissionStatus) {
  return status.replaceAll("-", " ");
}
