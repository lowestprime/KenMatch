import type {
  CapacityOverrideState,
  CapacityPolicy,
  CapacityState,
  CapacityStateResolution,
  CompletionMode,
  RunDecisionCode,
  RunDecisionEventType,
  TaskStage,
} from "@/lib/types";

const STATE_SEVERITY: Record<CapacityState, number> = {
  normal: 0,
  constrained: 1,
  "new-launches-paused": 2,
  "critical-maintenance-only": 3,
};

export const DEFAULT_CAPACITY_OVERRIDE: CapacityOverrideState = {
  mode: "automatic",
  manualState: null,
  publicReason: "",
  updatedAt: new Date(0).toISOString(),
  updatedBy: null,
};

export const CAPACITY_POLICIES: Record<CapacityState, CapacityPolicy> = {
  normal: {
    state: "normal",
    label: "Normal capacity",
    summary: "Committed unrestricted coverage meets the public treasury target.",
    newLaunches: "Approved runs may launch within their published lane, budget, and safety gates.",
    existingRuns: "Active runs continue through their published checkpoints and compute caps.",
    protectedWork: "Safety review, rollback readiness, moderation, and public records remain funded.",
    restrictions: "No capacity restriction beyond ordinary rank, safety, review, and budget rules.",
    recovery: "Automatic while usable committed coverage remains at or above the treasury target.",
  },
  constrained: {
    state: "constrained",
    label: "Constrained capacity",
    summary: "Usable committed coverage is below target but can support bounded continuation.",
    newLaunches: "Only already-budgeted days or weeks lane runs may launch; new months lane launches wait.",
    existingRuns: "Active runs may continue to the next approved checkpoint within their existing caps.",
    protectedWork: "Safety review, maintenance, rollback, and public audit records retain priority.",
    restrictions: "Operators reduce concurrency and cannot use projected, simulated, or mismatched restricted funding as runway.",
    recovery: "Returns to normal automatically when usable committed coverage reaches the target and no manual restriction remains.",
  },
  "new-launches-paused": {
    state: "new-launches-paused",
    label: "New launches paused",
    summary: "Coverage is too low to start additional runs without risking current obligations.",
    newLaunches: "No new compute runs launch, regardless of rank or sponsor interest.",
    existingRuns: "Active runs move to the next safe checkpoint, then pause unless safety review requires an earlier stop.",
    protectedWork: "Safety response, evidence preservation, rollback, moderation, and public status updates continue.",
    restrictions: "Ranks and queue positions remain visible and unchanged; funding never purchases an exception.",
    recovery: "Reopens in constrained mode when usable committed coverage reaches at least half of target and any manual restriction is cleared.",
  },
  "critical-maintenance-only": {
    state: "critical-maintenance-only",
    label: "Critical maintenance only",
    summary: "Usable committed coverage is below one month of estimated public burn.",
    newLaunches: "All new compute launches are stopped.",
    existingRuns: "Active runs pause at the earliest safe point; only rollback or evidence-preservation work proceeds.",
    protectedWork: "Safety incidents, security, essential maintenance, rollback, and immutable public records are protected.",
    restrictions: "No discretionary compute or sponsor exception is allowed. Public pages, ranks, histories, and reasons stay available.",
    recovery: "Moves to new-launches-paused automatically after at least one month of usable coverage is restored and any manual restriction is cleared.",
  },
};

export const RUN_DECISION_DEFINITIONS: Record<
  RunDecisionCode,
  { eventType: RunDecisionEventType; label: string; description: string }
> = {
  "checkpoint-approved": {
    eventType: "checkpoint",
    label: "Checkpoint approved",
    description: "The named gate met its published acceptance threshold.",
  },
  "checkpoint-held": {
    eventType: "checkpoint",
    label: "Checkpoint held",
    description: "The run is paused at the named gate pending evidence or review.",
  },
  "checkpoint-revision-required": {
    eventType: "checkpoint",
    label: "Checkpoint revision required",
    description: "The gate did not pass and a bounded correction is required before continuation.",
  },
  "correction-issued": {
    eventType: "correction",
    label: "Correction issued",
    description: "A public artifact, claim, or trace requires a recorded correction.",
  },
  "correction-accepted": {
    eventType: "correction",
    label: "Correction accepted",
    description: "Reviewers accepted the correction and its supporting evidence.",
  },
  "safety-escalation": {
    eventType: "stop",
    label: "Stopped for safety escalation",
    description: "A safety boundary requires immediate pause or closure.",
  },
  "failed-acceptance": {
    eventType: "stop",
    label: "Stopped after failed acceptance",
    description: "Published acceptance criteria were not met.",
  },
  "provenance-failure": {
    eventType: "stop",
    label: "Stopped for provenance failure",
    description: "Required sources, traceability, or artifact provenance could not be verified.",
  },
  "budget-runtime-cap": {
    eventType: "stop",
    label: "Stopped at budget or runtime cap",
    description: "The approved budget or runtime ceiling was reached.",
  },
  "repeated-provider-tool-failure": {
    eventType: "stop",
    label: "Stopped after repeated provider or tool failure",
    description: "Repeated infrastructure failures made safe continuation impractical.",
  },
  "duplication-supersession": {
    eventType: "stop",
    label: "Stopped as duplicated or superseded",
    description: "Another public artifact or Ken now covers the bounded need.",
  },
  "scope-invalidation": {
    eventType: "stop",
    label: "Stopped after scope invalidation",
    description: "New evidence invalidated the problem framing or deliverable scope.",
  },
  "reviewer-redirect": {
    eventType: "stop",
    label: "Redirected by reviewers",
    description: "Reviewers returned the work to a revised, safer, or better-bounded run plan.",
  },
  "successful-early-completion": {
    eventType: "stop",
    label: "Completed successfully before the cap",
    description: "All required deliverables and release gates passed before maximum runtime.",
  },
  "owner-emergency": {
    eventType: "stop",
    label: "Stopped for owner emergency",
    description: "An emergency operational action was taken with a public reason and audit record.",
  },
  "release-approved": {
    eventType: "release",
    label: "Release approved",
    description: "Reviewers approved the named deliverables for public release.",
  },
  "release-partial": {
    eventType: "release",
    label: "Partial release approved",
    description: "Useful bounded artifacts passed review while remaining scope stayed incomplete.",
  },
  "release-rejected": {
    eventType: "release",
    label: "Release rejected",
    description: "The final artifact did not satisfy release requirements.",
  },
  "release-rolled-back": {
    eventType: "release",
    label: "Release rolled back",
    description: "A previously released artifact was withdrawn while its reason and evidence remained visible.",
  },
};

