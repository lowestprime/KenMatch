import assert from "node:assert/strict";
import test from "node:test";

import {
  classifyCaptureRequest,
  isInventoryRequest,
  isUnsafeMethod,
  shouldAttachAuditToken,
} from "./policy.js";

const BASE = "https://kmat.ch";

test("capture policy blocks all same-origin unsafe methods", () => {
  for (const method of ["POST", "PUT", "PATCH", "DELETE"]) {
    assert.equal(isUnsafeMethod(method), true);
    assert.equal(classifyCaptureRequest({
      method,
      requestUrl: `${BASE}/api/action`,
      baseUrl: BASE,
      allowedCrossOriginHosts: [],
    }).action, "block-unsafe");
  }
});

test("capture policy never sends audit secrets cross-origin", () => {
  assert.equal(shouldAttachAuditToken("GET", `${BASE}/kens`, BASE), true);
  assert.equal(shouldAttachAuditToken("GET", "https://example.com/image.png", BASE), false);
  assert.equal(classifyCaptureRequest({
    method: "GET",
    requestUrl: "https://example.com/image.png",
    baseUrl: BASE,
    allowedCrossOriginHosts: [],
  }).action, "block-cross-origin");
});

test("inventory eligibility is exact and GET-only", () => {
  assert.equal(isInventoryRequest("GET", `${BASE}/api/visual-audit/inventory`, BASE), true);
  assert.equal(isInventoryRequest("GET", `${BASE}/api/visual-audit/inventory?x=1`, BASE), false);
  assert.equal(isInventoryRequest("POST", `${BASE}/api/visual-audit/inventory`, BASE), false);
});
