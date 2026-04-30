import Image from "next/image";
import type { CSSProperties } from "react";

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

type SymbolPalette = {
  primary: string;
  secondary: string;
  glow: string;
  background: string;
};

const CATEGORY_PALETTES: Record<string, SymbolPalette> = {
  "science-health": { primary: "#88f7e3", secondary: "#8bb8ff", glow: "#123a3d", background: "#020b0d" },
  "open-tools": { primary: "#8eeaff", secondary: "#a98dff", glow: "#142040", background: "#030711" },
  "research-synthesis": { primary: "#d0fb95", secondary: "#7bd6ff", glow: "#1d3316", background: "#050c04" },
  "engineering-systems": { primary: "#90eaff", secondary: "#8296ff", glow: "#102540", background: "#030711" },
  "safety-evaluation": { primary: "#ffab9f", secondary: "#b78dff", glow: "#371620", background: "#0d0407" },
  "frontier-creative": { primary: "#ff98dd", secondary: "#a98cff", glow: "#36153d", background: "#0c0310" },
};

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

function paletteFor(categorySlug: string) {
  return CATEGORY_PALETTES[categorySlug] ?? {
    primary: "#9ef3ff",
    secondary: "#a98dff",
    glow: "#152238",
    background: "#030711",
  };
}

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
  if (slug === "science-health") {
    return (
      <>
        <path d="M28 28c16 0 24 40 40 40" />
        <path d="M68 28c-16 0-24 40-40 40" />
        <path d="M34 40h28M34 56h28" />
      </>
    );
  }

  if (slug === "open-tools") {
    return (
      <>
        <path d="M27 31h34c5 0 8 3 8 8v25H27z" />
        <path d="M37 45l9 7l-9 7M51 59h11" />
        <path d="M69 35l10 6v14l-10 6l-10-6V41z" />
      </>
    );
  }

  if (slug === "research-synthesis") {
    return (
      <>
        <rect x="25" y="33" width="25" height="22" rx="5" />
        <rect x="57" y="27" width="18" height="17" rx="4" />
        <rect x="55" y="58" width="22" height="14" rx="4" />
        <path d="M50 43h7M46 55l12 8M45 36l12-2" />
      </>
    );
  }

  if (slug === "engineering-systems") {
    return (
      <>
        <rect x="24" y="33" width="25" height="20" rx="5" />
        <rect x="55" y="45" width="25" height="22" rx="5" />
        <path d="M49 43h6M37 53v17h18M67 45V29h12" />
        <circle cx="37" cy="70" r="4" />
        <circle cx="79" cy="29" r="4" />
      </>
    );
  }

  if (slug === "safety-evaluation") {
    return (
      <>
        <path d="M48 25l22 8v18c0 15-8 25-22 31c-14-6-22-16-22-31V33z" />
        <path d="M48 34v32M36 48h24M39 60h18" />
      </>
    );
  }

  if (slug === "frontier-creative") {
    return (
      <>
        <path d="M27 62c11-21 27-31 49-29c-3 22-18 34-44 38" />
        <path d="M36 62c13-6 25-14 36-25" />
        <path d="M71 36l8-10M76 45l11-3" />
        <circle cx="37" cy="42" r="4" />
      </>
    );
  }

  return (
    <>
      <path d="M31 31h36l11 17l-11 17H31L20 48z" />
      <path d="M38 39h22M34 48h30M38 57h22" />
      <circle cx="49" cy="48" r="5" />
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
  const palette = paletteFor(categorySlug);
  const style = {
    "--symbol-primary": palette.primary,
    "--symbol-secondary": palette.secondary,
    "--symbol-glow": palette.glow,
    "--symbol-background": palette.background,
  } as CSSProperties;
  const label = `${categoryName} symbol, ${TIER_LABELS[tier]}, ${STAGE_LABELS[stage]}.`;

  return (
    <svg
      className={`category-symbol category-symbol-${variant} is-${stage} lane-${tier}`}
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