export const OBJECTIVE_SUBJECTIVE_DECISIONS = [
  { decision: "Schema and required-field validation", mode: "programmatic", accountability: "Versioned validation rules and explicit errors." },
  { decision: "Credit arithmetic and quadratic cost", mode: "programmatic", accountability: "Deterministic calculations with tests." },
  { decision: "Category-local lane rank and tie breaks", mode: "programmatic", accountability: "Published ordering rules and stable IDs." },
  { decision: "Eligibility, rate limits, budget and runtime caps", mode: "programmatic", accountability: "Explicit thresholds and server enforcement." },
  { decision: "Missing evidence, collision, and risk warnings", mode: "automated-advisory", accountability: "Warnings are visible but do not impersonate reviewer judgment." },
  { decision: "Public benefit and category fit", mode: "human-review", accountability: "Named reviewer, public reason, recusal, and appeal." },
  { decision: "Safety and validity boundary", mode: "human-review", accountability: "Reason-coded decision with stronger review for high impact." },
  { decision: "Checkpoint and output quality", mode: "human-review", accountability: "Acceptance evidence, decision, corrections, and artifact trace." },
  { decision: "Sponsor fit and restriction compatibility", mode: "human-review", accountability: "Visible restriction scope; money cannot affect rank." },
  { decision: "Final or partial release", mode: "human-review", accountability: "Explicit release event, actor, reason, and rollback status." },
] as const;

export function deriveAutomaticCapacityState(
  coverageMonths: number,
  coverageTargetMonths: number,
  monthlyPublicBurnUsd: number,
): CapacityState {
  if (monthlyPublicBurnUsd <= 0) return "normal";
  if (coverageMonths >= Math.max(coverageTargetMonths, 1)) return "normal";
  if (coverageMonths >= Math.max(coverageTargetMonths / 2, 1)) return "constrained";
  if (coverageMonths >= 1) return "new-launches-paused";
  return "critical-maintenance-only";
}

export function resolveCapacityState(
  automaticState: CapacityState,
  override: CapacityOverrideState = DEFAULT_CAPACITY_OVERRIDE,
): CapacityStateResolution {
  const manualState = override.mode === "manual" ? override.manualState : null;
  const manualIsMoreRestrictive = manualState !== null && STATE_SEVERITY[manualState] > STATE_SEVERITY[automaticState];
  const state = manualIsMoreRestrictive ? manualState : automaticState;
  return {
    state,
    automaticState,
    source: manualIsMoreRestrictive ? "manual-restrictive-override" : "automatic",
    publicReason: manualIsMoreRestrictive
      ? override.publicReason
      : CAPACITY_POLICIES[automaticState].summary,
    policy: CAPACITY_POLICIES[state],
    override,
  };
}

export function isRunDecisionCompatible(eventType: RunDecisionEventType, decisionCode: RunDecisionCode) {
  return RUN_DECISION_DEFINITIONS[decisionCode].eventType === eventType;
}

export function runDecisionTransition(
  decisionCode: RunDecisionCode,
): { stage: TaskStage; completionMode: CompletionMode } | null {
  switch (decisionCode) {
    case "successful-early-completion":
    case "release-approved":
      return { stage: "shipped", completionMode: "completed-early" };
    case "release-partial":
      return { stage: "shipped", completionMode: "partial-delivery" };
    case "reviewer-redirect":
      return { stage: "scheduled", completionMode: "planned" };
    case "safety-escalation":
    case "failed-acceptance":
    case "provenance-failure":
    case "budget-runtime-cap":
    case "repeated-provider-tool-failure":
    case "duplication-supersession":
    case "scope-invalidation":
    case "owner-emergency":
    case "release-rejected":
    case "release-rolled-back":
      return { stage: "blocked", completionMode: "blocked" };
    default:
      return null;
  }
}
