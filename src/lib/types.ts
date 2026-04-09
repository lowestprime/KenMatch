export const requestedTiers = ["days", "weeks", "months"] as const;
export type RequestedTier = (typeof requestedTiers)[number];

export const allocationTiers = ["months", "weeks", "days", "queued", "blocked"] as const;
export type AllocationTier = (typeof allocationTiers)[number];

export const taskStages = ["review", "voting", "scheduled", "running", "shipped", "blocked"] as const;
export type TaskStage = (typeof taskStages)[number];

export const safetyStatuses = ["pending", "approved", "monitor", "blocked"] as const;
export type SafetyStatus = (typeof safetyStatuses)[number];

export const checkpointStatuses = ["queued", "active", "complete", "blocked"] as const;
export type CheckpointStatus = (typeof checkpointStatuses)[number];

export const governanceHouses = ["safety-council", "allocation-chamber"] as const;
export type GovernanceHouse = (typeof governanceHouses)[number];

export const releaseStatuses = ["approved", "pending", "held"] as const;
export type ReleaseStatus = (typeof releaseStatuses)[number];

export const pulseDirections = [-1, 1] as const;
export type PulseDirection = (typeof pulseDirections)[number];

export const revenueEngines = ["enterprise", "data-licensing", "compute-arbitrage", "sponsorship"] as const;
export type RevenueEngine = (typeof revenueEngines)[number];

export const revenueStatuses = ["live", "pilot", "planned"] as const;
export type RevenueStatus = (typeof revenueStatuses)[number];

export const treasuryDirections = ["inflow", "outflow"] as const;
export type TreasuryDirection = (typeof treasuryDirections)[number];

export const fundingStates = ["simulated", "projected", "committed"] as const;
export type FundingState = (typeof fundingStates)[number];

export const restrictionModes = ["unrestricted", "restricted"] as const;
export type RestrictionMode = (typeof restrictionModes)[number];

export const restrictionScopes = ["general", "category", "ken", "safety-reserve"] as const;
export type RestrictionScope = (typeof restrictionScopes)[number];

export const sponsorshipStatuses = ["intake", "checkout", "paid", "released"] as const;
export type SponsorshipStatus = (typeof sponsorshipStatuses)[number];

export const sponsorTypes = ["individual", "nonprofit", "public-agency", "company", "foundation"] as const;
export type SponsorType = (typeof sponsorTypes)[number];

export const licensingConsents = ["audit-only", "allow-screened-licensing"] as const;
export type LicensingConsent = (typeof licensingConsents)[number];

export const moderationStatuses = ["active", "restricted", "suspended"] as const;
export type ModerationStatus = (typeof moderationStatuses)[number];

export const attestationLevels = ["provisional", "verified", "expert"] as const;
export type AttestationLevel = (typeof attestationLevels)[number];

export const attestationStatuses = ["verified", "review", "limited"] as const;
export type AttestationStatus = (typeof attestationStatuses)[number];

export const sybilRiskBands = ["low", "medium", "high"] as const;
export type SybilRiskBand = (typeof sybilRiskBands)[number];

export const participationStates = ["full", "review-limited", "read-only"] as const;
export type ParticipationState = (typeof participationStates)[number];

export const completionModes = ["planned", "running", "partial-delivery", "completed-early", "completed-at-limit", "blocked"] as const;
export type CompletionMode = (typeof completionModes)[number];

export const updateStatuses = ["planned", "on-track", "at-risk", "partial", "shipped"] as const;
export type UpdateStatus = (typeof updateStatuses)[number];

export interface CategoryRecord {
  id: string;
  slug: string;
  name: string;
  description: string;
  thesis: string;
}

export interface ProfileRecord {
  id: string;
  name: string;
  role: string;
  bio: string;
  specialty: string;
  attestation: string;
  attestationLevel?: AttestationLevel;
  moderationStatus?: ModerationStatus;
  voiceCredits: number;
  credibility: number;
  avatarHue: number;
  createdAt?: string;
}

export interface ProfileAttestationRecord {
  profileId: string;
  provider: string;
  status: AttestationStatus;
  sybilRisk: SybilRiskBand;
  reviewedAt: string;
  signals: string[];
  note: string;
}

