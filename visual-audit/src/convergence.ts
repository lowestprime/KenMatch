import { coverageCaptureKeys } from "./plan-identity.js";
import type { CoveragePlan } from "./types.js";

export const MAX_RENDERED_LINK_CONVERGENCE_ITERATIONS = 8;

export function evaluateCoverageConvergence(input: {
  currentPlan: CoveragePlan;
  reconciledPlan: CoveragePlan;
  capturedKeys: ReadonlySet<string>;
  maxIterations?: number;
}) {
  const currentKeys = coverageCaptureKeys(input.currentPlan);
  const currentKeySet = new Set(currentKeys);
  const reconciledKeys = coverageCaptureKeys(input.reconciledPlan);
  const reconciledKeySet = new Set(reconciledKeys);
  const removedKeys = currentKeys.filter((key) => !reconciledKeySet.has(key));
  if (removedKeys.length > 0) {
    throw new Error(
      `Rendered-link reconciliation attempted to replace ${removedKeys.length} persisted capture keys; first=${removedKeys[0]}.`,
    );
  }

  const addedKeys = reconciledKeys.filter((key) => !currentKeySet.has(key));
  const missingKeys = reconciledKeys.filter((key) => !input.capturedKeys.has(key));
  if (missingKeys.length > 0 && addedKeys.length === 0) {
    throw new Error(
      `Rendered-link reconciliation found ${missingKeys.length} missing captures without expanding the persisted target set; first=${missingKeys[0]}.`,
    );
  }

  const maxIterations = input.maxIterations ?? MAX_RENDERED_LINK_CONVERGENCE_ITERATIONS;
  if (missingKeys.length > 0 && input.currentPlan.convergenceIteration >= maxIterations) {
    throw new Error(
      `Rendered-link reconciliation exceeded the bounded ${maxIterations}-iteration route-depth limit at iteration ${input.currentPlan.convergenceIteration}; added=${addedKeys.length}; missing=${missingKeys.length}; currentDigest=${input.currentPlan.targetKeysDigest}; nextDigest=${input.reconciledPlan.targetKeysDigest}.`,
    );
  }

  return { addedKeys, missingKeys };
}
