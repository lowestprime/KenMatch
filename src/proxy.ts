import { NextResponse, type NextRequest } from "next/server";

import {
  normalizeAuthority,
  normalizeHostname,
  normalizeOrigin,
  trustedRequestOrigin,
} from "@/lib/request-origin";
import { PRIVATE_INDEX_PATH_PREFIXES } from "@/lib/seo";
import { isValidatedVisualAuditContext } from "@/lib/visual-audit-context";

const isDevelopment = process.env.NODE_ENV !== "production";
const trustedFetchSites = new Set(["same-origin", "same-site", "none", ""]);
const allowedHosts = (process.env.KENMATCH_ALLOWED_HOSTS ?? "")
  .split(",")
  .map((value) => value.trim().toLowerCase())
  .filter(Boolean);
const internalHealthHosts = new Set(["127.0.0.1", "localhost", "0.0.0.0", "::1", "[::1]", "kenmatch", "kenmatch-demo"]);

function isInternalHealthRequest(path: string, host: string) {
  return path === "/api/health" && internalHealthHosts.has(host);
}

function expectedOrigin(request: NextRequest, host: string) {
  return trustedRequestOrigin({
    authority: host,
    forwardedProto: request.nextUrl.protocol.replace(/:$/, ""),
    publicOrigin: process.env.KENMATCH_PUBLIC_ORIGIN,
    production: !isDevelopment,
  });
}

function redirectToCanonicalHttps(request: NextRequest, host: string, path: string) {
  if (isDevelopment || !host || isInternalHealthRequest(path, host)) return null;
  const publicOrigin =
    process.env.KENMATCH_CANONICAL_ORIGIN
    ?? process.env.KENMATCH_PUBLIC_ORIGIN
    ?? "https://kmat.ch";
  let canonical: URL;
  try {
    canonical = new URL(publicOrigin);
  } catch {
    canonical = new URL("https://kmat.ch");
  }
  const canonicalHost = normalizeHostname(canonical.host);
  const requestProtocol = (
    request.headers.get("x-forwarded-proto")
    ?? request.nextUrl.protocol.replace(/:$/, "")
  ).toLowerCase();

  if (host === canonicalHost && `${requestProtocol}:` === canonical.protocol) {
    return null;
  }

  const url = new URL(`${request.nextUrl.pathname}${request.nextUrl.search}`, canonical.origin);
  return applyIndexingHeaders(applySecurityHeaders(NextResponse.redirect(url, 308)), path);
}

function applySecurityHeaders(response: NextResponse) {
  response.headers.set("x-kenmatch-request-id", crypto.randomUUID());
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  response.headers.set("Cross-Origin-Resource-Policy", "same-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  response.headers.set("X-DNS-Prefetch-Control", "off");
  response.headers.set("X-Download-Options", "noopen");
  response.headers.set("X-Permitted-Cross-Domain-Policies", "none");
  if (!isDevelopment) {
    response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  }
  response.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "img-src 'self' data: blob:",
      "style-src 'self' 'unsafe-inline'",
      isDevelopment
        ? "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com"
        : "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com",
      "connect-src 'self' https://challenges.cloudflare.com wss:",
      "font-src 'self' data:",
      "frame-src 'self' https://challenges.cloudflare.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
      isDevelopment ? "" : "upgrade-insecure-requests",
    ].filter(Boolean).join("; "),
  );
  return response;
}

function applyIndexingHeaders(response: NextResponse, path: string) {
  const noIndex = PRIVATE_INDEX_PATH_PREFIXES.some((prefix) => (
    path === prefix || path.startsWith(`${prefix}/`)
  ));
  if (noIndex) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  }
  return response;
}

function blockRequest(request: NextRequest, status: number, body: string, reason: string) {
  const path = request.nextUrl.pathname;
  console.warn(`[kenmatch-proxy] blocked request: path=${path} reason=${reason}`);
  const blocked = applyIndexingHeaders(
    applySecurityHeaders(new NextResponse(body, { status })),
    path,
  );
  if (path.startsWith("/api/")) {
    blocked.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
  }
  return blocked;
}

export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const hostHeader = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const host = normalizeHostname(hostHeader);
  const hostWithPort = normalizeAuthority(hostHeader);
  const internalHealthRequest = isInternalHealthRequest(path, host);

  if (!internalHealthRequest && allowedHosts.length && host && !allowedHosts.includes(host)) {
    return blockRequest(request, 421, "Host not allowed.", "host not in allowlist");
  }

  const httpsRedirect = redirectToCanonicalHttps(request, host, path);
  if (httpsRedirect) return httpsRedirect;

  const unsafeMethod = request.method === "POST"
    || request.method === "PUT"
    || request.method === "PATCH"
    || request.method === "DELETE";

  if (unsafeMethod && isValidatedVisualAuditContext(request.headers)) {
    const blocked = blockRequest(
      request,
      409,
      "Read-only visual audit context cannot mutate application state.",
      "validated visual audit read-only context",
    );
    blocked.headers.set("x-kenmatch-audit-blocked", "1");
    return blocked;
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-kenmatch-pathname", path);
  const validatedAuditContext = isValidatedVisualAuditContext(request.headers);
  const response = applyIndexingHeaders(
    applySecurityHeaders(NextResponse.next({ request: { headers: requestHeaders } })),
    path,
  );
  if (validatedAuditContext) {
    response.headers.set("x-kenmatch-audit-telemetry-suppressed", "1");
    response.headers.set("x-kenmatch-audit-context", "readonly");
  }
  if (path.startsWith("/api/")) {
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
  }

  if (unsafeMethod) {
    if (path !== "/api/stripe/webhook") {
      const secFetchSite = (request.headers.get("sec-fetch-site") ?? "").toLowerCase();
      if (!trustedFetchSites.has(secFetchSite)) {
        return blockRequest(request, 403, "Cross-site request blocked.", `cross-site Sec-Fetch-Site=${secFetchSite || "(missing)"}`);
      }

      const origin = request.headers.get("origin");
      if (origin && hostWithPort && normalizeOrigin(origin) !== expectedOrigin(request, hostWithPort)) {
        return blockRequest(request, 403, "Origin mismatch.", "origin does not match expected origin for host");
      }
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/|.*\\.(?:png|jpg|jpeg|gif|webp|ico|svg|txt|xml)$).*)"],
};
