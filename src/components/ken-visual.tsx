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
  | "updateCount"
  | "taskPulseScore"
  | "sandboxCapitalUsd"
>;

type VisualPalette = {
  a: string;
  b: string;
  c: string;
};

const CATEGORY_PALETTES: Record<string, VisualPalette> = {
  "science-health": { a: "#72f7d3", b: "#6aa7ff", c: "#b5f7ff" },
  "open-tools": { a: "#8af5ff", b: "#a477ff", c: "#f7d66f" },
  "public-interest": { a: "#8df3b2", b: "#49c6ff", c: "#ffb86b" },
  "creative-works": { a: "#ff8bd7", b: "#8f7cff", c: "#ffd166" },
  "everyday-services": { a: "#ffd166", b: "#7ee7ff", c: "#a0ffba" },
};

const TIER_LABELS: Record<TaskSummary["allocatedTier"], string> = {
  months: "Month lane",
  weeks: "Week lane",
  days: "Day lane",
  queued: "Queued",
  blocked: "Blocked",
};

const STAGE_LABELS: Record<TaskSummary["stage"], string> = {
  review: "In review",
  voting: "Voting",
  scheduled: "Scheduled",
  running: "Running",
  shipped: "Shipped",
  blocked: "Blocked",
};

const STATUS_X: Record<TaskSummary["stage"], number> = {
  review: 34,
  voting: 52,
  scheduled: 70,
  running: 92,
  shipped: 112,
  blocked: 70,
};

function hashValue(input: string) {
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash >>> 0);
}

function paletteFor(task: KenVisualTask): VisualPalette {
  return CATEGORY_PALETTES[task.categorySlug] ?? {
    a: `hsl(${hashValue(task.categorySlug) % 360} 86% 68%)`,
    b: `hsl(${(hashValue(task.title) + 74) % 360} 88% 62%)`,
    c: `hsl(${(hashValue(task.title) + 142) % 360} 90% 70%)`,
  };
}

function progressFor(task: KenVisualTask) {
  if (task.stage === "blocked" || task.completionMode === "blocked") return 0.18;
  if (task.stage === "shipped" || task.completionMode === "completed-early") return 0.92;
  if (task.completionMode === "completed-at-limit" || task.completionMode === "partial-delivery") return 0.78;
  if (task.stage === "running") return Math.min(0.82, 0.32 + task.updateCount * 0.14);
  if (task.stage === "scheduled") return 0.28;
  if (task.stage === "voting") return 0.16;
  return 0.08;
}

function checkpointCount(task: KenVisualTask) {
  if (task.allocatedTier === "months") return 5;
  if (task.allocatedTier === "weeks") return 4;
  if (task.allocatedTier === "days") return 3;
  return 2;
}

function CategoryGlyph({ slug }: { slug: string }) {
  if (slug === "science-health") {
    return (
      <g>
        <path d="M55 43c10-16 31-16 42 0c-11 16-32 16-42 0Z" />
        <path d="M62 43h28M70 35v16M82 35v16" />
      </g>
    );
  }
  if (slug === "open-tools") {
    return (
      <g>
        <path d="M59 32h34v25H59z" />
        <path d="M65 38h10M65 44h20M65 50h14" />
        <path d="M95 30l9-8l6 6l-8 9" />
      </g>
    );
  }
  if (slug === "public-interest") {
    return (
      <g>
        <path d="M54 54c10-17 34-17 44 0" />
        <path d="M61 43c0-8 7-15 15-15s15 7 15 15" />
        <path d="M76 24v34M60 58h32" />
      </g>
    );
  }
  if (slug === "creative-works") {
    return (
      <g>
        <path d="M56 52c13-19 24-27 42-24c-4 17-15 28-34 35" />
        <path d="M65 56l18-18M89 32l7-7" />
        <circle cx="63" cy="36" r="4" />
      </g>
    );
  }
  return (
    <g>
      <path d="M58 37h36v25H58z" />
      <path d="M65 37v-8h22v8M65 47h22M65 55h14" />
    </g>
  );
}

