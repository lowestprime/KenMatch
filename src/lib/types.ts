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

<<<<<<< HEAD
export const moderationStatuses = ["active", "restricted", "suspended"] as const;
export type ModerationStatus = (typeof moderationStatuses)[number];

export const attestationLevels = ["provisional", "verified", "expert"] as const;
export type AttestationLevel = (typeof attestationLevels)[number];

=======
>>>>>>> origin/main
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

export interface AccountRecord {
  id: string;
  profileId: string;
  email: string;
  passwordHash: string;
  passwordSalt: string;
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
}

export interface TreasuryEntryRecord {
  id: string;
  streamId: string | null;
  title: string;
  description: string;
  bucket: string;
  direction: TreasuryDirection;
  amountUsd: number;
  createdAt: string;
}

export interface ProfileSummary extends ProfileRecord {
<<<<<<< HEAD
  attestationLevel: AttestationLevel;
  moderationStatus: ModerationStatus;
  createdAt: string;
=======
>>>>>>> origin/main
  voteCreditsSpent: number;
  bondedCredits: number;
  spentCredits: number;
  availableCredits: number;
}

<<<<<<< HEAD
export interface ViewerSession {
  account: Pick<AccountRecord, "id" | "email" | "createdAt">;
  profile: ProfileSummary;
}

=======
>>>>>>> origin/main
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
  treasuryMonthlyUsd: number;
  founderMonthlyUsd: number;
  treasuryBalanceUsd: number;
  monthlyPublicBurnUsd: number;
}

export interface MarketplaceFilters {
  query?: string;
  category?: string;
  tier?: AllocationTier | "all";
  stage?: TaskStage | "all";
}
