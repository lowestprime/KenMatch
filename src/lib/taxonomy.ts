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
    primary: "#8fb7ff",
    secondary: "#ffcf66",
    tertiary: "#ff6b6b",
    background: "#03040a",
    motif: "helix",
  },
  "open-tools": {
    primary: "#6ea8ff",
    secondary: "#b58cff",
    tertiary: "#ffd166",
    background: "#02040c",
    motif: "tool",
  },
  "research-synthesis": {
    primary: "#b58cff",
    secondary: "#ffcf66",
    tertiary: "#6ea8ff",
    background: "#05020c",
    motif: "graph",
  },
  "engineering-systems": {
    primary: "#6ea8ff",
    secondary: "#ff6b6b",
    tertiary: "#b58cff",
    background: "#02050d",
    motif: "system",
  },
  "safety-evaluation": {
    primary: "#ff6b6b",
    secondary: "#b58cff",
    tertiary: "#ffcf66",
    background: "#0c0205",
    motif: "shield",
  },
  "frontier-creative": {
    primary: "#b58cff",
    secondary: "#ff6b6b",
    tertiary: "#6ea8ff",
    background: "#09020e",
    motif: "spark",
  },
};

const fallbackPalette = [
  { primary: "#6ea8ff", secondary: "#b58cff", tertiary: "#ffcf66", background: "#02040c", motif: "prism" as const },
  { primary: "#b58cff", secondary: "#ffcf66", tertiary: "#ff6b6b", background: "#07020d", motif: "graph" as const },
  { primary: "#ffcf66", secondary: "#6ea8ff", tertiary: "#b58cff", background: "#080602", motif: "spark" as const },
  { primary: "#ff6b6b", secondary: "#b58cff", tertiary: "#ffcf66", background: "#0c0205", motif: "shield" as const },
];

export const laneVisuals: Record<AllocationTier, LaneVisual> = {
  months: {
    tier: "months",
    label: "Months",
    description: "Top long-horizon Kens per category.",
    primary: "#ffcf66",
    secondary: "#6ea8ff",
  },
  weeks: {
    tier: "weeks",
    label: "Weeks",
    description: "Multi-step runs with mid-run checkpoints.",
    primary: "#b58cff",
    secondary: "#6ea8ff",
  },
  days: {
    tier: "days",
    label: "Days",
    description: "Focused deliverables with fast review.",
    primary: "#ff6b6b",
    secondary: "#ffcf66",
  },
  queued: {
    tier: "queued",
    label: "Queued",
    description: "Building signal before a run lane opens.",
    primary: "#6ea8ff",
    secondary: "#b8c4d6",
  },
  blocked: {
    tier: "blocked",
    label: "Blocked",
    description: "Held by safety or governance review.",
    primary: "#ff6b6b",
    secondary: "#8f1d2d",
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
