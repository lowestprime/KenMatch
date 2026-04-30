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
  | "updateCount"
  | "taskPulseScore"
  | "sandboxCapitalUsd"
  | "illustrationUrl"
  | "illustrationAlt"
  | "illustrationSource"
>;

type VisualPalette = {
  primary: string;
  secondary: string;
  tertiary: string;
  wash: string;
};

type VisualNode = {
  x: number;
  y: number;
  r: number;
  tone: 0 | 1 | 2;
  opacity: number;
};

const CATEGORY_PALETTES: Record<string, VisualPalette> = {
  "science-health": { primary: "#77f7d6", secondary: "#68a8ff", tertiary: "#f4f9ff", wash: "#0b3f48" },
  "open-tools": { primary: "#83f4ff", secondary: "#a77bff", tertiary: "#ffd86e", wash: "#1b2a52" },
  "research-synthesis": { primary: "#c6f88d", secondary: "#65d6ff", tertiary: "#fff1a8", wash: "#263d1b" },
  "engineering-systems": { primary: "#8cecff", secondary: "#6e85ff", tertiary: "#ffcb7d", wash: "#122a44" },
  "safety-evaluation": { primary: "#ff9d8d", secondary: "#a77bff", tertiary: "#8ff9d2", wash: "#3a1825" },
  "frontier-creative": { primary: "#ff8edc", secondary: "#9c83ff", tertiary: "#ffd66d", wash: "#421b4c" },
};

const TIER_LABELS: Record<TaskSummary["allocatedTier"], string> = {
  months: "Month lane",
  weeks: "Week lane",
  days: "Day lane",
  queued: "Queued",
  blocked: "Blocked",
};

const STAGE_LABELS: Record<TaskSummary["stage"], string> = {
  review: "Review",
  voting: "Voting",
  scheduled: "Scheduled",
  running: "Running",
  shipped: "Shipped",
  blocked: "Blocked",
};

const STAGE_POSITIONS: Record<TaskSummary["stage"], number> = {
  review: 54,
  voting: 83,
  scheduled: 113,
  running: 145,
  shipped: 174,
  blocked: 113,
};

const TIER_DENSITY: Record<TaskSummary["allocatedTier"], number> = {
  months: 8,
  weeks: 7,
  days: 6,
  queued: 4,
  blocked: 4,
};

