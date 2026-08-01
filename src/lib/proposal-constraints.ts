export interface TextFieldConstraint {
  minLength: number;
  maxLength?: number;
}

export const CATEGORY_PROPOSAL_FIELD_CONSTRAINTS = {
  name: { minLength: 4, maxLength: 80 },
  description: { minLength: 60, maxLength: 800 },
  publicBenefit: { minLength: 60, maxLength: 800 },
  exampleKens: { minLength: 20, maxLength: 1200 },
} as const satisfies Record<string, TextFieldConstraint>;

export const CATEGORY_PROPOSAL_REQUIRED_FIELDS = [
  "name",
  "description",
  "publicBenefit",
  "exampleKens",
] as const;

export const KEN_PROPOSAL_FIELD_CONSTRAINTS = {
  title: { minLength: 8 },
  summary: { minLength: 30 },
  problem: { minLength: 40 },
  whyNow: { minLength: 30 },
  publicBenefit: { minLength: 30 },
  deliverables: { minLength: 10 },
  evaluationCriteria: { minLength: 10 },
  riskFlags: { minLength: 10 },
  evidence: { minLength: 10 },
  enterprisePackaging: { minLength: 20 },
  dataValueNote: { minLength: 20 },
} as const satisfies Record<string, TextFieldConstraint>;

export const KEN_PROPOSAL_REQUIRED_FIELDS = [
  "title",
  "categorySlug",
  "requestedTier",
  "summary",
  "problem",
  "whyNow",
  "publicBenefit",
  "deliverables",
  "evaluationCriteria",
  "riskFlags",
  "evidence",
  "enterprisePackaging",
  "dataValueNote",
] as const;

export function nativeTextFieldProps(
  formId: string,
  name: string,
  constraint: TextFieldConstraint,
  error?: string,
) {
  const id = `${formId}-${name}`;
  return {
    id,
    name,
    required: true,
    minLength: constraint.minLength,
    maxLength: constraint.maxLength,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error ? `${id}-error` : undefined,
  } as const;
}
