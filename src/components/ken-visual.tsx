import Image from "next/image";
import { useId, type CSSProperties, type ReactNode } from "react";

import { categoryVisualForSlug, laneVisuals, type CategoryVisual } from "@/lib/taxonomy";
import type { TaskSummary } from "@/lib/types";

type KenVisualTask = Pick<
  TaskSummary,
  | "title"
  | "categoryName"
  | "categorySlug"
  | "allocatedTier"
  | "stage"
  | "completionMode"
  | "illustrationUrl"
  | "illustrationAlt"
  | "illustrationSource"
>;

const TIER_LABELS: Record<TaskSummary["allocatedTier"], string> = {
  months: "Months lane",
  weeks: "Weeks lane",
  days: "Days lane",
  queued: "Queued lane",
  blocked: "Blocked lane",
};

const STAGE_LABELS: Record<TaskSummary["stage"], string> = {
  review: "Review",
  voting: "Voting",
  scheduled: "Scheduled",
  running: "Running",
  shipped: "Shipped",
  blocked: "Blocked",
};

function completionLabel(task: KenVisualTask) {
  if (task.completionMode === "completed-early") return "Early delivery";
  if (task.completionMode === "completed-at-limit") return "At limit";
  if (task.completionMode === "partial-delivery") return "Partial delivery";
  if (task.completionMode === "blocked") return "Blocked";
  return STAGE_LABELS[task.stage];
}

function statusMark(stage: TaskSummary["stage"]): ReactNode {
  switch (stage) {
    case "blocked":
      return <path d="M70.8 18.8l6.4 6.4M77.2 18.8l-6.4 6.4" />;
    case "shipped":
      return <path d="M70.7 22.1l2.3 2.3l4.8-6" />;
    case "running":
      return <path d="M74 18.3v7.4M70.3 22h7.4" />;
    case "scheduled":
      return <path d="M74 18.1v4.5l3.1 1.9" />;
    case "voting":
      return <path d="M70.8 24.2L74 18.8l3.2 5.4M74 19.3v7" />;
    default:
      return <path d="M70.4 19.6h7.2M70.4 23.8h7.2" />;
  }
}

function activeTierSegments(tier: TaskSummary["allocatedTier"]) {
  switch (tier) {
    case "months":
      return 5;
    case "weeks":
      return 4;
    case "days":
      return 3;
    case "queued":
      return 2;
    case "blocked":
      return 1;
  }
}

function CategoryMotif({ motif, accentPaint }: { motif: CategoryVisual["motif"]; accentPaint: string }) {
  if (motif === "helix") {
    return (
      <>
        <path className="category-symbol-glyph" d="M34 29c25 8 3 28 28 36" />
        <path className="category-symbol-glyph" d="M62 29c-25 8-3 28-28 36" />
        <path className="category-symbol-accent" d="M40 36h16M37 47h22M40 58h16" stroke={accentPaint} />
        <circle className="category-symbol-micro" cx="34" cy="29" r="2.2" fill={accentPaint} />
        <circle className="category-symbol-micro" cx="62" cy="65" r="2.2" fill={accentPaint} />
      </>
    );
  }

  if (motif === "tool") {
    return (
      <>
        <rect className="category-symbol-glyph" x="26" y="31" width="38" height="31" rx="7" />
        <path className="category-symbol-accent" d="M29 38h32" stroke={accentPaint} />
        <path className="category-symbol-glyph" d="M35 46l7 5l-7 5M47 56h9" />
        <circle className="category-symbol-micro" cx="59" cy="38" r="1.8" fill={accentPaint} />
      </>
    );
  }

  if (motif === "graph") {
    return (
      <>
        <path className="category-symbol-accent" d="M36 38l12 10l12-13M48 48l12 13" stroke={accentPaint} />
        <circle className="category-symbol-glyph" cx="34" cy="37" r="5.7" />
        <circle className="category-symbol-glyph" cx="62" cy="34" r="5" />
        <circle className="category-symbol-glyph" cx="62" cy="62" r="6" />
        <path className="category-symbol-glyph" d="M48 43l5 5l-5 5l-5-5z" />
      </>
    );
  }

  if (motif === "system") {
    return (
      <>
        <rect className="category-symbol-glyph" x="25" y="31" width="23" height="18" rx="5.5" />
        <rect className="category-symbol-glyph" x="50" y="50" width="23" height="18" rx="5.5" />
        <path className="category-symbol-glyph" d="M48 40h8v19h-6M37 49v13h13M61 50V37h8" />
        <path className="category-symbol-accent" d="M29 37h15M54 56h15" stroke={accentPaint} />
        <circle className="category-symbol-micro" cx="37" cy="62" r="2.2" fill={accentPaint} />
        <circle className="category-symbol-micro" cx="69" cy="37" r="2.2" fill={accentPaint} />
      </>
    );
  }

  if (motif === "shield") {
    return (
      <>
        <path className="category-symbol-glyph" d="M48 27l18 7v15c0 12-6.8 21-18 26c-11.2-5-18-14-18-26V34z" />
        <path className="category-symbol-glyph" d="M38.5 50l6.2 6.2L58 41.5" />
        <path className="category-symbol-accent" d="M48 32v36" stroke={accentPaint} />
      </>
    );
  }

  if (motif === "spark") {
    return (
      <>
        <path className="category-symbol-glyph" d="M48 27l5.2 15.8L69 48l-15.8 5.2L48 69l-5.2-15.8L27 48l15.8-5.2z" />
        <path className="category-symbol-glyph" d="M31 59l2.1 6.1l6.1 2.1l-6.1 2.1l-2.1 6.1l-2.1-6.1l-6.1-2.1l6.1-2.1z" />
        <path className="category-symbol-accent" d="M34 61c8-1 15-5 20-11" stroke={accentPaint} />
      </>
    );
  }

  return (
    <>
      <path className="category-symbol-glyph" d="M48 26l21 12v23L48 73L27 61V38z" />
      <path className="category-symbol-glyph" d="M48 26v47M27 38l21 12l21-12M27 61l21-11l21 11" />
      <path className="category-symbol-accent" d="M37 43l11 7l11-7M37 57l11-7l11 7" stroke={accentPaint} />
    </>
  );
}

