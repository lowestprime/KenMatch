import { NextResponse, type NextRequest } from "next/server";

const isDevelopment = process.env.NODE_ENV !== "production";
const trustedFetchSites = new Set(["same-origin", "same-site", "none", ""]);
const allowedHosts = (process.env.KENMATCH_ALLOWED_HOSTS ?? "")
  .split(",")
  .map((value) => value.trim().toLowerCase())
  .filter(Boolean);
const internalHealthHosts = new Set(["127.0.0.1", "localhost", "0.0.0.0", "::1", "[::1]", "kenmatch", "kenmatch-demo"]);

function normalizeHost(value: string | null) {
  const raw = (value ?? "").trim().toLowerCase();
  if (raw === "::1") return raw;
  if (raw.startsWith("[")) {
    const end = raw.indexOf("]");
    if (end !== -1) return raw.slice(0, end + 1);
  }
  return raw.replace(/:\d+$/, "");
}

function normalizeHostWithPort(value: string | null) {
  return (value ?? "").trim().toLowerCase();
}

function isInternalHealthRequest(path: string, host: string) {
  return path === "/api/health" && internalHealthHosts.has(host);
}

function expectedOrigin(request: NextRequest, host: string) {
  if (process.env.KENMATCH_PUBLIC_ORIGIN) {
    return process.env.KENMATCH_PUBLIC_ORIGIN.toLowerCase();
  }

  return `${request.nextUrl.protocol}//${host}`;
}

function redirectToCanonicalHttps(request: NextRequest, host: string, path: string) {
  if (isDevelopment || !host || isInternalHealthRequest(path, host)) return null;
  const publicOrigin = process.env.KENMATCH_PUBLIC_ORIGIN ?? "https://kmat.ch";
  let canonical: URL;
  try {
    canonical = new URL(publicOrigin);
  } catch {
    canonical = new URL("https://kmat.ch");
  }
  const canonicalHost = normalizeHost(canonical.host);

  if (host === canonicalHost) {
    return null;
  }

  const url = new URL(`${request.nextUrl.pathname}${request.nextUrl.search}`, canonical.origin);
  return applySecurityHeaders(NextResponse.redirect(url, 308));
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
      "upgrade-insecure-requests",
    ].join("; "),
  );
  return response;
}

function blockRequest(request: NextRequest, status: number, body: string, reason: string) {
  const path = request.nextUrl.pathname;
  console.warn(`[kenmatch-proxy] blocked request: path=${path} reason=${reason}`);
  const blocked = applySecurityHeaders(new NextResponse(body, { status }));
  if (path.startsWith("/api/")) {
    blocked.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
  }
  return blocked;
}

export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const hostHeader = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const host = normalizeHost(hostHeader);
  const hostWithPort = normalizeHostWithPort(hostHeader);
  const internalHealthRequest = isInternalHealthRequest(path, host);

  if (!internalHealthRequest && allowedHosts.length && host && !allowedHosts.includes(host)) {
    return blockRequest(request, 421, "Host not allowed.", "host not in allowlist");
  }

  const httpsRedirect = redirectToCanonicalHttps(request, host, path);
  if (httpsRedirect) return httpsRedirect;

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-kenmatch-pathname", path);
  const response = applySecurityHeaders(NextResponse.next({ request: { headers: requestHeaders } }));
  if (path.startsWith("/api/")) {
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
  }

  if (request.method === "POST" || request.method === "PUT" || request.method === "PATCH" || request.method === "DELETE") {
    if (path !== "/api/stripe/webhook") {
      const secFetchSite = (request.headers.get("sec-fetch-site") ?? "").toLowerCase();
      if (!trustedFetchSites.has(secFetchSite)) {
        return blockRequest(request, 403, "Cross-site request blocked.", `cross-site Sec-Fetch-Site=${secFetchSite || "(missing)"}`);
      }

      const origin = request.headers.get("origin");
      if (origin && hostWithPort && origin.toLowerCase() !== expectedOrigin(request, hostWithPort)) {
        return blockRequest(request, 403, "Origin mismatch.", "origin does not match expected origin for host");
      }
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|.*\\.(?:png|jpg|jpeg|gif|webp|ico|svg|txt|xml)$).*)"],
};
