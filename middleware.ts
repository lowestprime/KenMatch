import { NextResponse, type NextRequest } from "next/server";

const isDevelopment = process.env.NODE_ENV !== "production";
const trustedFetchSites = new Set(["same-origin", "same-site", "none", ""]);
const allowedHosts = (process.env.KENMATCH_ALLOWED_HOSTS ?? "")
  .split(",")
  .map((value) => value.trim().toLowerCase())
  .filter(Boolean);

function normalizeHost(value: string | null) {
  return (value ?? "").trim().toLowerCase().replace(/:\d+$/, "");
}

function expectedOrigin(request: NextRequest, host: string) {
  if (process.env.KENMATCH_PUBLIC_ORIGIN) {
    return process.env.KENMATCH_PUBLIC_ORIGIN.toLowerCase();
  }

  return `${request.nextUrl.protocol}//${host}`;
}

function applySecurityHeaders(response: NextResponse) {
  response.headers.set("x-kenmatch-request-id", crypto.randomUUID());
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  response.headers.set("Cross-Origin-Resource-Policy", "same-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
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

export function middleware(request: NextRequest) {
  const host = normalizeHost(request.headers.get("x-forwarded-host") ?? request.headers.get("host"));
  if (allowedHosts.length && host && !allowedHosts.includes(host)) {
    return applySecurityHeaders(new NextResponse("Host not allowed.", { status: 421 }));
  }

  const response = applySecurityHeaders(NextResponse.next());

  if (request.method === "POST" || request.method === "PUT" || request.method === "PATCH" || request.method === "DELETE") {
    const path = request.nextUrl.pathname;
    if (path !== "/api/stripe/webhook") {
      const secFetchSite = (request.headers.get("sec-fetch-site") ?? "").toLowerCase();
      if (!trustedFetchSites.has(secFetchSite)) {
        return applySecurityHeaders(new NextResponse("Cross-site request blocked.", { status: 403 }));
      }

      const origin = request.headers.get("origin");
      if (origin && host && origin.toLowerCase() !== expectedOrigin(request, host)) {
        return applySecurityHeaders(new NextResponse("Origin mismatch.", { status: 403 }));
      }
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|.*\\.(?:png|jpg|jpeg|gif|webp|ico|svg|txt|xml)$).*)"],
};
