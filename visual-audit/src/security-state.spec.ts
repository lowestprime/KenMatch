import assert from "node:assert/strict";
import test from "node:test";

import { restoreResumeSecurity } from "./security-state.js";
import type { RequestSecuritySummary } from "./types.js";

function security(overrides: Partial<RequestSecuritySummary> = {}): RequestSecuritySummary {
  return {
    loginMutations: 4,
    blockedUnsafeRequests: 1,
    successfulUnsafeRequests: 0,
    blockedCrossOriginRequests: 0,
    allowedCrossOriginRequests: 0,
    telemetrySuppressed: true,
    inventoryRequests: 1,
    ...overrides,
  };
}

test("resume preserves durable capture security without duplicating process bounds", () => {
  const current = security();
  restoreResumeSecurity(current, security({
    blockedUnsafeRequests: 5,
    blockedCrossOriginRequests: 7,
    allowedCrossOriginRequests: 3,
    loginMutations: 99,
    inventoryRequests: 99,
  }));

  assert.deepEqual(current, security({
    blockedUnsafeRequests: 5,
    blockedCrossOriginRequests: 7,
    allowedCrossOriginRequests: 3,
  }));
});

test("resume keeps prior unsafe success and telemetry failure visible", () => {
  const current = security();
  restoreResumeSecurity(current, security({
    successfulUnsafeRequests: 1,
    telemetrySuppressed: false,
  }));

  assert.equal(current.successfulUnsafeRequests, 1);
  assert.equal(current.telemetrySuppressed, false);
});
