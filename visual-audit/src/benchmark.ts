import path from "node:path";
import { pathToFileURL } from "node:url";

import sharp from "sharp";

import {
  assertCoveragePlanIdentity,
  coverageBindingsMatch,
  coverageCaptureKeys,
  coveragePlanBinding,
} from "./plan-identity.js";
import type {
  CaptureRecord,
  CoveragePlan,
  DiagnosticRecord,
  RunManifest,
} from "./types.js";
import { fileSha256, readJson, sha256, writeJsonAtomic } from "./util.js";

export interface BenchmarkObservation {
  workers: number;
  durationMs: number;
  runId: string;
  manifestFile: string;
  planFile: string;
}

export interface BenchmarkInput {
  schemaVersion: 1;
  benchmarkId: string;
  expectedCommit: string;
  acceleratorRecord: string;
  requiredWorkerCounts: number[];
  observations: BenchmarkObservation[];
}

interface EvaluatedObservation extends BenchmarkObservation {
  passed: boolean;
  errors: string[];
  planDigest: string;
  targetKeysDigest: string;
  expectedCaptureCount: number;
  captureEquivalenceDigest: string;
  imageEquivalenceDigest: string;
  imageComparison: ImageComparisonSummary | null;
  diagnosticEquivalenceDigest: string;
  securityDigest: string;
  sourceEvidenceDigest: string;
  speedupVersusOne: number | null;
}

interface ImageComparisonSummary {
  exactDigestMatch: boolean;
  pixelEquivalent: boolean;
  comparedCaptures: number;
  differingCaptures: number;
  changedPixels: number;
  maxChannelDelta: number;
  rendererNoiseCaptureKeys: string[];
  nonEquivalentCaptureKeys: string[];
  errors: string[];
}

const MAX_RENDERER_NOISE_PIXELS_PER_CAPTURE = 8;
const MAX_RENDERER_NOISE_CHANNEL_DELTA = 1;

export interface BenchmarkResult {
  schemaVersion: 1;
  benchmarkId: string;
  expectedCommit: string;
  acceleratorRecord: string;
  passed: boolean;
  selectedWorkers: number | null;
  observations: EvaluatedObservation[];
  errors: string[];
}

function uniqueSortedNumbers(values: number[]) {
  return [...new Set(values)].sort((left, right) => left - right);
}

function sameNumbers(left: number[], right: number[]) {
  const normalizedLeft = uniqueSortedNumbers(left);
  const normalizedRight = uniqueSortedNumbers(right);
  return normalizedLeft.length === normalizedRight.length
    && normalizedLeft.every((value, index) => value === normalizedRight[index]);
}

function normalizedCapture(capture: CaptureRecord) {
  return {
    key: capture.key,
    route: capture.route,
    finalUrl: capture.finalUrl,
    status: capture.status,
    auth: capture.auth,
    theme: capture.theme,
    viewport: capture.viewport,
    state: capture.state,
    coverageTier: capture.coverageTier,
    sensitive: capture.sensitive,
    stitchedFile: capture.stitchedFile,
    tileManifestFile: capture.tileManifestFile,
    width: capture.width,
    height: capture.height,
    deviceScaleFactor: capture.deviceScaleFactor,
    pageHeight: capture.pageHeight,
    contentDigest: capture.contentDigest,
    accessibility: {
      ...capture.accessibility,
      seriousViolations: [...capture.accessibility.seriousViolations].sort(),
    },
    discoveredLinks: [...capture.discoveredLinks].sort(),
    assetUrls: [...capture.assetUrls].sort(),
  };
}

function normalizedDiagnostic(diagnostic: DiagnosticRecord) {
  return {
    route: diagnostic.route,
    captureKey: diagnostic.captureKey,
    kind: diagnostic.kind,
    severity: diagnostic.severity,
    message: diagnostic.message,
    expected: diagnostic.expected,
  };
}

