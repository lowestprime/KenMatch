import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  CATEGORY_PROPOSAL_FIELD_CONSTRAINTS,
  CATEGORY_PROPOSAL_REQUIRED_FIELDS,
  KEN_PROPOSAL_FIELD_CONSTRAINTS,
  KEN_PROPOSAL_REQUIRED_FIELDS,
  nativeTextFieldProps,
} from "../src/lib/proposal-constraints.ts";
import {
  categoryProposalSchema,
  proposalSchema,
} from "../src/lib/proposal-validation.ts";

function issueFields(result: ReturnType<typeof proposalSchema.safeParse>) {
  return result.success ? [] : [...new Set(result.error.issues.map((issue) => String(issue.path[0])))].sort();
}

test("category proposal native constraints match the server schema boundary", () => {
  assert.deepEqual(CATEGORY_PROPOSAL_REQUIRED_FIELDS, ["name", "description", "publicBenefit", "exampleKens"]);
  for (const [name, constraint] of Object.entries(CATEGORY_PROPOSAL_FIELD_CONSTRAINTS)) {
    const props = nativeTextFieldProps("category-proposal", name, constraint, "Required");
    assert.equal(props.required, true);
    assert.equal(props.minLength, constraint.minLength);
    assert.equal(props.maxLength, constraint.maxLength);
    assert.equal(props["aria-invalid"], true);
    assert.equal(props["aria-describedby"], `${props.id}-error`);
  }

  const empty = categoryProposalSchema.safeParse({ name: "", description: "", publicBenefit: "", exampleKens: "" });
  assert.equal(empty.success, false);
  if (!empty.success) {
    assert.deepEqual(
      [...new Set(empty.error.issues.map((issue) => String(issue.path[0])))].sort(),
      [...CATEGORY_PROPOSAL_REQUIRED_FIELDS].sort(),
    );
  }
  assert.equal(categoryProposalSchema.safeParse({
    name: "Evidence Review",
    description: "A".repeat(CATEGORY_PROPOSAL_FIELD_CONSTRAINTS.description.minLength),
    publicBenefit: "B".repeat(CATEGORY_PROPOSAL_FIELD_CONSTRAINTS.publicBenefit.minLength),
    exampleKens: "Evidence map alpha\nEvidence map beta",
  }).success, true);
  assert.equal(categoryProposalSchema.safeParse({
    name: "Evidence Review",
    description: "A".repeat(CATEGORY_PROPOSAL_FIELD_CONSTRAINTS.description.maxLength + 1),
    publicBenefit: "B".repeat(CATEGORY_PROPOSAL_FIELD_CONSTRAINTS.publicBenefit.minLength),
    exampleKens: "Evidence map alpha\nEvidence map beta",
  }).success, false);
});

test("Ken proposal native constraints and server fallback cover every required field", () => {
  assert.equal(KEN_PROPOSAL_REQUIRED_FIELDS[0], "title");
  for (const [name, constraint] of Object.entries(KEN_PROPOSAL_FIELD_CONSTRAINTS)) {
    const props = nativeTextFieldProps("ken-proposal", name, constraint);
    assert.equal(props.required, true);
    assert.equal(props.minLength, constraint.minLength);
    assert.equal(props["aria-invalid"], undefined);
  }

  const empty = proposalSchema.safeParse(Object.fromEntries(KEN_PROPOSAL_REQUIRED_FIELDS.map((field) => [field, ""])));
  assert.equal(empty.success, false);
  assert.deepEqual(issueFields(empty), [...KEN_PROPOSAL_REQUIRED_FIELDS].sort());

  const valid = {
    title: "Auditable reliability benchmark",
    categorySlug: "safety",
    requestedTier: "weeks",
    summary: "S".repeat(KEN_PROPOSAL_FIELD_CONSTRAINTS.summary.minLength),
    problem: "P".repeat(KEN_PROPOSAL_FIELD_CONSTRAINTS.problem.minLength),
    whyNow: "W".repeat(KEN_PROPOSAL_FIELD_CONSTRAINTS.whyNow.minLength),
    publicBenefit: "B".repeat(KEN_PROPOSAL_FIELD_CONSTRAINTS.publicBenefit.minLength),
    deliverables: "D".repeat(KEN_PROPOSAL_FIELD_CONSTRAINTS.deliverables.minLength),
    evaluationCriteria: "E".repeat(KEN_PROPOSAL_FIELD_CONSTRAINTS.evaluationCriteria.minLength),
    riskFlags: "R".repeat(KEN_PROPOSAL_FIELD_CONSTRAINTS.riskFlags.minLength),
    evidence: "V".repeat(KEN_PROPOSAL_FIELD_CONSTRAINTS.evidence.minLength),
    enterprisePackaging: "I".repeat(KEN_PROPOSAL_FIELD_CONSTRAINTS.enterprisePackaging.minLength),
    dataValueNote: "C".repeat(KEN_PROPOSAL_FIELD_CONSTRAINTS.dataValueNote.minLength),
  };
  assert.equal(proposalSchema.safeParse(valid).success, true);
});

test("proposal forms wire native semantics and server parsing before product mutation", () => {
  const categoryForm = readFileSync(new URL("../src/components/category-proposal-form.tsx", import.meta.url), "utf8");
  const kenForm = readFileSync(new URL("../src/components/proposal-form.tsx", import.meta.url), "utf8");
  const actions = readFileSync(new URL("../src/app/actions.ts", import.meta.url), "utf8");

  assert.match(categoryForm, /nativeTextFieldProps\("category-proposal"/);
  assert.match(kenForm, /nativeTextFieldProps\("ken-proposal"/);
  assert.match(kenForm, /name="categorySlug"[\s\S]*?required/);
  assert.match(kenForm, /name="requestedTier"[\s\S]*?required/);
  assert.match(categoryForm, /role="alert"/);
  assert.match(kenForm, /aria-describedby/);

  const kenAction = actions.slice(actions.indexOf("export async function createProposalAction"), actions.indexOf("export async function createCategoryProposalAction"));
  const categoryAction = actions.slice(actions.indexOf("export async function createCategoryProposalAction"));
  assert.ok(kenAction.indexOf("proposalSchema.safeParse") < kenAction.indexOf("await createProposal("));
  assert.ok(categoryAction.indexOf("categoryProposalSchema.safeParse") < categoryAction.indexOf("await createCategoryProposal("));
});
