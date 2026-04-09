import "server-only";

import { headers } from "next/headers";

import { consumeRateLimit, logSecurityEvent } from "@/lib/db";
import { allowedHosts, env } from "@/lib/env";

const trustedFetchSites = new Set(["same-origin", "same-site", "none", ""]);

export interface RequestSecurityContext {
  host: string;
  origin: string | null;
  secFetchSite: string;
  forwardedProto: string | null;
  ipAddress: string | null;
  userAgent: string;
}

function normalizeHost(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase().replace(/:\d+$/, "");
}

function trustedOriginForHost(host: string, forwardedProto: string | null) {
  if (env.KENMATCH_PUBLIC_ORIGIN) {
    return env.KENMATCH_PUBLIC_ORIGIN.toLowerCase();
  }

  const protocol = (forwardedProto ?? (env.NODE_ENV === "production" ? "https" : "http")).toLowerCase();
  return `${protocol}://${host}`;
}

export async function getRequestSecurityContext(): Promise<RequestSecurityContext> {
  const headerStore = await headers();
  const host = normalizeHost(headerStore.get("x-forwarded-host") ?? headerStore.get("host"));
  const forwardedFor = headerStore.get("cf-connecting-ip")
    ?? headerStore.get("x-real-ip")
    ?? headerStore.get("x-forwarded-for")
    ?? "";
  const ipAddress = forwardedFor.split(",")[0]?.trim() || null;

  return {
    host,
    origin: headerStore.get("origin"),
    secFetchSite: (headerStore.get("sec-fetch-site") ?? "").toLowerCase(),
    forwardedProto: headerStore.get("x-forwarded-proto"),
    ipAddress,
    userAgent: headerStore.get("user-agent") ?? "",
  };
}

export function turnstileConfigured() {
  return Boolean(env.KENMATCH_TURNSTILE_SECRET_KEY && env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);
}

function assertAllowedHost(context: RequestSecurityContext) {
  if (!allowedHosts.length || !context.host) {
    return;
  }

  if (!allowedHosts.includes(context.host)) {
    throw new Error("This host is not allowed for this deployment.");
  }
}

function assertSameOrigin(context: RequestSecurityContext) {
  assertAllowedHost(context);

  if (context.origin) {
    const trustedOrigin = trustedOriginForHost(context.host, context.forwardedProto);
    if (context.origin.toLowerCase() !== trustedOrigin) {
      throw new Error("Cross-site form submission was rejected.");
    }
    return;
  }

  if (!trustedFetchSites.has(context.secFetchSite)) {
    throw new Error("Cross-site request was rejected.");
  }
}

async function verifyTurnstileToken(token: string, ipAddress: string | null) {
  if (!turnstileConfigured()) {
    return;
  }

  if (!token) {
    throw new Error("Verification expired. Please try again.");
  }

  const body = new URLSearchParams({
    secret: env.KENMATCH_TURNSTILE_SECRET_KEY ?? "",
    response: token,
  });
  if (ipAddress) {
    body.set("remoteip", ipAddress);
  }

  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
    cache: "no-store",
  });

  const payload = (await response.json()) as { success?: boolean };
  if (!payload.success) {
    throw new Error("Verification failed. Please try again.");
  }
}

export async function guardMutationRequest(input: {
  action: string;
  formData: FormData;
  actorId?: string | null;
  requireTurnstile?: boolean;
  rateLimit?: {
    scope: string;
    identifierParts?: Array<string | null | undefined>;
    limit: number;
    windowSeconds: number;
  };
}) {
  const context = await getRequestSecurityContext();
  assertSameOrigin(context);

  const honeypot = String(input.formData.get("website") ?? "").trim();
  if (honeypot) {
    await logSecurityEvent({
      eventType: "honeypot-trip",
      detail: `${input.action}: hidden form field was filled`,
      actorId: input.actorId,
      ipAddress: context.ipAddress,
    });
    throw new Error("Request rejected.");
  }

  if (input.rateLimit) {
    const identifier = [context.ipAddress ?? "unknown", ...(input.rateLimit.identifierParts ?? [])]
      .filter(Boolean)
      .join("|")
      .toLowerCase();
    const limitState = await consumeRateLimit({
      scope: input.rateLimit.scope,
      identifier,
      limit: input.rateLimit.limit,
      windowSeconds: input.rateLimit.windowSeconds,
    });
    if (!limitState.allowed) {
      await logSecurityEvent({
        eventType: "rate-limit-hit",
        detail: `${input.action}: ${input.rateLimit.scope} exhausted until ${limitState.resetAt}`,
        actorId: input.actorId,
        ipAddress: context.ipAddress,
      });
      throw new Error("Too many attempts. Please wait a moment and try again.");
    }
  }

  if (input.requireTurnstile) {
    await verifyTurnstileToken(String(input.formData.get("turnstileToken") ?? ""), context.ipAddress);
  }

  return context;
}
