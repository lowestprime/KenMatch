import type { RequestedTier } from "./types.ts";

export type IntakeCheckLevel = "pass" | "warning" | "attention";

export interface IntakeCheck {
  id: string;
  label: string;
  level: IntakeCheckLevel;
  detail: string;
}

export interface SimilarityHint {
  id: string;
  label: string;
  score: number;
}

export interface CategoryIntakeInput {
  name: string;
  description: string;
  publicBenefit: string;
  exampleKens: string[];
}

export interface CategoryIntakeReference {
  id: string;
  name: string;
  description?: string;
}

export interface CategoryIntakeResult {
  version: 1;
  outcome: "ready" | "review";
  checks: IntakeCheck[];
  similarityHints: SimilarityHint[];
  normalizedName: string;
  normalizedSlug: string;
}

export interface KenIntakeInput {
  title: string;
  summary: string;
  problem: string;
  whyNow: string;
  publicBenefit: string;
  deliverables: string[];
  evaluationCriteria: string[];
  riskFlags: string[];
  evidence: string[];
  requestedTier: RequestedTier;
}

export interface KenIntakeReference {
  id: string;
  title: string;
  summary?: string;
}

export interface KenIntakeResult {
  version: 1;
  outcome: "ready" | "review" | "high-risk";
  checks: IntakeCheck[];
  similarityHints: SimilarityHint[];
  estimatedTier: RequestedTier;
  scopeMismatch: boolean;
  highRisk: boolean;
}

const HIGH_RISK_TERMS = [
  "biological",
  "bioweapon",
  "chemical synthesis",
  "clinical decision",
  "critical infrastructure",
  "exploit",
  "financial trading",
  "genetic engineering",
  "malware",
  "medical diagnosis",
  "personal data",
  "private data",
  "production access",
  "surveillance",
  "weapon",
];

const PUBLIC_BENEFIT_TERMS = [
  "access",
  "audit",
  "community",
  "public",
  "open",
  "shared",
  "safety",
  "reproduc",
  "transparent",
];

function compactWhitespace(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export function normalizeReviewText(value: string) {
  return compactWhitespace(value)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, " ");
}