function hashValue(input: string) {
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function hashUnit(seed: number, salt: number) {
  let value = seed + Math.imul(salt + 1, 0x9e3779b1);
  value ^= value >>> 16;
  value = Math.imul(value, 0x85ebca6b);
  value ^= value >>> 13;
  value = Math.imul(value, 0xc2b2ae35);
  value ^= value >>> 16;
  return (value >>> 0) / 4294967295;
}

function paletteFor(task: KenVisualTask): VisualPalette {
  const fixed = CATEGORY_PALETTES[task.categorySlug];
  if (fixed) return fixed;

  const hue = hashValue(`${task.categorySlug}:${task.title}`) % 360;
  return {
    primary: `hsl(${hue} 88% 68%)`,
    secondary: `hsl(${(hue + 72) % 360} 88% 62%)`,
    tertiary: `hsl(${(hue + 148) % 360} 90% 72%)`,
    wash: `hsl(${hue} 44% 20%)`,
  };
}

function progressFor(task: KenVisualTask) {
  if (task.stage === "blocked" || task.completionMode === "blocked") return 0.16;
  if (task.stage === "shipped" || task.completionMode === "completed-early") return 0.94;
  if (task.completionMode === "completed-at-limit" || task.completionMode === "partial-delivery") return 0.78;
  if (task.stage === "running") return Math.min(0.86, 0.34 + task.updateCount * 0.13);
  if (task.stage === "scheduled") return 0.31;
  if (task.stage === "voting") return 0.18;
  return 0.09;
}

function checkpointCount(task: KenVisualTask) {
  if (task.allocatedTier === "months") return 6;
  if (task.allocatedTier === "weeks") return 5;
  if (task.allocatedTier === "days") return 4;
  return 3;
}

function nodeField(seed: number, count: number, variant: "card" | "detail"): VisualNode[] {
  const detail = variant === "detail";
  return Array.from({ length: count }, (_, index) => ({
    x: 18 + hashUnit(seed, index * 7 + 1) * 184,
    y: 18 + hashUnit(seed, index * 7 + 2) * (detail ? 82 : 70),
    r: 1.1 + hashUnit(seed, index * 7 + 3) * (detail ? 2.4 : 1.6),
    tone: (index % 3) as 0 | 1 | 2,
    opacity: 0.22 + hashUnit(seed, index * 7 + 4) * 0.34,
  }));
}

function completionLabel(task: KenVisualTask) {
  if (task.completionMode === "completed-early") return "Early delivery";
  if (task.completionMode === "completed-at-limit") return "At limit";
  if (task.completionMode === "partial-delivery") return "Partial";
  if (task.completionMode === "blocked") return "Blocked";
  if (task.stage === "running") return "Checkpointing";
  return STAGE_LABELS[task.stage];
}

function pulseLabel(score: number) {
  return score > 0 ? `+${score}` : String(score);
}

function motifLabel(slug: string) {
  if (slug === "science-health") return "evidence map";
  if (slug === "open-tools") return "software module";
  if (slug === "research-synthesis") return "review graph";
  if (slug === "engineering-systems") return "systems map";
  if (slug === "safety-evaluation") return "evaluation harness";
  if (slug === "frontier-creative") return "simulation studio";
  return "review lattice";
}

function DomainMotif({ slug, gradientId }: { slug: string; gradientId: string }) {
  if (slug === "science-health") {
    return (
      <g className="ken-visual-domain" stroke={`url(#${gradientId})`}>
        <path className="ken-visual-panel-shape" d="M44 33h48c8 0 13 5 13 13v26c0 8-5 13-13 13H44c-8 0-13-5-13-13V46c0-8 5-13 13-13Z" />
        <path d="M50 45c15 0 22 25 39 25" />
        <path d="M89 45c-17 0-24 25-39 25" />
        <path d="M55 51h28M55 64h28" />
        <circle cx="48" cy="45" r="3.3" />
        <circle cx="91" cy="70" r="3.3" />
        <path className="ken-visual-accent-line" d="M112 45h22M112 56h34M112 67h24" />
      </g>
    );
  }

  if (slug === "open-tools") {
    return (
      <g className="ken-visual-domain" stroke={`url(#${gradientId})`}>
        <path className="ken-visual-panel-shape" d="M33 34h67c7 0 11 4 11 11v37H33V34Z" />
        <path d="M45 52l12 9l-12 9M66 70h20" />
        <path className="ken-visual-accent-line" d="M119 40l18-10l18 10v22l-18 10l-18-10Z" />
        <path d="M137 30v42M119 40l18 11l18-11" />
        <circle cx="137" cy="51" r="4" />
      </g>
    );
  }

  if (slug === "research-synthesis") {
    return (
      <g className="ken-visual-domain" stroke={`url(#${gradientId})`}>
        <path className="ken-visual-panel-shape" d="M35 40h54v35H35zM111 31h43v28h-43zM116 76h39v21h-39z" />
        <path d="M89 57h22M70 75l46 11M62 40l49 5" />
        <circle cx="62" cy="58" r="7" />
        <circle cx="133" cy="45" r="6" />
        <circle cx="136" cy="86" r="5" />
        <path className="ken-visual-accent-line" d="M45 51h28M45 62h20M121 43h22M125 86h22" />
      </g>
    );
  }

  if (slug === "engineering-systems") {
    return (
      <g className="ken-visual-domain" stroke={`url(#${gradientId})`}>
        <path className="ken-visual-panel-shape" d="M38 37h45v31H38zM103 48h54v37h-54z" />
        <path d="M83 52h20M65 68v22h38M123 48V30h27" />
        <circle cx="65" cy="90" r="6" />
        <circle cx="150" cy="30" r="6" />
        <path className="ken-visual-accent-line" d="M49 49h22M114 61h31M114 73h21" />
      </g>
    );
  }

  if (slug === "safety-evaluation") {
    return (
      <g className="ken-visual-domain" stroke={`url(#${gradientId})`}>
        <path className="ken-visual-panel-shape" d="M48 34l36-12l36 12v27c0 22-14 37-36 45c-22-8-36-23-36-45V34Z" />
        <path d="M84 34v60M62 55h44M66 72h36" />
        <path className="ken-visual-accent-line" d="M126 42h30M126 54h22M126 66h27" />
        <circle cx="149" cy="84" r="10" />
        <path d="M144 84l3.5 3.8l7.5-8.8" />
      </g>
    );
  }

  if (slug === "frontier-creative") {
    return (
      <g className="ken-visual-domain" stroke={`url(#${gradientId})`}>
        <path className="ken-visual-panel-shape" d="M36 76c17-30 42-43 77-40c-5 32-27 49-66 54" />
        <path d="M50 75c18-8 34-19 50-34" />
        <path className="ken-visual-accent-line" d="M112 44c10 3 18 10 24 20M119 36l10-12M132 48l15-5" />
        <circle cx="55" cy="47" r="7" />
        <circle cx="72" cy="37" r="4" />
        <path d="M43 85c19-1 34-5 45-13" />
      </g>
    );
  }

  return (
    <g className="ken-visual-domain" stroke={`url(#${gradientId})`}>
      <path className="ken-visual-panel-shape" d="M41 38h72l22 21l-22 21H41L19 59l22-21Z" />
      <path d="M55 47h44M45 59h66M55 71h44" />
      <path className="ken-visual-accent-line" d="M128 41c13 11 17 25 11 42M32 41c-13 11-17 25-11 42" />
      <circle cx="78" cy="59" r="9" />
    </g>
  );
}

function StatusMark({ stage, x }: { stage: TaskSummary["stage"]; x: number }) {
  if (stage === "blocked") {
    return <path d={`M${x - 4.6} 24.4l9.2 9.2M${x + 4.6} 24.4l-9.2 9.2`} />;
  }
  if (stage === "shipped") {
    return <path d={`M${x - 5.4} 29l3.5 4l7.6-8.4`} />;
  }
  if (stage === "running") {
    return <path d={`M${x - 4.2} 28.8h8.4M${x} 24.6v8.4`} />;
  }
  if (stage === "scheduled") {
    return <path d={`M${x} 23.5v6.1l4.8 3`} />;
  }
  if (stage === "voting") {
    return <path d={`M${x - 5} 30l5-5l5 5M${x} 25v9`} />;
  }
  return <path d={`M${x - 4} 26.2h8M${x - 4} 31.4h8`} />;
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
  const seed = hashValue(`${task.title}|${task.categorySlug}|${task.stage}|${task.allocatedTier}`);
  const visualId = `ken-${variant}-${seed.toString(36)}`;
  const gradientId = `${visualId}-gradient`;
  const glowId = `${visualId}-glow`;
  const gridId = `${visualId}-grid`;
  const checkpoints = checkpointCount(task);
  const completedCheckpoints = Math.min(
    checkpoints,
    Math.max(0, task.updateCount + (task.stage === "running" || task.stage === "shipped" ? 1 : 0)),
  );
  const blocked = task.stage === "blocked" || task.completionMode === "blocked";
  const statusX = STAGE_POSITIONS[task.stage];
  const nodeCount = TIER_DENSITY[task.allocatedTier] + (variant === "detail" ? 2 : 0);
  const nodes = nodeField(seed, nodeCount, variant);
  const pulseIntensity = Math.min(1, Math.abs(task.taskPulseScore) / 12);
  const arcLength = 113.1;
  const style = {
    "--ken-visual-primary": palette.primary,
    "--ken-visual-secondary": palette.secondary,
    "--ken-visual-tertiary": palette.tertiary,
    "--ken-visual-wash": palette.wash,
    "--ken-visual-progress": `${Math.round(progress * 100)}%`,
    "--ken-visual-pulse": pulseIntensity.toFixed(2),
  } as CSSProperties;
  const aria = task.illustrationUrl && task.illustrationAlt
    ? `${task.title}: ${task.illustrationAlt}. ${TIER_LABELS[task.allocatedTier]}, ${STAGE_LABELS[task.stage]}, ${Math.round(progress * 100)} percent checkpoint progress.`
    : `${task.title}: ${task.categoryName} ${motifLabel(task.categorySlug)}, ${TIER_LABELS[task.allocatedTier]}, ${STAGE_LABELS[task.stage]}, ${Math.round(progress * 100)} percent checkpoint progress, ${task.sandboxCapitalUsd > 0 ? "sandbox demo data shown" : "no sandbox funding shown"}.`;

  return (
    <div
      className={`ken-visual ken-visual-${variant} is-${task.stage} lane-${task.allocatedTier} ${blocked ? "is-blocked" : ""}`}
      style={style}
      role="img"
      aria-label={aria}
    >
      {task.illustrationUrl ? (
        <Image
          className="ken-visual-upload"
          src={task.illustrationUrl}
          alt={task.illustrationAlt ?? `Illustration for ${task.title}`}
          loading="lazy"
          width={220}
          height={132}
          unoptimized
        />
      ) : null}
      <svg viewBox="0 0 220 132" aria-hidden="true" focusable="false">
        <defs>
          <linearGradient id={gradientId} x1="20" y1="16" x2="202" y2="114" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="var(--ken-visual-primary)" />
            <stop offset="0.54" stopColor="var(--ken-visual-secondary)" />
            <stop offset="1" stopColor="var(--ken-visual-tertiary)" />
          </linearGradient>
          <radialGradient id={glowId} cx={`${26 + hashUnit(seed, 91) * 42}%`} cy={`${18 + hashUnit(seed, 92) * 42}%`} r="82%">
            <stop offset="0" stopColor="var(--ken-visual-primary)" stopOpacity="0.55" />
            <stop offset="0.42" stopColor="var(--ken-visual-secondary)" stopOpacity="0.22" />
            <stop offset="1" stopColor="var(--ken-visual-wash)" stopOpacity="0.02" />
          </radialGradient>
          <pattern id={gridId} width="14" height="14" patternUnits="userSpaceOnUse">
            <path d="M14 0H0V14" className="ken-visual-grid-line" />
          </pattern>
        </defs>

        <rect x="2.5" y="2.5" width="215" height="127" rx="22" className="ken-visual-shell" />
        <rect x="2.5" y="2.5" width="215" height="127" rx="22" fill={`url(#${glowId})`} />
        <rect x="12" y="12" width="196" height="108" rx="17" fill={`url(#${gridId})`} className="ken-visual-grid" />
        <path className="ken-visual-ribbon" d={`M17 ${86 + hashUnit(seed, 12) * 10}C55 62 87 57 123 70c29 10 53 2 80-24`} />
        <path className="ken-visual-ribbon is-secondary" d={`M18 ${57 + hashUnit(seed, 13) * 8}c39-19 75-18 109 0c26 13 49 13 72-1`} />

        <g className="ken-visual-node-field">
          {nodes.slice(1).map((node, index) => {
            const previous = nodes[index];
            return <line key={`line-${index}`} x1={previous.x} y1={previous.y} x2={node.x} y2={node.y} />;
          })}
          {nodes.map((node, index) => (
            <circle
              key={`node-${index}`}
              cx={node.x}
              cy={node.y}
              r={node.r}
              className={`tone-${node.tone}`}
              opacity={node.opacity}
            />
          ))}
        </g>

        <DomainMotif slug={task.categorySlug} gradientId={gradientId} />

        <g className="ken-visual-stage">
          <path d="M43 110H181" />
          <path d={`M43 110H${43 + progress * 138}`} className="is-progress" />
          {Array.from({ length: checkpoints }).map((_, index) => {
            const x = 43 + (index * 138) / Math.max(1, checkpoints - 1);
            return (
              <g key={index} className={index < completedCheckpoints ? "is-complete" : ""}>
                <circle cx={x} cy="110" r="5.2" />
                {index < completedCheckpoints ? <path d={`M${x - 2.5} 110l1.9 2.1l3.4-4`} /> : null}
              </g>
            );
          })}
        </g>

        <g className="ken-visual-status" transform={`translate(${statusX} 0)`}>
          <circle cx="0" cy="29" r="13.2" />
          <StatusMark stage={task.stage} x={0} />
        </g>

        <g className="ken-visual-progress-dial" transform="translate(186 35)">
          <circle r="18" />
          <circle
            r="18"
            className="is-progress"
            strokeDasharray={`${Math.max(6, progress * arcLength)} ${arcLength}`}
            transform="rotate(-90)"
          />
          <text y="4">{Math.round(progress * 100)}</text>
        </g>

        <g className="ken-visual-pulse-meter" transform="translate(169 79)">
          <path d="M0 26V0" />
          <path d={`M0 26V${26 - pulseIntensity * 26}`} className="is-hot" />
          <circle cy={26 - pulseIntensity * 26} r="4" />
        </g>

        {task.sandboxCapitalUsd > 0 ? <text x="18" y="27" className="ken-visual-sandbox">Sandbox demo</text> : null}
        <text x="18" y="118" className="ken-visual-lane">{TIER_LABELS[task.allocatedTier]}</text>
      </svg>
      <div className="ken-visual-meta" aria-hidden="true">
        <span><i className="ken-visual-meta-dot is-category" />{task.categoryName}</span>
        <span><i className="ken-visual-meta-dot is-stage" />{completionLabel(task)}</span>
        <span><i className="ken-visual-meta-dot is-pulse" />{pulseLabel(task.taskPulseScore)} pulse</span>
      </div>
    </div>
  );
}
