import Image from "next/image";
import type { CSSProperties } from "react";

import { categoryVisualForSlug, laneVisuals } from "@/lib/taxonomy";
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

function statusPath(stage: TaskSummary["stage"]) {
  switch (stage) {
    case "blocked":
      return <path d="M50 42l10 10M60 42L50 52" />;
    case "shipped":
      return <path d="M49 48l5 5l11-13" />;
    case "running":
      return <path d="M55 39v18M46 48h18" />;
    case "scheduled":
      return <path d="M55 38v11l8 5" />;
    case "voting":
      return <path d="M47 51l8-11l8 11M55 41v17" />;
    default:
      return <path d="M47 43h16M47 52h16" />;
  }
}

function lanePath(tier: TaskSummary["allocatedTier"]) {
  switch (tier) {
    case "months":
      return "M18 76h60";
    case "weeks":
      return "M22 76h52";
    case "days":
      return "M28 76h40";
    case "blocked":
      return "M25 76h46";
    default:
      return "M31 76h34";
  }
}

function CategoryMotif({ slug }: { slug: string }) {
  const visual = categoryVisualForSlug(slug);
  if (visual.motif === "helix") {
    return (
      <>
        <path d="M31 28c14 5 22 13 36 40" />
        <path d="M67 28c-14 5-22 13-36 40" />
        <path d="M38 41h22M36 55h24" />
      </>
    );
  }

  if (visual.motif === "tool") {
    return (
      <>
        <path d="M27 35h31c4 0 7 3 7 7v22H27z" />
        <path d="M37 47l8 6l-8 6M51 59h10" />
        <path d="M68 32l9 5v12l-9 5l-9-5V37z" />
      </>
    );
  }

  if (visual.motif === "graph") {
    return (
      <>
        <circle cx="35" cy="37" r="8" />
        <circle cx="63" cy="32" r="7" />
        <circle cx="62" cy="64" r="9" />
        <path d="M43 36l13-3M39 44l17 14M63 39l-1 16" />
      </>
    );
  }

  if (visual.motif === "system") {
    return (
      <>
        <rect x="25" y="31" width="22" height="20" rx="6" />
        <rect x="54" y="45" width="24" height="22" rx="7" />
        <path d="M47 41h7M36 51v17h18M66 45V30h12" />
        <circle cx="36" cy="68" r="4" />
        <circle cx="78" cy="30" r="4" />
      </>
    );
  }

  if (visual.motif === "shield") {
    return (
      <>
        <path d="M48 25l22 8v18c0 15-8 25-22 31c-14-6-22-16-22-31V33z" />
        <path d="M48 35v29M36 49h24M40 60h16" />
      </>
    );
  }

  if (visual.motif === "spark") {
    return (
      <>
        <path d="M48 25l6 17l18 6l-18 6l-6 17l-6-17l-18-6l18-6z" />
        <path d="M70 26l3 8l8 3l-8 3l-3 8l-3-8l-8-3l8-3z" />
      </>
    );
  }

  return (
    <>
      <path d="M48 26l25 14v20L48 74L23 60V40z" />
      <path d="M35 43h26M35 53h26M48 31v34" />
    </>
  );
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
      viewBox="0 0 96 96"
      style={style}
      role={decorative ? undefined : "img"}
      aria-hidden={decorative || undefined}
      aria-label={decorative ? undefined : label}
      focusable="false"
    >
      <rect x="8" y="8" width="80" height="80" rx="24" className="category-symbol-shell" />
      <path d="M19 73c16-8 38-8 58 0" className="category-symbol-horizon" />
      <g className="category-symbol-motif">
        <CategoryMotif slug={categorySlug} />
      </g>
      <path d={lanePath(tier)} className="category-symbol-lane" />
      <g className="category-symbol-status">
        <circle cx="74" cy="24" r="11" />
        {statusPath(stage)}
      </g>
    </svg>
  );
}

export function KenVisual({
  task,
  variant = "card",
}: {
  task: KenVisualTask;
  variant?: "card" | "detail";
}) {
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
        {variant === "detail" && task.illustrationAlt ? (
          <figcaption>{task.illustrationAlt}</figcaption>
        ) : null}
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