export function normalizedReviewSlug(value: string) {
  return normalizeReviewText(value)
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function tokens(value: string) {
  return new Set(
    normalizeReviewText(value)
      .split(/[\s-]+/)
      .filter((token) => token.length > 2),
  );
}

export function textSimilarity(left: string, right: string) {
  const leftTokens = tokens(left);
  const rightTokens = tokens(right);
  if (leftTokens.size === 0 || rightTokens.size === 0) return 0;
  let intersection = 0;
  for (const token of leftTokens) {
    if (rightTokens.has(token)) intersection += 1;
  }
  const union = new Set([...leftTokens, ...rightTokens]).size;
  return Math.round((intersection / union) * 1000) / 1000;
}

function similarityHints(
  label: string,
  references: Array<{ id: string; label: string; context?: string }>,
) {
  return references
    .map((reference) => ({
      id: reference.id,
      label: reference.label,
      score: Math.max(
        textSimilarity(label, reference.label),
        textSimilarity(label, `${reference.label} ${reference.context ?? ""}`),
      ),
    }))
    .filter((hint) => hint.score >= 0.3)
    .sort((left, right) => right.score - left.score || left.id.localeCompare(right.id))
    .slice(0, 3);
}

function includesAny(value: string, terms: string[]) {
  const normalized = normalizeReviewText(value);
  return terms.some((term) => normalized.includes(term));
}

function check(
  id: string,
  label: string,
  condition: boolean,
  passDetail: string,
  failureDetail: string,
  failureLevel: Exclude<IntakeCheckLevel, "pass"> = "warning",
): IntakeCheck {
  return {
    id,
    label,
    level: condition ? "pass" : failureLevel,
    detail: condition ? passDetail : failureDetail,
  };
}

export function evaluateCategoryIntake(
  input: CategoryIntakeInput,
  references: CategoryIntakeReference[] = [],
): CategoryIntakeResult {
  const name = compactWhitespace(input.name);
  const description = compactWhitespace(input.description);
  const publicBenefit = compactWhitespace(input.publicBenefit);
  const examples = input.exampleKens.map(compactWhitespace).filter(Boolean);
  const hints = similarityHints(
    name,
    references.map((reference) => ({
      id: reference.id,
      label: reference.name,
      context: reference.description,
    })),
  );
  const benefitSpecific =
    publicBenefit.length >= 80
    && (includesAny(publicBenefit, PUBLIC_BENEFIT_TERMS) || publicBenefit.split(/\s+/).length >= 18);
  const boundarySpecific =
    description.length >= 80
    && !/^(misc|miscellaneous|other|general|everything|anything)$/i.test(name);
  const examplesDistinct = new Set(examples.map(normalizeReviewText)).size >= 2;
  const checks = [
    check(
      "category-boundary",
      "Category boundary",
      boundarySpecific,
      "The description is specific enough for a human reviewer to assess the category boundary.",
      "Clarify what belongs in this category and what does not.",
      "attention",
    ),
    check(
      "public-benefit",
      "Public benefit",
      benefitSpecific,
      "The proposal describes a concrete public or community benefit.",
      "Make the public benefit more concrete and reviewable.",
      "attention",
    ),
    check(
      "examples",
      "Examples",
      examplesDistinct,
      "At least two distinct example Kens are present.",
      "Provide at least two distinct example Kens.",
      "attention",
    ),
    check(
      "duplicate-scan",
      "Similarity scan",
      hints.length === 0,
      "No close category name or description match was detected.",
      `Review possible overlap with ${hints.map((hint) => hint.label).join(", ")}.`,
    ),
    check(
      "safety-language",
      "Safety review",
      !includesAny(`${description} ${publicBenefit} ${examples.join(" ")}`, HIGH_RISK_TERMS),
      "No high-risk term triggered the deterministic intake scan.",
      "Potentially sensitive scope requires explicit human safety review.",
      "attention",
    ),
  ];

  return {
    version: 1,
    outcome: checks.some((item) => item.level === "attention") ? "review" : "ready",
    checks,
    similarityHints: hints,
    normalizedName: normalizeReviewText(name),
    normalizedSlug: normalizedReviewSlug(name),
  };
}

function estimatedTierFor(input: KenIntakeInput): RequestedTier {
  let scope = 0;
  scope += Math.min(input.deliverables.length, 5);
  scope += Math.min(input.evaluationCriteria.length, 5);
  scope += Math.min(input.evidence.length, 4);
  scope += Math.ceil(
    [
      input.summary,
      input.problem,
      input.whyNow,
      input.publicBenefit,
      ...input.deliverables,
      ...input.evaluationCriteria,
    ].join(" ").length / 900,
  );
  if (scope >= 13) return "months";
  if (scope >= 8) return "weeks";
  return "days";
}

export function evaluateKenIntake(
  input: KenIntakeInput,
  references: KenIntakeReference[] = [],
): KenIntakeResult {
  const estimatedTier = estimatedTierFor(input);
  const highRisk = includesAny(
    `${input.title} ${input.summary} ${input.problem} ${input.publicBenefit} ${input.riskFlags.join(" ")}`,
    HIGH_RISK_TERMS,
  );
  const hints = similarityHints(
    input.title,
    references.map((reference) => ({
      id: reference.id,
      label: reference.title,
      context: reference.summary,
    })),
  );
  const scopeMismatch = estimatedTier !== input.requestedTier;
  const checks = [
    check(
      "deliverables",
      "Deliverable readiness",
      input.deliverables.length >= 2 && input.deliverables.every((item) => compactWhitespace(item).length >= 8),
      "The submission names multiple concrete deliverables.",
      "Add at least two concrete, reviewable deliverables.",
      "attention",
    ),
    check(
      "evaluation",
      "Evaluation readiness",
      input.evaluationCriteria.length >= 2 && input.evaluationCriteria.every((item) => compactWhitespace(item).length >= 8),
      "The submission names multiple evaluation checks.",
      "Add at least two observable acceptance or evaluation checks.",
      "attention",
    ),
    check(
      "public-benefit",
      "Public benefit",
      compactWhitespace(input.publicBenefit).length >= 80,
      "The public-benefit case is detailed enough for review.",
      "Expand who benefits and how the result remains publicly useful.",
      "attention",
    ),
    check(
      "evidence",
      "Evidence anchors",
      input.evidence.length >= 1 && input.evidence.some((item) => compactWhitespace(item).length >= 10),
      "At least one evidence anchor is present.",
      "Add a source, dataset, benchmark, prior result, or other evidence anchor.",
      "attention",
    ),
    check(
      "duplicate-scan",
      "Similarity scan",
      hints.length === 0,
      "No close existing Ken match was detected.",
      `Review possible overlap with ${hints.map((hint) => hint.label).join(", ")}.`,
    ),
    check(
      "lane-estimate",
      "Lane estimate",
      !scopeMismatch,
      `Requested ${input.requestedTier}; deterministic scope estimate also suggests ${estimatedTier}.`,
      `Requested ${input.requestedTier}; deterministic scope estimate suggests ${estimatedTier}. A reviewer decides the lane.`,
    ),
    check(
      "risk-scan",
      "Risk scan",
      !highRisk,
      "No high-risk term triggered the deterministic intake scan.",
      "Potentially high-impact or sensitive scope requires a second independent approval.",
      "attention",
    ),
  ];
  const attention = checks.some((item) => item.level === "attention");

  return {
    version: 1,
    outcome: highRisk ? "high-risk" : attention ? "review" : "ready",
    checks,
    similarityHints: hints,
    estimatedTier,
    scopeMismatch,
    highRisk,
  };
}

export function parseIntakeResult<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}
