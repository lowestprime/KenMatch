import fs from "node:fs";

import {
  assertCoveragePlanIdentity,
  coverageBindingsMatch,
  coverageCaptureKeys,
  coveragePlanBinding,
} from "./plan-identity.js";
import type { CoveragePlan, RunManifest } from "./types.js";
import { readJson, writeJsonAtomic } from "./util.js";

interface CoverageTransitionJournal {
  schemaVersion: 1;
  runId: string;
  plan: CoveragePlan;
  manifest: RunManifest;
}

function assertJournal(journal: CoverageTransitionJournal) {
  if (journal.schemaVersion !== 1) throw new Error("Coverage transition journal schema is invalid.");
  assertCoveragePlanIdentity(journal.plan);
  if (journal.runId !== journal.plan.runId || journal.runId !== journal.manifest.runId) {
    throw new Error("Coverage transition journal run identity is inconsistent.");
  }
  if (
    !journal.manifest.coveragePlan
    || !coverageBindingsMatch(journal.manifest.coveragePlan, coveragePlanBinding(journal.plan))
  ) {
    throw new Error("Coverage transition journal manifest binding is inconsistent.");
  }
}

function assertManifestFitsPlan(manifest: RunManifest, plan: CoveragePlan) {
  const expectedKeys = new Set(coverageCaptureKeys(plan));
  const captureKeys = manifest.captures.map((capture) => capture.key);
  const completedKeys = manifest.completedKeys;
  if (new Set(captureKeys).size !== captureKeys.length || new Set(completedKeys).size !== completedKeys.length) {
    throw new Error("Cannot persist duplicate capture checkpoints.");
  }
  if (
    captureKeys.some((key) => !expectedKeys.has(key))
    || completedKeys.some((key) => !expectedKeys.has(key))
  ) {
    throw new Error("Cannot persist a coverage plan that excludes completed capture keys.");
  }
  if (
    captureKeys.length !== completedKeys.length
    || captureKeys.some((key) => !completedKeys.includes(key))
  ) {
    throw new Error("Manifest captures and completed keys are inconsistent.");
  }
}

function assertCoverageTransition(previous: RunManifest["coveragePlan"], next: RunManifest["coveragePlan"]) {
  if (!previous) throw new Error("Manifest is missing its coverage-plan binding.");
  if (coverageBindingsMatch(previous, next)) return;
  if (previous.phase === "converged") {
    throw new Error("A converged coverage plan cannot be replaced within the same run.");
  }
  if (previous.seedCaptureCount !== next.seedCaptureCount) {
    throw new Error("Coverage seed capture count cannot change during convergence.");
  }
  if (next.expectedCaptureCount < previous.expectedCaptureCount) {
    throw new Error("Coverage target count cannot shrink during convergence.");
  }
  const validInitialTransition = previous.phase === "initial"
    && next.phase === "converging"
    && next.convergenceIterations === 1;
  const validExpansion = previous.phase === "converging"
    && next.phase === "converging"
    && next.convergenceIterations === previous.convergenceIterations + 1;
  const validCompletion = previous.phase === "converging"
    && next.phase === "converged"
    && next.convergenceIterations === previous.convergenceIterations;
  if (!validInitialTransition && !validExpansion && !validCompletion) {
    throw new Error(
      `Invalid coverage transition ${previous.phase}:${previous.convergenceIterations} -> ${next.phase}:${next.convergenceIterations}.`,
    );
  }
}

export function persistCoveragePlanState(input: {
  planFile: string;
  manifestFile: string;
  journalFile: string;
  plan: CoveragePlan;
  manifest: RunManifest;
}) {
  assertCoveragePlanIdentity(input.plan);
  if (input.plan.runId !== input.manifest.runId) {
    throw new Error("Cannot persist a coverage plan for a different run.");
  }
  const binding = coveragePlanBinding(input.plan);
  assertCoverageTransition(input.manifest.coveragePlan, binding);
  if (fs.existsSync(input.planFile)) {
    const previousPlan = readJson<CoveragePlan>(input.planFile);
    assertCoveragePlanIdentity(previousPlan);
    if (
      !input.manifest.coveragePlan
      || !coverageBindingsMatch(input.manifest.coveragePlan, coveragePlanBinding(previousPlan))
    ) {
      throw new Error("Persisted coverage plan does not match the manifest transition origin.");
    }
    const nextKeys = new Set(coverageCaptureKeys(input.plan));
    const replacedKey = coverageCaptureKeys(previousPlan).find((key) => !nextKeys.has(key));
    if (replacedKey) {
      throw new Error(`Coverage target keys cannot be replaced during convergence; first=${replacedKey}.`);
    }
  }
  assertManifestFitsPlan(input.manifest, input.plan);
  const manifest = {
    ...input.manifest,
    coveragePlan: binding,
  };
  const journal: CoverageTransitionJournal = {
    schemaVersion: 1,
    runId: input.plan.runId,
    plan: input.plan,
    manifest,
  };
  writeJsonAtomic(input.journalFile, journal);
  writeJsonAtomic(input.planFile, input.plan);
  writeJsonAtomic(input.manifestFile, manifest);
  fs.rmSync(input.journalFile, { force: true });
  return manifest;
}

export function recoverCoveragePlanState(input: {
  planFile: string;
  manifestFile: string;
  journalFile: string;
  validate?: (manifest: RunManifest, plan: CoveragePlan) => void;
}) {
  if (!fs.existsSync(input.journalFile)) return false;
  const journal = readJson<CoverageTransitionJournal>(input.journalFile);
  assertJournal(journal);
  input.validate?.(journal.manifest, journal.plan);
  writeJsonAtomic(input.planFile, journal.plan);
  writeJsonAtomic(input.manifestFile, journal.manifest);
  fs.rmSync(input.journalFile, { force: true });
  return true;
}