export interface AccountRecord {
  id: string;
  profileId: string;
  email: string;
  passwordHash: string;
  passwordSalt: string;
  licensingConsent: LicensingConsent;
  createdAt: string;
}

export interface SessionRecord {
  id: string;
  accountId: string;
  tokenHash: string;
  expiresAt: string;
  createdAt: string;
}

export interface TaskRecord {
  id: string;
  slug: string;
  categoryId: string;
  proposerId: string;
  title: string;
  summary: string;
  problem: string;
  whyNow: string;
  publicBenefit: string;
  deliverables: string[];
  evaluationCriteria: string[];
  riskFlags: string[];
  evidence: string[];
  requestedTier: RequestedTier;
  stage: TaskStage;
  safetyStatus: SafetyStatus;
  budgetUsd: number;
  runtimeHours: number;
  backend: string;
  createdAt: string;
}

export interface TaskFinanceRecord {
  taskId: string;
  qualityBondCredits: number;
  sponsorPoolUsd: number;
  checkpointApprovalTarget: number;
  enterprisePackaging: string;
  dataValueNote: string;
  sandboxCapitalUsd: number;
  sandboxApiSpendUsd: number;
  sandboxPilotUsers: number;
  modelLineup: string[];
  simulationSummary: string;
  sampleOutcome: string;
  sponsorAppeal: string;
}

export interface VoteRecord {
  id: string;
  taskId: string;
  profileId: string;
  voteCount: number;
  rationale: string;
  updatedAt: string;
}

export interface TaskPulseVoteRecord {
  id: string;
  taskId: string;
  profileId: string;
  value: PulseDirection;
  updatedAt: string;
}

export interface CommentRecord {
  id: string;
  taskId: string;
  profileId: string;
  parentId: string | null;
  body: string;
  stakeCredits: number;
  createdAt: string;
}

export interface CommentVoteRecord {
  id: string;
  commentId: string;
  profileId: string;
  value: PulseDirection;
  updatedAt: string;
}

export interface ComputeRunRecord {
  id: string;
  taskId: string;
  status: "scheduled" | "running" | "complete";
  backend: string;
  budgetUsd: number;
  runtimeHours: number;
  checkpointCadenceHours: number;
  reproducibilityNotes: string;
  rollbackPlan: string;
}

export interface TaskTimingRecord {
  taskId: string;
  launchAt: string | null;
  startedAt: string | null;
  expectedMaxEndAt: string | null;
  computeHoursUsed: number;
  completionMode: CompletionMode;
  completionSummary: string;
  updatedAt: string;
}

export interface RunUpdateRecord {
  id: string;
  taskId: string;
  label: string;
  status: UpdateStatus;
  summary: string;
  artifact: string;
  evidenceNote: string;
  createdAt: string;
}

export interface CheckpointRecord {
  id: string;
  taskId: string;
  label: string;
  status: CheckpointStatus;
  detail: string;
  dueAt: string;
}

export interface CheckpointGateRecord {
  checkpointId: string;
  approvalScore: number;
  requiredApprovals: number;
  releaseStatus: ReleaseStatus;
}

export interface GovernanceEventRecord {
  id: string;
  taskId: string | null;
  house: GovernanceHouse;
  title: string;
  decision: string;
  outcome: string;
  createdAt: string;
}

export interface RevenueStreamRecord {
  id: string;
  slug: string;
  name: string;
  engine: RevenueEngine;
  description: string;
  pricingModel: string;
  status: RevenueStatus;
  monthlyRevenueUsd: number;
  grossMargin: number;
  treasurySharePercent: number;
  founderSharePercent: number;
  publicBenefitCovenant: string;
  openDeliverableBoundary: string;
  contributorDividendPercent: number;
  requiresContributorConsent: boolean;
}

export interface TreasuryEntryRecord {
  id: string;
  streamId: string | null;
  title: string;
  description: string;
  bucket: string;
  direction: TreasuryDirection;
  amountUsd: number;
  fundingState: FundingState;
  restrictionMode: RestrictionMode;
  restrictionScope: RestrictionScope;
  restrictionTargetId: string | null;
  restrictionTargetLabel: string | null;
  createdAt: string;
}

