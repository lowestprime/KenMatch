export interface SecurityPolicyMode {
  development: boolean;
  auditLabMode: boolean;
}

export function emitsSecureTransportHeaders(mode: SecurityPolicyMode) {
  return !mode.development && !mode.auditLabMode;
}

export function contentSecurityPolicy(mode: SecurityPolicyMode) {
  return [
    "default-src 'self'",
    "img-src 'self' data: blob:",
    "style-src 'self' 'unsafe-inline'",
    mode.development
      ? "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com"
      : "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com",
    "connect-src 'self' https://challenges.cloudflare.com wss:",
    "font-src 'self' data:",
    "frame-src 'self' https://challenges.cloudflare.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    emitsSecureTransportHeaders(mode) ? "upgrade-insecure-requests" : "",
  ].filter(Boolean).join("; ");
}
