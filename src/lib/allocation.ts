import type { AllocationTier, SafetyStatus, TaskStage } from "@/lib/types";

export const MAX_VOTES_PER_TASK = 6;

export function quadraticCost(votes: number): number {
  if (!Number.isInteger(votes) || votes < 0) {
    throw new Error("Votes must be a non-negative integer.");
  }

  return votes * votes;
}

export function incrementalQuadraticCost(currentVotes: number, nextVotes: number): number {
  return quadraticCost(nextVotes) - quadraticCost(currentVotes);
}

export function isEligibleForAllocation(
  totalVotes: number,
  stage: TaskStage,
  safetyStatus: SafetyStatus,
): boolean {
  if (stage === "review" || stage === "blocked") {
    return false;
  }

  if (safetyStatus === "pending" || safetyStatus === "blocked") {
    return false;
  }

  return totalVotes > 0;
}

export function tierForRank(rank: number | null, isEligible: boolean, isBlocked = false): AllocationTier {
  if (isBlocked) {
    return "blocked";
  }

  if (!isEligible || rank === null) {
    return "queued";
  }

  if (rank <= 3) {
    return "months";
  }

  if (rank <= 10) {
    return "weeks";
  }

  if (rank <= 100) {
    return "days";
  }

  return "queued";
}

export interface RankingSeed {
  id: string;
  categoryId: string;
  title: string;
  createdAt: string;
  totalVotes: number;
  stage: TaskStage;
  safetyStatus: SafetyStatus;
}

export interface RankingResult {
  rank: number | null;
  tier: AllocationTier;
}

export function buildCategoryRankings(tasks: RankingSeed[]): Map<string, RankingResult> {
  const ranking = new Map<string, RankingResult>();
  const grouped = new Map<string, RankingSeed[]>();

  for (const task of tasks) {
    const bucket = grouped.get(task.categoryId) ?? [];
    bucket.push(task);
    grouped.set(task.categoryId, bucket);
  }

  for (const bucket of grouped.values()) {
    const eligible = bucket
      .filter((task) => isEligibleForAllocation(task.totalVotes, task.stage, task.safetyStatus))
      .sort((left, right) => {
        if (right.totalVotes !== left.totalVotes) {
          return right.totalVotes - left.totalVotes;
        }

        if (left.createdAt !== right.createdAt) {
          return left.createdAt.localeCompare(right.createdAt);
        }

        return left.title.localeCompare(right.title);
      });

    eligible.forEach((task, index) => {
      const rank = index + 1;
      ranking.set(task.id, { rank, tier: tierForRank(rank, true) });
    });

    bucket
      .filter((task) => !ranking.has(task.id))
      .forEach((task) => {
        ranking.set(task.id, {
          rank: null,
          tier: tierForRank(null, false, task.safetyStatus === "blocked" || task.stage === "blocked"),
        });
      });
  }

  return ranking;
}

export function spentCredits(votes: Array<{ voteCount: number }>): number {
  return votes.reduce((total, vote) => total + quadraticCost(vote.voteCount), 0);
}

export function tierWeight(tier: AllocationTier): number {
  switch (tier) {
    case "months":
      return 3;
    case "weeks":
      return 2;
    case "days":
      return 1;
    case "queued":
      return 0;
    case "blocked":
      return -1;
  }
}