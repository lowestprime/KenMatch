import type { AllocationTier, CompletionMode, TaskStage } from "@/lib/types";

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

export function formatDate(value: string | null | undefined) {
  if (!value) {
    return "TBD";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return "TBD";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function formatHoursToHuman(hours: number) {
  if (hours >= 24 * 14) {
    return `${Math.round(hours / (24 * 7))} weeks`;
  }
  if (hours >= 24) {
    return `${Math.round(hours / 24)} days`;
  }
  return `${Math.round(hours)} hours`;
}

function relativeParts(from: Date, to: Date) {
  const deltaMs = to.getTime() - from.getTime();
  const absoluteMs = Math.abs(deltaMs);
  const minutes = Math.round(absoluteMs / (1000 * 60));
  const hours = Math.round(absoluteMs / (1000 * 60 * 60));
  const days = Math.round(absoluteMs / (1000 * 60 * 60 * 24));

  if (days >= 7) {
    return { value: Math.round(days / 7), unit: "week" };
  }
  if (days >= 1) {
    return { value: days, unit: "day" };
  }
  if (hours >= 1) {
    return { value: hours, unit: "hour" };
  }
  return { value: Math.max(minutes, 1), unit: "minute" };
}

export function describeRelativeTime(value: string | null | undefined, reference = new Date()) {
  if (!value) {
    return "TBD";
  }

  const target = new Date(value);
  const { value: amount, unit } = relativeParts(reference, target);
  const label = `${amount} ${unit}${amount === 1 ? "" : "s"}`;
  return target.getTime() >= reference.getTime() ? `in ${label}` : `${label} ago`;
}

export function describeCountdown(value: string | null | undefined, reference = new Date()) {
  if (!value) {
    return "Launch timing pending";
  }

  const target = new Date(value);
  const { value: amount, unit } = relativeParts(reference, target);
  const label = `${amount} ${unit}${amount === 1 ? "" : "s"}`;
  return target.getTime() >= reference.getTime() ? `Launches in ${label}` : `Launched ${label} ago`;
}

export function describeElapsedSince(value: string | null | undefined, reference = new Date()) {
  if (!value) {
    return "Not started";
  }

  const target = new Date(value);
  const { value: amount, unit } = relativeParts(target, reference);
  return `${amount} ${unit}${amount === 1 ? "" : "s"}`;
}

export function progressPercent(startAt: string | null | undefined, endAt: string | null | undefined, reference = new Date()) {
  if (!startAt || !endAt) {
    return 0;
  }

  const start = new Date(startAt).getTime();
  const end = new Date(endAt).getTime();
  const current = reference.getTime();
  if (end <= start) {
    return 0;
  }

  const percent = ((current - start) / (end - start)) * 100;
  return Math.max(0, Math.min(100, Math.round(percent)));
}

export function remainingHours(endAt: string | null | undefined, reference = new Date()) {
  if (!endAt) {
    return null;
  }

  const delta = new Date(endAt).getTime() - reference.getTime();
  return Math.max(0, Math.round(delta / (1000 * 60 * 60)));
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

export function labelForCompletionMode(mode: CompletionMode) {
  switch (mode) {
    case "planned":
      return "Planned";
    case "running":
      return "In progress";
    case "partial-delivery":
      return "Partial delivery";
    case "completed-early":
      return "Completed early";
    case "completed-at-limit":
      return "Compute limit reached";
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
