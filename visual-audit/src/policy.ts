const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export function isUnsafeMethod(method: string) {
  return !SAFE_METHODS.has(method.toUpperCase());
}

export function isSameOrigin(requestUrl: string | URL, baseUrl: string | URL) {
  return new URL(requestUrl, baseUrl).origin === new URL(baseUrl).origin;
}

export function isInventoryRequest(method: string, requestUrl: string | URL, baseUrl: string | URL) {
  const request = new URL(requestUrl, baseUrl);
  const base = new URL(baseUrl);
  return method.toUpperCase() === "GET"
    && request.origin === base.origin
    && request.pathname === "/api/visual-audit/inventory"
    && request.search === "";
}

export function shouldAttachAuditToken(method: string, requestUrl: string | URL, baseUrl: string | URL) {
  return !isUnsafeMethod(method) && isSameOrigin(requestUrl, baseUrl);
}

export function isExpectedRscLifecycleAbort(input: {
  method: string;
  requestUrl: string;
  baseUrl: string;
  resourceType: string;
  navigationRequest: boolean;
  failure: string;
}) {
  const request = new URL(input.requestUrl, input.baseUrl);
  return input.method.toUpperCase() === "GET"
    && input.resourceType === "fetch"
    && !input.navigationRequest
    && input.failure.includes("ERR_ABORTED")
    && request.origin === new URL(input.baseUrl).origin
    && request.searchParams.has("_rsc");
}

export function isExpectedSettledNavigationAbort(input: {
  method: string;
  requestUrl: string;
  baseUrl: string;
  resourceType: string;
  navigationRequest: boolean;
  failure: string;
  finalUrl?: string;
  documentSettled?: boolean;
}) {
  if (!input.finalUrl || input.documentSettled !== true) return false;
  const request = new URL(input.requestUrl, input.baseUrl);
  const finalUrl = new URL(input.finalUrl, input.baseUrl);
  return input.method.toUpperCase() === "GET"
    && input.resourceType === "document"
    && input.navigationRequest
    && input.failure.includes("ERR_ABORTED")
    && request.origin === new URL(input.baseUrl).origin
    && finalUrl.origin === request.origin
    && finalUrl.pathname === request.pathname
    && finalUrl.search === request.search;
}

export function classifyCaptureRequestFailure(input: {
  method: string;
  requestUrl: string;
  baseUrl: string;
  resourceType: string;
  navigationRequest: boolean;
  failure: string;
  finalUrl?: string;
  documentSettled?: boolean;
}) {
  if (isExpectedRscLifecycleAbort(input)) return "suppress" as const;
  if (isExpectedSettledNavigationAbort(input)) return "suppress" as const;
  if (input.failure.includes("ERR_BLOCKED_BY_CLIENT")) return "expected" as const;
  return "serious" as const;
}

export function isExpectedBrowserPolicyConsoleMessage(message: string) {
  return message.includes("Failed to load resource: net::ERR_BLOCKED_BY_CLIENT");
}

export function classifyCaptureRequest(input: {
  method: string;
  requestUrl: string;
  baseUrl: string;
  allowedCrossOriginHosts: readonly string[];
}) {
  const request = new URL(input.requestUrl, input.baseUrl);
  const base = new URL(input.baseUrl);
  if (request.origin === base.origin) {
    return {
      action: isUnsafeMethod(input.method) ? "block-unsafe" : "allow",
      attachAuditHeaders: !isUnsafeMethod(input.method),
      reason: isUnsafeMethod(input.method) ? "same-origin unsafe method" : "same-origin safe request",
    } as const;
  }
  const allowedHost = input.allowedCrossOriginHosts.includes(request.hostname.toLowerCase());
  if (!allowedHost || isUnsafeMethod(input.method)) {
    return {
      action: "block-cross-origin",
      attachAuditHeaders: false,
      reason: allowedHost ? "cross-origin unsafe method" : "cross-origin host not allowlisted",
    } as const;
  }
  return {
    action: "allow",
    attachAuditHeaders: false,
    reason: "allowlisted cross-origin safe request",
  } as const;
}