function corePosition(motif: CategoryVisual["motif"]) {
  switch (motif) {
    case "helix":
      return { cx: 48, cy: 47 };
    case "tool":
      return { cx: 51, cy: 51 };
    case "system":
      return { cx: 49, cy: 49 };
    case "shield":
      return { cx: 48, cy: 49 };
    case "prism":
      return { cx: 48, cy: 50 };
    default:
      return { cx: 48, cy: 48 };
  }
}

export function CategorySymbol({
  categorySlug,
  categoryName,
  tier,
  stage,
  variant = "card",
  decorative = false,
}: {
  categorySlug: string;
  categoryName: string;
  tier: TaskSummary["allocatedTier"];
  stage: TaskSummary["stage"];
  variant?: "card" | "detail" | "inline";
  decorative?: boolean;
}) {
  const palette = categoryVisualForSlug(categorySlug);
  const lane = laneVisuals[tier];
  const idSeed = useId().replace(/[^a-zA-Z0-9_-]/g, "") || "symbol";
  const ringId = `ken-category-ring-${idSeed}`;
  const accentId = `ken-category-accent-${idSeed}`;
  const auraId = `ken-category-aura-${idSeed}`;
  const coreId = `ken-category-core-${idSeed}`;
  const accentPaint = `url(#${accentId})`;
  const core = corePosition(palette.motif);
  const activeSegments = activeTierSegments(tier);
  const style = {
    "--symbol-primary": palette.primary,
    "--symbol-secondary": palette.secondary,
    "--symbol-tertiary": palette.tertiary,
    "--symbol-glow": lane.primary,
    "--symbol-background": palette.background,
  } as CSSProperties;
  const label = `${categoryName} symbol, ${TIER_LABELS[tier]}, ${STAGE_LABELS[stage]}.`;

  return (
    <svg
      className={`category-symbol category-symbol-${variant} is-${stage} lane-${tier}`}
      data-category-slug={categorySlug}
      data-motif={palette.motif}
      data-tier-segments={activeSegments}
      viewBox="0 0 96 96"
      preserveAspectRatio="xMidYMid meet"
      shapeRendering="geometricPrecision"
      style={style}
      role={decorative ? undefined : "img"}
      aria-hidden={decorative || undefined}
      aria-label={decorative ? undefined : label}
      focusable="false"
    >
      <defs>
        <linearGradient id={ringId} x1="11" y1="85" x2="85" y2="11" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#1d4ed8" />
          <stop offset=".25" stopColor="#4c1d95" />
          <stop offset=".5" stopColor="#b08d1a" />
          <stop offset=".75" stopColor="#991b1b" />
          <stop offset="1" stopColor="#6d28d9" />
        </linearGradient>
        <linearGradient id={accentId} x1="30" y1="67" x2="68" y2="29" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="var(--symbol-primary)" />
          <stop offset=".54" stopColor="var(--symbol-secondary)" />
          <stop offset="1" stopColor="var(--symbol-tertiary)" />
        </linearGradient>
        <radialGradient id={auraId} cx="50%" cy="44%" r="58%">
          <stop offset="0" stopColor="var(--symbol-secondary)" stopOpacity=".18" />
          <stop offset=".58" stopColor="var(--symbol-primary)" stopOpacity=".07" />
          <stop offset="1" stopColor="var(--symbol-tertiary)" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={coreId} cx="38%" cy="32%" r="72%">
          <stop offset="0" stopColor="var(--symbol-core-start)" />
          <stop offset=".44" stopColor="var(--symbol-core-start)" />
          <stop offset=".72" stopColor="#8a8a8a" />
          <stop offset="1" stopColor="var(--symbol-core-end)" />
        </radialGradient>
      </defs>

      <g className="category-symbol-core-identity" aria-hidden="true">
        <rect className="category-symbol-surface" x="8.5" y="8.5" width="79" height="79" rx="24" />
        <rect className="category-symbol-ring" x="9.4" y="9.4" width="77.2" height="77.2" rx="23.1" stroke={`url(#${ringId})`} />
        <circle className="category-symbol-aura" cx="48" cy="48" r="27" fill={`url(#${auraId})`} />
        <g className="category-symbol-motif">
          <CategoryMotif motif={palette.motif} accentPaint={accentPaint} />
        </g>
        <circle
          className="category-symbol-jewel"
          cx={core.cx}
          cy={core.cy}
          r="3.7"
          fill={`url(#${coreId})`}
          stroke={accentPaint}
        />
      </g>

      <g className="category-symbol-tier" aria-hidden="true">
        {Array.from({ length: 5 }, (_, index) => (
          <rect
            key={index}
            className={`category-symbol-tier-segment${index < activeSegments ? " is-active" : ""}`}
            x={27 + index * 9}
            y="77"
            width="6"
            height="2.4"
            rx="1.2"
            fill={index < activeSegments ? accentPaint : undefined}
          />
        ))}
      </g>

      <g className="category-symbol-status" aria-hidden="true">
        <circle className="category-symbol-status-surface" cx="74" cy="22" r="7.8" />
        <circle className="category-symbol-status-ring" cx="74" cy="22" r="7.8" stroke={accentPaint} />
        <g className="category-symbol-status-mark">{statusMark(stage)}</g>
      </g>
    </svg>
  );
}