function exactImageComparison(comparedCaptures: number): ImageComparisonSummary {
  return {
    exactDigestMatch: true,
    pixelEquivalent: true,
    comparedCaptures,
    differingCaptures: 0,
    changedPixels: 0,
    maxChannelDelta: 0,
    rendererNoiseCaptureKeys: [],
    nonEquivalentCaptureKeys: [],
    errors: [],
  };
}

async function compareObservationImages(
  reference: BenchmarkObservation,
  candidate: BenchmarkObservation,
): Promise<ImageComparisonSummary> {
  const referenceManifest = readJson<RunManifest>(reference.manifestFile);
  const candidateManifest = readJson<RunManifest>(candidate.manifestFile);
  const candidateByKey = new Map(candidateManifest.captures.map((capture) => [capture.key, capture]));
  const referenceRoot = path.dirname(reference.manifestFile);
  const candidateRoot = path.dirname(candidate.manifestFile);
  const summary = exactImageComparison(referenceManifest.captures.length);

  for (const referenceCapture of referenceManifest.captures) {
    const candidateCapture = candidateByKey.get(referenceCapture.key);
    if (!candidateCapture) {
      summary.pixelEquivalent = false;
      summary.nonEquivalentCaptureKeys.push(referenceCapture.key);
      summary.errors.push(`${referenceCapture.key}: candidate image is missing`);
      continue;
    }
    const referenceFile = path.join(referenceRoot, referenceCapture.stitchedFile);
    const candidateFile = path.join(candidateRoot, candidateCapture.stitchedFile);
    if (fileSha256(referenceFile) === fileSha256(candidateFile)) continue;

    summary.exactDigestMatch = false;
    summary.differingCaptures += 1;
    try {
      const [left, right] = await Promise.all([
        sharp(referenceFile).ensureAlpha().raw().toBuffer({ resolveWithObject: true }),
        sharp(candidateFile).ensureAlpha().raw().toBuffer({ resolveWithObject: true }),
      ]);
      if (
        left.info.width !== right.info.width
        || left.info.height !== right.info.height
        || left.info.channels !== right.info.channels
      ) {
        summary.pixelEquivalent = false;
        summary.nonEquivalentCaptureKeys.push(referenceCapture.key);
        summary.errors.push(`${referenceCapture.key}: decoded image dimensions differ`);
        continue;
      }

      let changedPixels = 0;
      let maxChannelDelta = 0;
      for (let offset = 0; offset < left.data.length; offset += left.info.channels) {
        let pixelChanged = false;
        for (let channel = 0; channel < left.info.channels; channel += 1) {
          const delta = Math.abs((left.data[offset + channel] ?? 0) - (right.data[offset + channel] ?? 0));
          if (delta > 0) pixelChanged = true;
          if (delta > maxChannelDelta) maxChannelDelta = delta;
        }
        if (pixelChanged) changedPixels += 1;
      }
      summary.changedPixels += changedPixels;
      summary.maxChannelDelta = Math.max(summary.maxChannelDelta, maxChannelDelta);
      if (
        changedPixels <= MAX_RENDERER_NOISE_PIXELS_PER_CAPTURE
        && maxChannelDelta <= MAX_RENDERER_NOISE_CHANNEL_DELTA
      ) {
        summary.rendererNoiseCaptureKeys.push(referenceCapture.key);
      } else {
        summary.pixelEquivalent = false;
        summary.nonEquivalentCaptureKeys.push(referenceCapture.key);
        summary.errors.push(
          `${referenceCapture.key}: ${changedPixels} pixels changed with max channel delta ${maxChannelDelta}`,
        );
      }
    } catch (error) {
      summary.pixelEquivalent = false;
      summary.nonEquivalentCaptureKeys.push(referenceCapture.key);
      summary.errors.push(
        `${referenceCapture.key}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  return summary;
}

function evaluateObservation(
  input: BenchmarkInput,
  observation: BenchmarkObservation,
): EvaluatedObservation {
  const errors: string[] = [];
  let manifest: RunManifest | null = null;
  let plan: CoveragePlan | null = null;
  try {
    manifest = readJson<RunManifest>(observation.manifestFile);
    plan = readJson<CoveragePlan>(observation.planFile);
  } catch (error) {
    errors.push(`could not read archive: ${error instanceof Error ? error.message : String(error)}`);
  }

  let planDigest = "";
  let targetKeysDigest = "";
  let expectedCaptureCount = 0;
  let captureEquivalenceDigest = "";
  let imageEquivalenceDigest = "";
  let diagnosticEquivalenceDigest = "";
  let securityDigest = "";
  let sourceEvidenceDigest = "";
  if (manifest && plan) {
    try {
      assertCoveragePlanIdentity(plan);
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
    }
    planDigest = plan.planDigest;
    targetKeysDigest = plan.targetKeysDigest;
    expectedCaptureCount = plan.expectedCaptureCount;
    if (manifest.runId !== observation.runId || plan.runId !== observation.runId) errors.push("run id mismatch");
    if (manifest.expectedCommit !== input.expectedCommit || plan.expectedCommit !== input.expectedCommit) errors.push("commit mismatch");
    if (manifest.acceleratorRecord !== input.acceleratorRecord || plan.acceleratorRecord !== input.acceleratorRecord) errors.push("accelerator mismatch");
    if (manifest.captureWorkers !== observation.workers) errors.push("worker provenance mismatch");
    if (manifest.completedAt === null) errors.push("manifest is incomplete");
    if (plan.phase !== "converged") errors.push(`coverage phase is ${plan.phase}`);
    if (!coverageBindingsMatch(manifest.coveragePlan, coveragePlanBinding(plan))) errors.push("coverage binding mismatch");
    if (!Number.isSafeInteger(observation.durationMs) || observation.durationMs <= 0) errors.push("invalid capture duration");

    const expectedKeys = coverageCaptureKeys(plan);
    const captureKeys = manifest.captures.map((capture) => capture.key);
    const completedKeys = manifest.completedKeys;
    if (new Set(captureKeys).size !== captureKeys.length) errors.push("duplicate capture keys");
    if (new Set(completedKeys).size !== completedKeys.length) errors.push("duplicate completed keys");
    if (JSON.stringify(captureKeys) !== JSON.stringify([...captureKeys].sort())) errors.push("capture records are not canonical");
    if (JSON.stringify(completedKeys) !== JSON.stringify([...completedKeys].sort())) errors.push("completed keys are not canonical");
    if (JSON.stringify(captureKeys) !== JSON.stringify(expectedKeys)) errors.push("capture target set mismatch");
    if (JSON.stringify(completedKeys) !== JSON.stringify(expectedKeys)) errors.push("completed target set mismatch");
    if (manifest.diagnostics.some((entry) => entry.severity === "serious" && !entry.expected)) {
      errors.push("unexpected serious diagnostics");
    }
    if (manifest.security.successfulUnsafeRequests !== 0) errors.push("successful unsafe request");
    if (manifest.security.blockedUnsafeRequests < 1) errors.push("missing unsafe-request guard proof");
    if (!manifest.security.telemetrySuppressed) errors.push("telemetry was not suppressed");
    if (manifest.sourceEvidence.sourceUnchanged !== true || manifest.sourceEvidence.cleanupComplete !== true) {
      errors.push("snapshot source or cleanup proof failed");
    }

    captureEquivalenceDigest = sha256(JSON.stringify(
      manifest.captures.map(normalizedCapture),
    ));
    try {
      const runRoot = path.dirname(observation.manifestFile);
      imageEquivalenceDigest = sha256(JSON.stringify(manifest.captures.map((capture) => ({
        key: capture.key,
        sha256: fileSha256(path.join(runRoot, capture.stitchedFile)),
      }))));
    } catch (error) {
      errors.push(`could not hash stitched captures: ${error instanceof Error ? error.message : String(error)}`);
    }
    diagnosticEquivalenceDigest = sha256(JSON.stringify(
      manifest.diagnostics
        .map(normalizedDiagnostic)
        .sort((left, right) => JSON.stringify(left).localeCompare(JSON.stringify(right))),
    ));
    securityDigest = sha256(JSON.stringify(manifest.security));
    sourceEvidenceDigest = sha256(JSON.stringify(manifest.sourceEvidence));
  }

  return {
    ...observation,
    passed: errors.length === 0,
    errors,
    planDigest,
    targetKeysDigest,
    expectedCaptureCount,
    captureEquivalenceDigest,
    imageEquivalenceDigest,
    imageComparison: null,
    diagnosticEquivalenceDigest,
    securityDigest,
    sourceEvidenceDigest,
    speedupVersusOne: null,
  };
}

export async function evaluateBenchmark(input: BenchmarkInput): Promise<BenchmarkResult> {
  const errors: string[] = [];
  if (input.schemaVersion !== 1) errors.push("benchmark input schema mismatch");
  if (!sameNumbers(input.requiredWorkerCounts, input.observations.map((item) => item.workers))) {
    errors.push("worker observation set does not match required worker counts");
  }
  if (new Set(input.observations.map((item) => item.workers)).size !== input.observations.length) {
    errors.push("duplicate worker observations");
  }

  const observations = input.observations
    .map((observation) => evaluateObservation(input, observation))
    .sort((left, right) => left.workers - right.workers);
  const baseline = observations.find((observation) => observation.workers === 1);
  const equivalenceReference = observations.find((observation) => observation.passed);
  for (const observation of observations) {
    if (baseline && baseline.durationMs > 0) {
      observation.speedupVersusOne = Number((baseline.durationMs / observation.durationMs).toFixed(4));
    }
    if (!equivalenceReference || !observation.passed) continue;
    for (const field of [
      "planDigest",
      "targetKeysDigest",
      "expectedCaptureCount",
      "captureEquivalenceDigest",
      "diagnosticEquivalenceDigest",
      "securityDigest",
      "sourceEvidenceDigest",
    ] as const) {
      if (observation[field] !== equivalenceReference[field]) {
        observation.errors.push(`${field} differs from worker ${equivalenceReference.workers}`);
      }
    }
    if (observation.imageEquivalenceDigest === equivalenceReference.imageEquivalenceDigest) {
      observation.imageComparison = exactImageComparison(observation.expectedCaptureCount);
    } else {
      observation.imageComparison = await compareObservationImages(equivalenceReference, observation);
      if (!observation.imageComparison.pixelEquivalent) {
        observation.errors.push(
          `stitched images differ from worker ${equivalenceReference.workers}: ${observation.imageComparison.errors.join("; ")}`,
        );
      }
    }
    observation.passed = observation.errors.length === 0;
  }

  for (const observation of observations) {
    if (!observation.passed) {
      errors.push(`worker ${observation.workers}: ${observation.errors.join(", ")}`);
    }
  }
  const passing = observations.filter((observation) => observation.passed);
  const selected = passing.sort((left, right) => (
    left.durationMs - right.durationMs || left.workers - right.workers
  ))[0];
  return {
    schemaVersion: 1,
    benchmarkId: input.benchmarkId,
    expectedCommit: input.expectedCommit,
    acceleratorRecord: input.acceleratorRecord,
    passed: errors.length === 0 && passing.length === input.requiredWorkerCounts.length,
    selectedWorkers: errors.length === 0 ? selected?.workers ?? null : null,
    observations: observations.sort((left, right) => left.workers - right.workers),
    errors,
  };
}

async function main() {
  const inputFile = process.argv[2];
  const outputFile = process.argv[3];
  if (!inputFile || !outputFile) {
    throw new Error("Usage: node dist/benchmark.js <benchmark-input.json> <benchmark-result.json>");
  }
  const input = readJson<BenchmarkInput>(path.resolve(inputFile));
  const result = await evaluateBenchmark(input);
  writeJsonAtomic(path.resolve(outputFile), result);
  if (!result.passed) {
    throw new Error(`Benchmark failed: ${result.errors.join("; ")}`);
  }
  console.log(`Selected ${result.selectedWorkers} capture workers for ${result.benchmarkId}.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    await main();
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  }
}
