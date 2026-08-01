import { z } from "zod";

import {
  CATEGORY_PROPOSAL_FIELD_CONSTRAINTS,
  KEN_PROPOSAL_FIELD_CONSTRAINTS,
} from "./proposal-constraints.ts";

const category = CATEGORY_PROPOSAL_FIELD_CONSTRAINTS;
const ken = KEN_PROPOSAL_FIELD_CONSTRAINTS;

export const proposalSchema = z.object({
  title: z.string().min(ken.title.minLength, "Give the Ken a specific title."),
  categorySlug: z.string().min(1, "Choose a category."),
  summary: z.string().min(ken.summary.minLength, "Summarize what the Ken will produce in one or two clear sentences."),
  problem: z.string().min(ken.problem.minLength, "Describe the bottleneck or unmet need."),
  whyNow: z.string().min(ken.whyNow.minLength, "Explain why this Ken matters now."),
  publicBenefit: z.string().min(ken.publicBenefit.minLength, "Describe the public, community, or ecosystem upside."),
  requestedTier: z.enum(["days", "weeks", "months"]),
  deliverables: z.string().min(ken.deliverables.minLength, "List at least one deliverable."),
  evaluationCriteria: z.string().min(ken.evaluationCriteria.minLength, "List at least one evaluation check."),
  riskFlags: z.string().min(ken.riskFlags.minLength, "List at least one risk or operating constraint."),
  evidence: z.string().min(ken.evidence.minLength, "List at least one evidence source or anchor."),
  enterprisePackaging: z.string().min(ken.enterprisePackaging.minLength, "Explain the optional service or institutional packaging path."),
  dataValueNote: z.string().min(ken.dataValueNote.minLength, "Explain what corrections, provenance, or evaluation data this Ken could generate."),
});

export const categoryProposalSchema = z.object({
  name: z.string()
    .min(category.name.minLength, "Give the category a clear name.")
    .max(category.name.maxLength, "Keep the category name short."),
  description: z.string()
    .min(category.description.minLength, "Describe the category clearly enough for public review.")
    .max(category.description.maxLength),
  publicBenefit: z.string()
    .min(category.publicBenefit.minLength, "Explain the public or community value.")
    .max(category.publicBenefit.maxLength),
  exampleKens: z.string()
    .min(category.exampleKens.minLength, "List at least two example Kens this category would contain.")
    .max(category.exampleKens.maxLength)
    .refine(
      (value) => new Set(
        value.split(/\r?\n/).map((line) => line.trim().toLowerCase()).filter(Boolean),
      ).size >= 2,
      "List at least two distinct example Kens.",
    ),
});
