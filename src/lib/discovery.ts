import {
  allocationTiers,
  sortOptions,
  taskStages,
  type AllocationTier,
  type DiscoveryReason,
  type MarketplaceFilters,
  type SortOption,
  type TaskStage,
} from "./types.ts";

export const DEFAULT_MARKETPLACE_SORT: SortOption = "active";
export const DEFAULT_MARKETPLACE_PAGE_SIZE = 20;
export const MAX_MARKETPLACE_PAGE_SIZE = 50;

export interface MarketplaceQueryState {
  query: string;
  category: string;
  tier: AllocationTier | "all";
  stage: TaskStage | "all";
  sort: SortOption;
  page: number;
}

export function normalizeMarketplaceQuery(filters: MarketplaceFilters): MarketplaceQueryState {
  const tier = filters.tier && allocationTiers.includes(filters.tier as AllocationTier) ? filters.tier : "all";
  const stage = filters.stage && taskStages.includes(filters.stage as TaskStage) ? filters.stage : "all";
  const sort = filters.sort && sortOptions.includes(filters.sort) ? filters.sort : DEFAULT_MARKETPLACE_SORT;

  return {
    query: filters.query?.trim() ?? "",
    category: filters.category?.trim() || "all",
    tier,
    stage,
    sort,
    page: normalizeMarketplacePage(filters.page),
  };
}

export function normalizeMarketplacePage(value: number | string | undefined): number {
  const parsed = typeof value === "number" ? value : Number.parseInt(value ?? "", 10);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : 1;
}

export function normalizeMarketplacePageSize(value: number | undefined): number {
  if (!Number.isSafeInteger(value) || !value || value < 1) {
    return DEFAULT_MARKETPLACE_PAGE_SIZE;
  }
  return Math.min(value, MAX_MARKETPLACE_PAGE_SIZE);
}

export function hasActiveMarketplaceFilters(filters: MarketplaceFilters): boolean {
  const normalized = normalizeMarketplaceQuery(filters);
  return Boolean(
    normalized.query
      || normalized.category !== "all"
      || normalized.tier !== "all"
      || normalized.stage !== "all"
      || normalized.sort !== DEFAULT_MARKETPLACE_SORT
      || normalized.page !== 1
  );
}

export function buildMarketplaceHref(pathname: string, filters: MarketplaceFilters): string {
  const normalized = normalizeMarketplaceQuery(filters);
  const params = new URLSearchParams();

  if (normalized.query) params.set("q", normalized.query);
  if (normalized.category !== "all") params.set("category", normalized.category);
  if (normalized.tier !== "all") params.set("tier", normalized.tier);
  if (normalized.stage !== "all") params.set("stage", normalized.stage);
  if (normalized.sort !== DEFAULT_MARKETPLACE_SORT) params.set("sort", normalized.sort);
  if (normalized.page > 1) params.set("page", String(normalized.page));

  return params.size > 0 ? `${pathname}?${params.toString()}` : pathname;
}

export interface DiscoveryCandidate {
  id: string;
  proposerId: string;
  categoryId: string;
  createdAt: string;
  lastActivityAt: string;
  stage: TaskStage;
  safetyStatus: "pending" | "approved" | "monitor" | "blocked";
  totalVotes: number;
  supporterCount: number;
  taskPulseScore: number;
  taskPulseVotes: number;
  positivePulseCount: number;
  negativePulseCount: number;
  trustedPulseScore: number;
  completedCheckpointCount: number;
  updateCount: number;
  categoryRank: number | null;
}

const stageWeight: Record<TaskStage, number> = {
  running: 5,
  scheduled: 4,
  voting: 3,
  shipped: 2,
  review: 1,
  blocked: 0,
};

export function discoveryBand(candidate: DiscoveryCandidate, now = Date.now()): number {
  if (candidate.stage === "blocked" || candidate.safetyStatus === "blocked") {
    return 5;
  }
  if (candidate.stage === "review" || candidate.safetyStatus === "pending") {
    return 4;
  }
  if (candidate.completedCheckpointCount > 0 || candidate.updateCount > 0) {
    return 0;
  }
  if (isNewAndUnderReviewed(candidate, now)) {
    return 1;
  }
  if (candidate.categoryRank === 1) {
    return 2;
  }
  return 3;
}

function isNewAndUnderReviewed(candidate: DiscoveryCandidate, now: number): boolean {
  const ageMs = Math.max(0, now - Date.parse(candidate.createdAt));
  return ageMs <= 30 * 24 * 60 * 60 * 1_000 && candidate.supporterCount <= 2;
}

function compareBase(left: DiscoveryCandidate, right: DiscoveryCandidate, now: number): number {
  const bandDelta = discoveryBand(left, now) - discoveryBand(right, now);
  if (bandDelta !== 0) return bandDelta;

  const stageDelta = stageWeight[right.stage] - stageWeight[left.stage];
  if (stageDelta !== 0) return stageDelta;

  if (right.completedCheckpointCount !== left.completedCheckpointCount) {
    return right.completedCheckpointCount - left.completedCheckpointCount;
  }
  if (right.totalVotes !== left.totalVotes) return right.totalVotes - left.totalVotes;
  if (right.supporterCount !== left.supporterCount) return right.supporterCount - left.supporterCount;
  if (right.trustedPulseScore !== left.trustedPulseScore) return right.trustedPulseScore - left.trustedPulseScore;
  if (right.positivePulseCount !== left.positivePulseCount) return right.positivePulseCount - left.positivePulseCount;
  if (right.lastActivityAt !== left.lastActivityAt) return right.lastActivityAt.localeCompare(left.lastActivityAt);
  return left.id.localeCompare(right.id);
}

