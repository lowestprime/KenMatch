import type { AllocationTier, TaskStage } from "@/lib/types";

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

export function formatPercent(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "percent",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export function labelForTier(tier: AllocationTier) {
  switch (tier) {
    case "months":
      return "Months";
    case "weeks":
      return "Weeks";
    case "days":
      return "Days";
    case "queued":
      return "Queued";
    case "blocked":
      return "Blocked";
  }
}

export function labelForStage(stage: TaskStage) {
  switch (stage) {
    case "review":
      return "Review";
    case "voting":
      return "Voting";
    case "scheduled":
      return "Scheduled";
    case "running":
      return "Running";
    case "shipped":
      return "Shipped";
    case "blocked":
      return "Blocked";
  }
}

export function compactWords(input: string, maxLength = 180) {
  if (input.length <= maxLength) {
    return input;
  }

  return `${input.slice(0, maxLength).trimEnd()}...`;
}
