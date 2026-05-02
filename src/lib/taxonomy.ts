import type { AllocationTier, TaskStage } from "@/lib/types";

export interface CategoryVisual {
  slug: string;
  primary: string;
  secondary: string;
  tertiary: string;
  background: string;
  motif: "helix" | "tool" | "graph" | "system" | "shield" | "spark" | "prism";
}

export interface LaneVisual {
  tier: AllocationTier;
  label: string;
  description: string;
  primary: string;
  secondary: string;
}

const CATEGORY_VISUALS: Record<string, Omit<CategoryVisual, "slug">> = {
  "science-health": {
    primary: "#2563eb",
    secondary: "#b08d1a",
    tertiary: "#991b1b",
    background: "#03040a",
    motif: "helix",
  },
  "open-tools": {
    primary: "#1d4ed8",
    secondary: "#6d28d9",
    tertiary: "#b08d1a",
    background: "#02040c",
    motif: "tool",
  },
  "research-synthesis": {
    primary: "#6d28d9",
    secondary: "#b08d1a",
    tertiary: "#1d4ed8",
    background: "#05020c",
    motif: "graph",
  },
  "engineering-systems": {
    primary: "#1d4ed8",
    secondary: "#991b1b",
    tertiary: "#6d28d9",
    background: "#02050d",
    motif: "system",
  },
  "safety-evaluation": {
    primary: "#991b1b",
    secondary: "#6d28d9",
    tertiary: "#b08d1a",
    background: "#0c0205",
    motif: "shield",
  },
  "frontier-creative": {
    primary: "#6d28d9",
    secondary: "#991b1b",
    tertiary: "#1d4ed8",
    background: "#09020e",
    motif: "spark",
  },
};

const fallbackPalette = [
  { primary: "#1d4ed8", secondary: "#6d28d9", tertiary: "#b08d1a", background: "#02040c", motif: "prism" as const },
  { primary: "#6d28d9", secondary: "#b08d1a", tertiary: "#991b1b", background: "#07020d", motif: "graph" as const },
  { primary: "#b08d1a", secondary: "#1d4ed8", tertiary: "#6d28d9", background: "#080602", motif: "spark" as const },
  { primary: "#991b1b", secondary: "#6d28d9", tertiary: "#b08d1a", background: "#0c0205", motif: "shield" as const },
];

export const laneVisuals: Record<AllocationTier, LaneVisual> = {
  months: {
    tier: "months",
    label: "Months",
    description: "Top long-horizon Kens per category.",
    primary: "#b08d1a",
    secondary: "#1d4ed8",
  },
  weeks: {
    tier: "weeks",
    label: "Weeks",
    description: "Multi-step runs with mid-run checkpoints.",
    primary: "#6d28d9",
    secondary: "#1d4ed8",
  },
  days: {
    tier: "days",
    label: "Days",
    description: "Focused deliverables with fast review.",
    primary: "#991b1b",
    secondary: "#b08d1a",
  },
  queued: {
    tier: "queued",
    label: "Queued",
    description: "Building signal before a run lane opens.",
    primary: "#6d28d9",
    secondary: "#4c1d95",
  },
  blocked: {
    tier: "blocked",
    label: "Blocked",
    description: "Held by safety or governance review.",
    primary: "#991b1b",
    secondary: "#6d28d9",
  },
};

export function categoryVisualForSlug(slug: string): CategoryVisual {
  const known = CATEGORY_VISUALS[slug];
  if (known) return { slug, ...known };
  const hash = stableHash(slug);
  return { slug, ...fallbackPalette[hash % fallbackPalette.length] };
}

export function categoryFilterHref(slug: string) {
  return `/kens?category=${encodeURIComponent(slug)}`;
}

export function laneFilterHref(tier: AllocationTier) {
  return `/kens?tier=${encodeURIComponent(tier)}`;
}

export function laneLabel(tier: AllocationTier) {
  return laneVisuals[tier].label;
}

export function stageLabel(stage: TaskStage) {
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

function stableHash(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}
