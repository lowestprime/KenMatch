import assert from "node:assert/strict";
import test from "node:test";

import {
  classifyCaptureRequestFailure,
  classifyCaptureRequest,
  isExpectedBrowserPolicyConsoleMessage,
  isExpectedRscLifecycleAbort,
  isExpectedSettledNavigationAbort,
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

test("only same-origin GET RSC fetch cancellation is an expected lifecycle abort", () => {
  const expected = {
    method: "GET",
    requestUrl: `${BASE}/kens?_rsc=abc123`,
    baseUrl: BASE,
    resourceType: "fetch",
    navigationRequest: false,
    failure: "net::ERR_ABORTED",
  };
  assert.equal(isExpectedRscLifecycleAbort(expected), true);
  assert.equal(isExpectedRscLifecycleAbort({ ...expected, method: "POST" }), false);
  assert.equal(isExpectedRscLifecycleAbort({ ...expected, requestUrl: `${BASE}/kens` }), false);
  assert.equal(isExpectedRscLifecycleAbort({ ...expected, requestUrl: "https://example.com/kens?_rsc=x" }), false);
  assert.equal(isExpectedRscLifecycleAbort({ ...expected, resourceType: "image" }), false);
  assert.equal(isExpectedRscLifecycleAbort({ ...expected, navigationRequest: true }), false);
  assert.equal(isExpectedRscLifecycleAbort({ ...expected, failure: "net::ERR_FAILED" }), false);
  assert.equal(classifyCaptureRequestFailure(expected), "suppress");
  assert.equal(classifyCaptureRequestFailure({
    ...expected,
    requestUrl: "https://assets.example.com/image.png",
    resourceType: "image",
    failure: "net::ERR_BLOCKED_BY_CLIENT",
  }), "expected");
  assert.equal(classifyCaptureRequestFailure({
    ...expected,
    requestUrl: `${BASE}/api/data`,
    failure: "net::ERR_FAILED",
  }), "serious");
});

test("only a successfully settled same-origin navigation abort is suppressed", () => {
  const expected = {
    method: "GET",
    requestUrl: `${BASE}/people/canonical-user`,
    baseUrl: BASE,
    resourceType: "document",
    navigationRequest: true,
    failure: "net::ERR_ABORTED",
    finalUrl: `${BASE}/people/canonical-user#activity`,
    documentSettled: true,
  };
  assert.equal(isExpectedSettledNavigationAbort(expected), true);
  assert.equal(classifyCaptureRequestFailure(expected), "suppress");
  assert.equal(classifyCaptureRequestFailure({ ...expected, documentSettled: false }), "serious");
  assert.equal(classifyCaptureRequestFailure({ ...expected, finalUrl: `${BASE}/people/other` }), "serious");
  assert.equal(classifyCaptureRequestFailure({ ...expected, requestUrl: "https://example.com/people/canonical-user" }), "serious");
  assert.equal(classifyCaptureRequestFailure({ ...expected, failure: "net::ERR_FAILED" }), "serious");
});

test("browser-policy console echoes are expected without hiding other failures", () => {
  assert.equal(
    isExpectedBrowserPolicyConsoleMessage("Failed to load resource: net::ERR_BLOCKED_BY_CLIENT.Inspector"),
    true,
  );
  assert.equal(
    isExpectedBrowserPolicyConsoleMessage("Failed to load resource: net::ERR_FAILED"),
    false,
  );
  assert.equal(
    isExpectedBrowserPolicyConsoleMessage("Application error: ERR_BLOCKED_BY_CLIENT"),
    false,
  );
});