export function KenVisual({
  task,
  variant = "card",
}: {
  task: KenVisualTask;
  variant?: "card" | "detail";
}) {
  const palette = paletteFor(task);
  const progress = progressFor(task);
  const visualId = `${task.categorySlug}-${variant}-${hashValue(task.title).toString(36)}`;
  const checkpoints = checkpointCount(task);
  const completedCheckpoints = Math.min(checkpoints, Math.max(0, task.updateCount + (task.stage === "running" ? 1 : 0)));
  const blocked = task.stage === "blocked" || task.completionMode === "blocked";
  const statusX = STATUS_X[task.stage];
  const style = {
    "--ken-visual-a": palette.a,
    "--ken-visual-b": palette.b,
    "--ken-visual-c": palette.c,
    "--ken-visual-progress": `${Math.round(progress * 100)}%`,
  } as CSSProperties;
  const aria = `${task.title}: ${task.categoryName}, ${TIER_LABELS[task.allocatedTier]}, ${STAGE_LABELS[task.stage]}, ${Math.round(progress * 100)} percent progress indicator, sandbox visual.`;

  return (
    <div className={`ken-visual ken-visual-${variant} ${blocked ? "is-blocked" : ""}`} style={style} role="img" aria-label={aria}>
      <svg viewBox="0 0 160 96" aria-hidden="true" focusable="false">
        <defs>
          <linearGradient id={`ken-gradient-${visualId}`} x1="18" y1="14" x2="146" y2="84" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="var(--ken-visual-a)" />
            <stop offset="0.58" stopColor="var(--ken-visual-b)" />
            <stop offset="1" stopColor="var(--ken-visual-c)" />
          </linearGradient>
          <radialGradient id={`ken-glow-${visualId}`} cx="36%" cy="24%" r="78%">
            <stop offset="0" stopColor="var(--ken-visual-a)" stopOpacity="0.44" />
            <stop offset="1" stopColor="var(--ken-visual-b)" stopOpacity="0.03" />
          </radialGradient>
        </defs>
        <rect x="3" y="3" width="154" height="90" rx="18" className="ken-visual-frame" />
        <rect x="3" y="3" width="154" height="90" rx="18" fill={`url(#ken-glow-${visualId})`} />
        <path className="ken-visual-orbit" d="M15 72c26-28 58-37 96-27c14 4 25 4 36-2" />
        <path className="ken-visual-orbit is-second" d="M16 55c31-15 61-15 89 0c14 8 26 10 39 5" />
        <g className="ken-visual-glyph" stroke={`url(#ken-gradient-${visualId})`} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none">
          <CategoryGlyph slug={task.categorySlug} />
        </g>
        <g className="ken-visual-timeline">
          <line x1="26" y1="76" x2="132" y2="76" />
          <line x1="26" y1="76" x2={26 + progress * 106} y2="76" className="is-progress" />
          {Array.from({ length: checkpoints }).map((_, index) => {
            const x = 26 + (index * 106) / Math.max(1, checkpoints - 1);
            return <circle key={index} cx={x} cy="76" r="4.2" className={index < completedCheckpoints ? "is-complete" : ""} />;
          })}
        </g>
        <g className="ken-visual-status">
          <circle cx={statusX} cy="18" r="7.2" />
          {blocked ? (
            <path d={`M${statusX - 3.2} 14.8l6.4 6.4M${statusX + 3.2} 14.8l-6.4 6.4`} />
          ) : task.stage === "shipped" ? (
            <path d={`M${statusX - 3.8} 18l2.6 3l5.3-6`} />
          ) : (
            <path d={`M${statusX} 13.5v4.8l3.5 2.2`} />
          )}
        </g>
        {task.sandboxCapitalUsd > 0 ? <text x="16" y="24" className="ken-visual-sandbox">sandbox</text> : null}
        <text x="16" y="89" className="ken-visual-lane">{TIER_LABELS[task.allocatedTier]}</text>
      </svg>
      <div className="ken-visual-meta" aria-hidden="true">
        <span>{task.categoryName}</span>
        <span>{STAGE_LABELS[task.stage]}</span>
        <span>{task.taskPulseScore > 0 ? `+${task.taskPulseScore}` : task.taskPulseScore} pulse</span>
      </div>
    </div>
  );
}