export function KenVisual({ task, variant = "card" }: { task: KenVisualTask; variant?: "card" | "detail" }) {
  if (task.illustrationUrl) {
    return (
      <figure className={`ken-art ken-art-${variant}`}>
        <Image
          className="ken-art-image"
          src={task.illustrationUrl}
          alt={task.illustrationAlt ?? `Illustration for ${task.title}`}
          loading="lazy"
          width={variant === "detail" ? 360 : 220}
          height={variant === "detail" ? 220 : 132}
          unoptimized
        />
        {variant === "detail" && task.illustrationAlt ? <figcaption>{task.illustrationAlt}</figcaption> : null}
      </figure>
    );
  }

  return (
    <div
      className={`ken-visual ken-symbol ken-symbol-${variant} is-${task.stage} lane-${task.allocatedTier}`}
      data-category-slug={task.categorySlug}
      role="img"
      aria-label={`${task.categoryName}; ${TIER_LABELS[task.allocatedTier]}; ${completionLabel(task)}. No uploaded Ken illustration is set.`}
    >
      <CategorySymbol
        categorySlug={task.categorySlug}
        categoryName={task.categoryName}
        tier={task.allocatedTier}
        stage={task.stage}
        variant={variant}
        decorative
      />
      <div className="ken-symbol-copy" aria-hidden="true">
        <span>{task.categoryName}</span>
        <strong>{TIER_LABELS[task.allocatedTier]}</strong>
        <em>{completionLabel(task)}</em>
      </div>
    </div>
  );
}
