import type { RequestedTier, TaskStage } from "@/lib/types";

export const INITIAL_ALLOCATION_CREDITS = 3;
export const MONTHLY_REPLENISHMENT_CREDITS = 3;

export const TOKEN_ASSIGNMENT_RULES = [
  {
    id: "new-account-baseline",
    label: "New verified account",
    credits: INITIAL_ALLOCATION_CREDITS,
    cadence: "once",
    criteria: "Email-verified accounts receive an initial voice budget so every participant can rank Kens before earning reputation.",
  },
  {
    id: "monthly-replenishment",
    label: "Monthly participation refresh",
    credits: MONTHLY_REPLENISHMENT_CREDITS,
    cadence: "monthly",
    criteria: "Active accounts regain a small allocation budget each month to keep the board current without rewarding spam.",
  },
  {
    id: "approved-verification",
    label: "Approved verification",
    credits: 3,
    cadence: "reviewed award",
    criteria: "Verification can increase contribution capacity when the reviewer can inspect identity, expertise, or relevant track record evidence.",
  },
  {
    id: "accepted-ken",
    label: "Accepted Ken proposal",
    credits: 2,
    cadence: "per accepted proposal",
    criteria: "Proposers earn voice when a submitted Ken clears public review, has concrete deliverables, and is ready to enter voting.",
  },
  {
    id: "checkpoint-contribution",
    label: "Useful checkpoint contribution",
    credits: 1,
    cadence: "per approved checkpoint",
    criteria: "Reviewers, maintainers, and contributors can earn voice for materially improving evidence, tests, reproducibility, review, or delivery quality.",
  },
] as const;

export const SUBMISSION_APPROVAL_CRITERIA = [
  "The Ken states a concrete public output rather than an open-ended private chat request.",
  "The evidence anchors, assumptions, and uncertainty are inspectable before launch.",
  "The proposer names deliverables, checkpoint gates, and acceptance checks that other people can verify.",
  "The risk section identifies operating constraints early enough to stop or redirect the run.",
  "The requested lane matches the likely scope: Days for focused outputs, Weeks for multi-step work, Months for long-horizon synthesis or tooling.",
  "Funding, if attached, is disclosed as compute/review support and never as rank, vote, or checkpoint override.",
] as const;

export const KEN_LIFECYCLE_STAGES: Array<{
  id: TaskStage | "draft" | "checkpoint-review" | "audit";
  label: string;
  summary: string;
  publicGate: string;
}> = [
  {
    id: "draft",
    label: "1 · Draft",
    summary: "The proposer turns an idea into a bounded Ken with evidence, deliverables, risks, and a requested run lane.",
    publicGate: "The form must be specific enough for public review before it should spend community attention.",
  },
  {
    id: "review",
    label: "2 · Intake review",
    summary: "Moderators and the public check category fit, operating boundaries, evidence quality, and whether the work is inspectable.",
    publicGate: "Vague or non-public-benefit requests remain blocked or are returned for revision.",
  },
  {
    id: "voting",
    label: "3 · Public signal",
    summary: "Readers add pulse feedback and scarce allocation voice. Quadratic cost makes concentrated influence progressively more expensive.",
    publicGate: "Broad support and written rationale matter more than one account pushing a favorite.",
  },
  {
    id: "scheduled",
    label: "4 · Board approval",
    summary: "Eligible Kens are ranked within their category into Months, Weeks, or Days lanes and receive a run plan with checkpoint cadence.",
    publicGate: "Rank, budget, and checkpoint requirements must be visible before work begins.",
  },
  {
    id: "running",
    label: "5 · Monitored run",
    summary: "The run publishes progress updates, artifacts, decision logs, and checkpoint evidence instead of disappearing into a private session.",
    publicGate: "Checkpoint gates can continue, redirect, pause, or hold release depending on public evidence.",
  },
  {
    id: "checkpoint-review",
    label: "6 · Checkpoint review",
    summary: "Maintainers and reviewers inspect output quality, reproducibility, provenance, changes in risk, and whether the Ken still matches its public promise.",
    publicGate: "Failed checkpoints require revision, partial release, or blocking rather than silent completion.",
  },
  {
    id: "shipped",
    label: "7 · Public delivery",
    summary: "Approved outputs ship with the evidence trail, limitations, review history, and any sponsor or contributor context attached.",
    publicGate: "The final artifact must remain auditable and cite the checkpoint path that justified release.",
  },
  {
    id: "audit",
    label: "8 · Post-run audit",
    summary: "The board records what worked, what failed, what should be reused, and which contributors earned credit for useful improvements.",
    publicGate: "Contributor awards and future replenishment decisions should point back to visible work.",
  },
];

export const LANE_OPERATING_POLICIES: Record<RequestedTier, { label: string; bondCredits: number; checkpointCadence: string; approvalTarget: string; bestFor: string }> = {
  days: {
    label: "Days",
    bondCredits: 1,
    checkpointCadence: "daily or final acceptance check",
    approvalTarget: "clear deliverable, narrow risk, and at least one public acceptance check",
    bestFor: "focused analyses, reproductions, test harnesses, small tools, or evidence briefs",
  },
  weeks: {
    label: "Weeks",
    bondCredits: 2,
    checkpointCadence: "weekly visible progress updates",
    approvalTarget: "multi-step plan, named reviewers, and mid-run redirect criteria",
    bestFor: "research sprints, software builds, benchmark work, and design systems",
  },
  months: {
    label: "Months",
    bondCredits: 5,
    checkpointCadence: "recurring milestone reviews with release gates",
    approvalTarget: "high public value, durable evidence trail, and stronger governance oversight",
    bestFor: "long-horizon synthesis, mechanism discovery, evaluation programs, and reusable infrastructure",
  },
};

export function allocationCreditCost(votes: number) {
  return votes * votes;
}

export function explainCreditGrant(ruleId: string) {
  return TOKEN_ASSIGNMENT_RULES.find((rule) => rule.id === ruleId) ?? null;
}
