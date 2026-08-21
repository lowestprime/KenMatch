import type {
  CoveragePlan,
  CoveragePlanBinding,
  RouteTarget,
} from "./types.js";
import { safeKey, sha256 } from "./util.js";

type UnstampedCoveragePlan = Omit<CoveragePlan, "planDigest" | "targetKeysDigest">;

function uniqueSorted(values: string[]) {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}

function normalizedTarget(target: RouteTarget) {
  return {
    key: target.key,
    route: target.route,
    auth: target.auth,
    coverageTier: target.coverageTier,
    state: target.state,
    source: target.source,
    themes: uniqueSorted(target.themes),
    viewports: uniqueSorted(target.viewports),
    interaction: target.interaction ?? null,
  };
}

export function coverageCaptureKeys(plan: Pick<CoveragePlan, "targets">) {
  const targetKeys = plan.targets.map((target) => target.key);
  if (new Set(targetKeys).size !== targetKeys.length) {
    throw new Error("Coverage plan contains duplicate route target keys.");
  }
  const keys = plan.targets.flatMap((target) => (
    uniqueSorted(target.themes).flatMap((theme) => (
      uniqueSorted(target.viewports).map((viewport) => safeKey(`${target.key}-${theme}-${viewport}`))
    ))
  )).sort((left, right) => left.localeCompare(right));
  if (new Set(keys).size !== keys.length) {
    throw new Error("Coverage plan expands to duplicate capture keys.");
  }
  return keys;
}

export function computeCoveragePlanIdentity(plan: CoveragePlan | UnstampedCoveragePlan) {
  const captureKeys = coverageCaptureKeys(plan);
  const payload = {
    schemaVersion: plan.schemaVersion,
    mode: plan.mode,
    scope: plan.scope,
    evidenceTier: plan.evidenceTier,
    dataProvenance: plan.dataProvenance,
    expectedCommit: plan.expectedCommit,
    viewportMatrixDigest: plan.viewportMatrixDigest,
    acceleratorRecord: plan.acceleratorRecord,
    browserVersion: plan.browserVersion,
    inventoryDigest: plan.inventoryDigest,
    sourceRoutes: uniqueSorted(plan.sourceRoutes),
    databaseRoutes: uniqueSorted(plan.databaseRoutes),
    renderedRoutes: uniqueSorted(plan.renderedRoutes),
    assetRoutes: uniqueSorted(plan.assetRoutes),
    unresolvedDynamicPatterns: uniqueSorted(plan.unresolvedDynamicPatterns),
    routeDispositions: [...plan.routeDispositions]
      .map((entry) => ({ ...entry }))
      .sort((left, right) => left.route.localeCompare(right.route)),
    samplingRationale: plan.samplingRationale,
    requiredStates: uniqueSorted(plan.requiredStates),
    targets: [...plan.targets]
      .map(normalizedTarget)
      .sort((left, right) => left.key.localeCompare(right.key)),
    expectedCaptureCount: captureKeys.length,
  };
  return {
    expectedCaptureCount: captureKeys.length,
    targetKeysDigest: sha256(JSON.stringify(captureKeys)),
    planDigest: sha256(JSON.stringify(payload)),
  };
}

export function stampCoveragePlan(plan: UnstampedCoveragePlan): CoveragePlan {
  const identity = computeCoveragePlanIdentity(plan);
  if (plan.expectedCaptureCount !== identity.expectedCaptureCount) {
    throw new Error(
      `Coverage plan expectedCaptureCount ${plan.expectedCaptureCount} does not match ${identity.expectedCaptureCount} expanded jobs.`,
    );
  }
  return { ...plan, planDigest: identity.planDigest, targetKeysDigest: identity.targetKeysDigest };
}

export function assertCoveragePlanIdentity(plan: CoveragePlan) {
  const identity = computeCoveragePlanIdentity(plan);
  const failures: string[] = [];
  if (plan.expectedCaptureCount !== identity.expectedCaptureCount) failures.push("expected capture count");
  if (plan.planDigest !== identity.planDigest) failures.push("plan digest");
  if (plan.targetKeysDigest !== identity.targetKeysDigest) failures.push("target key digest");
  if (!["initial", "converging", "converged"].includes(plan.phase)) failures.push("coverage phase");
  if (!Number.isSafeInteger(plan.seedCaptureCount) || plan.seedCaptureCount <= 0) failures.push("seed capture count");
  if (!Number.isSafeInteger(plan.convergenceIteration) || plan.convergenceIteration < 0) failures.push("convergence iteration");
  if (plan.phase === "initial" && (plan.convergenceIteration !== 0 || plan.seedCaptureCount !== plan.expectedCaptureCount)) {
    failures.push("initial phase metadata");
  }
  if (plan.phase !== "initial" && plan.convergenceIteration < 1) failures.push("post-seed phase metadata");
  if (plan.phase !== "initial" && plan.expectedCaptureCount < plan.seedCaptureCount) failures.push("post-seed capture count");
  if (failures.length) {
    throw new Error(`Coverage plan identity mismatch: ${failures.join(", ")}.`);
  }
  return identity;
}

export function coveragePlanBinding(plan: CoveragePlan): CoveragePlanBinding {
  assertCoveragePlanIdentity(plan);
  return {
    phase: plan.phase,
    seedCaptureCount: plan.seedCaptureCount,
    expectedCaptureCount: plan.expectedCaptureCount,
    convergenceIterations: plan.convergenceIteration,
    planDigest: plan.planDigest,
    targetKeysDigest: plan.targetKeysDigest,
  };
}

export function coverageBindingsMatch(left: CoveragePlanBinding, right: CoveragePlanBinding) {
  return left.phase === right.phase
    && left.seedCaptureCount === right.seedCaptureCount
    && left.expectedCaptureCount === right.expectedCaptureCount
    && left.convergenceIterations === right.convergenceIterations
    && left.planDigest === right.planDigest
    && left.targetKeysDigest === right.targetKeysDigest;
}
