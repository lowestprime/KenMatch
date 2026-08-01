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
