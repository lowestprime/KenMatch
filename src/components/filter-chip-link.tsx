import Link from "next/link";
import type { CSSProperties } from "react";

import {
  categoryFilterHref,
  categoryVisualForSlug,
  laneFilterHref,
  laneVisuals,
} from "@/lib/taxonomy";
import type { AllocationTier } from "@/lib/types";

export function CategoryFilterChip({
  slug,
  label,
  rank,
  className = "",
}: {
  slug: string;
  label: string;
  rank?: number | null;
  className?: string;
}) {
  const visual = categoryVisualForSlug(slug);
  const style = {
    "--chip-primary": visual.primary,
    "--chip-secondary": visual.secondary,
    "--chip-tertiary": visual.tertiary,
  } as CSSProperties;

  return (
    <Link
      href={categoryFilterHref(slug)}
      className={`filter-chip-link category-filter-chip ${className}`}
      style={style}
      aria-label={`Show Kens in ${label}`}
    >
      <span className="filter-chip-swatch" aria-hidden="true" />
      <span>{rank ? `#${rank} in ${label}` : label}</span>
    </Link>
  );
}

export function LaneFilterChip({
  tier,
  className = "",
}: {
  tier: AllocationTier;
  className?: string;
}) {
  const visual = laneVisuals[tier];
  const style = {
    "--chip-primary": visual.primary,
    "--chip-secondary": visual.secondary,
  } as CSSProperties;

  return (
    <Link
      href={laneFilterHref(tier)}
      className={`filter-chip-link lane-filter-chip is-${tier} ${className}`}
      style={style}
      aria-label={`Show ${visual.label} lane Kens`}
    >
      <span className="filter-chip-swatch" aria-hidden="true" />
      <span>{visual.label}</span>
    </Link>
  );
}