export function rankDiscoveryCandidates<T extends DiscoveryCandidate>(candidates: readonly T[], now = Date.now()): T[] {
  const base = [...candidates].sort((left, right) => compareBase(left, right, now));
  const proposerSlots = new Map<string, number>();
  const categorySlots = new Map<string, number>();
  const bandSlots = new Map<number, number>();

  const decorated = base.map((candidate, baseIndex) => {
    const band = discoveryBand(candidate, now);
    const proposerSlot = (proposerSlots.get(candidate.proposerId) ?? 0) + 1;
    const categorySlot = (categorySlots.get(candidate.categoryId) ?? 0) + 1;
    const bandSlot = (bandSlots.get(band) ?? 0) + 1;
    proposerSlots.set(candidate.proposerId, proposerSlot);
    categorySlots.set(candidate.categoryId, categorySlot);
    bandSlots.set(band, bandSlot);
    return { candidate, band, proposerSlot, categorySlot, bandSlot, baseIndex };
  });

  decorated.sort((left, right) => {
    const leftInactive = left.band >= 4 ? 1 : 0;
    const rightInactive = right.band >= 4 ? 1 : 0;
    if (leftInactive !== rightInactive) return leftInactive - rightInactive;

    if (!leftInactive && left.proposerSlot !== right.proposerSlot) {
      return left.proposerSlot - right.proposerSlot;
    }
    if (!leftInactive && Math.min(left.categorySlot, 3) !== Math.min(right.categorySlot, 3)) {
      return Math.min(left.categorySlot, 3) - Math.min(right.categorySlot, 3);
    }
    if (!leftInactive && left.bandSlot !== right.bandSlot) return left.bandSlot - right.bandSlot;
    if (left.band !== right.band) return left.band - right.band;
    if (left.categorySlot !== right.categorySlot) return left.categorySlot - right.categorySlot;
    return left.baseIndex - right.baseIndex;
  });

  return decorated.map(({ candidate }) => candidate);
}

export function getDiscoveryReasons(candidate: DiscoveryCandidate, now = Date.now()): DiscoveryReason[] {
  if (candidate.stage === "blocked" || candidate.safetyStatus === "blocked") {
    return ["blocked"];
  }

  const reasons: DiscoveryReason[] = [];
  if (candidate.stage === "review" || candidate.safetyStatus === "pending") reasons.push("under-review");
  if (candidate.completedCheckpointCount > 0 || candidate.updateCount > 0) reasons.push("checkpoint-momentum");
  if (isNewAndUnderReviewed(candidate, now)) reasons.push("new-under-reviewed");
  if (candidate.categoryRank === 1) reasons.push("category-leader");
  if (candidate.totalVotes >= 10) reasons.push("high-voice");
  if (candidate.positivePulseCount >= 3 && candidate.positivePulseCount >= Math.max(1, candidate.negativePulseCount * 2)) {
    reasons.push("broad-pulse");
  }
  if (candidate.stage === "running" || candidate.stage === "scheduled") reasons.push("active-run");
  return reasons.slice(0, 3);
}

export const discoveryReasonLabels: Record<DiscoveryReason, string> = {
  "checkpoint-momentum": "Checkpoint momentum",
  "new-under-reviewed": "New and under-reviewed",
  "category-leader": "Category leader",
  "high-voice": "High voice",
  "broad-pulse": "Broad pulse",
  "active-run": "Active run",
  "under-review": "Under review",
  blocked: "Blocked / safety hold",
};

export function sortMarketplaceCandidates<T extends DiscoveryCandidate>(
  candidates: readonly T[],
  sort: SortOption,
  now = Date.now(),
): T[] {
  if (sort === "active") return rankDiscoveryCandidates(candidates, now);

  return [...candidates].sort((left, right) => {
    if (sort === "pulse") {
      if (right.trustedPulseScore !== left.trustedPulseScore) return right.trustedPulseScore - left.trustedPulseScore;
      if (right.positivePulseCount !== left.positivePulseCount) return right.positivePulseCount - left.positivePulseCount;
      if (right.taskPulseScore !== left.taskPulseScore) return right.taskPulseScore - left.taskPulseScore;
      if (right.taskPulseVotes !== left.taskPulseVotes) return right.taskPulseVotes - left.taskPulseVotes;
    } else if (sort === "voice") {
      if (right.totalVotes !== left.totalVotes) return right.totalVotes - left.totalVotes;
      if (right.supporterCount !== left.supporterCount) return right.supporterCount - left.supporterCount;
    } else if (sort === "recent" && right.lastActivityAt !== left.lastActivityAt) {
      return right.lastActivityAt.localeCompare(left.lastActivityAt);
    } else if (sort === "newest" && right.createdAt !== left.createdAt) {
      return right.createdAt.localeCompare(left.createdAt);
    }

    if (right.lastActivityAt !== left.lastActivityAt) return right.lastActivityAt.localeCompare(left.lastActivityAt);
    return left.id.localeCompare(right.id);
  });
}
