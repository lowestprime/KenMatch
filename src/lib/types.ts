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
  voiceCredits: number;
  credibility: number;
  avatarHue: number;
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

export interface VoteRecord {
  id: string;
  taskId: string;
  profileId: string;
  voteCount: number;
  rationale: string;
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

export interface GovernanceEventRecord {
  id: string;
  taskId: string | null;
  house: GovernanceHouse;
  title: string;
  decision: string;
  outcome: string;
  createdAt: string;
}

export interface ProfileSummary extends ProfileRecord {
  spentCredits: number;
  availableCredits: number;
}

export interface TaskSummary extends TaskRecord {
  categoryName: string;
  categorySlug: string;
  proposerName: string;
  totalVotes: number;
  supporterCount: number;
  categoryRank: number | null;
  allocatedTier: AllocationTier;
  userVotes: number;
  userCost: number;
}

export interface TaskDetail extends TaskSummary {
  votes: Array<VoteRecord & { profileName: string }>;
  run: ComputeRunRecord | null;
  checkpoints: CheckpointRecord[];
  governanceEvents: GovernanceEventRecord[];
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
}

export interface MarketplaceFilters {
  query?: string;
  category?: string;
  tier?: AllocationTier | "all";
  stage?: TaskStage | "all";
}