export interface SponsorshipCommitmentRecord {
  id: string;
  sponsorName: string;
  sponsorType: SponsorType;
  sponsorContact: string;
  note: string;
  amountUsd: number;
  fundingState: FundingState;
  status: SponsorshipStatus;
  restrictionScope: RestrictionScope;
  restrictionTargetId: string | null;
  restrictionTargetLabel: string | null;
  checkoutSessionId: string | null;
  createdAt: string;
  updatedAt: string;
  paidAt: string | null;
}

export interface ProfileSummary extends ProfileRecord {
  attestationLevel: AttestationLevel;
  moderationStatus: ModerationStatus;
  createdAt: string;
  attestationProvider: string;
  attestationStatus: AttestationStatus;
  sybilRisk: SybilRiskBand;
  attestationSignals: string[];
  attestationReviewedAt: string;
  attestationNote: string;
  participationState: ParticipationState;
  participationNote: string;
  voiceMultiplier: number;
  effectiveVoiceCredits: number;
  canSubmit: boolean;
  canComment: boolean;
  canPulse: boolean;
  canAllocateVoice: boolean;
  voteCreditsSpent: number;
  bondedCredits: number;
  spentCredits: number;
  availableCredits: number;
}

export interface ViewerSession {
  account: Pick<AccountRecord, "id" | "email" | "createdAt">;
  profile: ProfileSummary;
}

export interface TaskSummary extends TaskRecord, TaskFinanceRecord {
  categoryName: string;
  categorySlug: string;
  proposerName: string;
  totalVotes: number;
  supporterCount: number;
  categoryRank: number | null;
  allocatedTier: AllocationTier;
  userVotes: number;
  userCost: number;
  taskPulseScore: number;
  taskPulseVotes: number;
  positivePulseCount: number;
  negativePulseCount: number;
  userTaskPulse: number;
  discussionCount: number;
  bondStatus: "secure" | "watch";
  launchAt: string | null;
  startedAt: string | null;
  expectedMaxEndAt: string | null;
  computeHoursUsed: number;
  completionMode: CompletionMode;
  completionSummary: string;
  lastActivityAt: string;
  updateCount: number;
  latestUpdateLabel: string | null;
}

export interface CheckpointDetail extends CheckpointRecord, CheckpointGateRecord {}

export interface DiscussionComment extends CommentRecord {
  profileName: string;
  profileRole: string;
  score: number;
  upvotes: number;
  downvotes: number;
  userVote: number;
  replies: DiscussionComment[];
}

export interface TaskDetail extends TaskSummary {
  votes: Array<VoteRecord & { profileName: string }>;
  run: ComputeRunRecord | null;
  checkpoints: CheckpointDetail[];
  governanceEvents: GovernanceEventRecord[];
  comments: DiscussionComment[];
  runUpdates: RunUpdateRecord[];
}

export interface CategorySummary extends CategoryRecord {
  proposalCount: number;
  eligibleCount: number;
  runningCount: number;
  shippedCount: number;
}

export interface HomepageMetrics {
  proposals: number;
  eligible: number;
  activeRuns: number;
  shipped: number;
  voiceIssued: number;
  voiceSpent: number;
  bondedVoice: number;
  publicSignal: number;
  treasuryMonthlyUsd: number;
}

export interface RevenueStreamSummary extends RevenueStreamRecord {
  treasuryMonthlyUsd: number;
  founderMonthlyUsd: number;
}

export interface EconomicsSummary {
  monthlyRevenueUsd: number;
  committedRevenueUsd: number;
  treasuryMonthlyUsd: number;
  committedTreasuryMonthlyUsd: number;
  founderMonthlyUsd: number;
  treasuryBalanceUsd: number;
  monthlyPublicBurnUsd: number;
  coverageMonths: number;
  coverageTargetMonths: number;
  coverageGapMonths: number;
  coverageStatus: "critical" | "watch" | "healthy";
  restrictedFundingUsd: number;
  committedRestrictedFundingUsd: number;
  projectedRestrictedFundingUsd: number;
  simulatedFundingUsd: number;
  sponsorPoolsUsd: number;
  sponsorCommitmentsUsd: number;
  safetyReserveUsd: number;
  verifiedFundingStreams: number;
}

export interface MarketplaceFilters {
  query?: string;
  category?: string;
  tier?: AllocationTier | "all";
  stage?: TaskStage | "all";
}
