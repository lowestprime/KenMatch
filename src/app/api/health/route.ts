import { NextResponse } from "next/server";

import { env } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function allowDetailedView(request: Request) {
  const token =
    request.headers.get("x-kenmatch-health-token") ??
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (env.KENMATCH_HEALTH_TOKEN) {
    return token === env.KENMATCH_HEALTH_TOKEN;
  }

  return env.NODE_ENV !== "production";
}

async function livenessResponse() {
  return NextResponse.json(
    { ok: true, probe: "liveness", checkedAt: new Date().toISOString() },
    { status: 200 },
  );
}

async function readinessResponse(request: Request, detailed: boolean) {
  try {
    const { getHealthSummary } = await import("@/lib/db");
    const summary = await getHealthSummary();
    const status = summary.ok ? 200 : 503;

    if (detailed) {
      return NextResponse.json({ probe: "readiness", ...summary }, { status });
    }

    return NextResponse.json(
      {
        probe: "readiness",
        ok: summary.ok,
        databaseMode: summary.databaseMode,
        checkedAt: summary.checkedAt,
      },
      { status },
    );
  } catch (error) {
    return NextResponse.json(
      {
        probe: "readiness",
        ok: false,
        error: error instanceof Error ? error.message : String(error),
        checkedAt: new Date().toISOString(),
      },
      { status: 503 },
    );
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const probe = url.searchParams.get("probe") ?? (url.searchParams.get("deep") === "1" ? "readiness" : "liveness");

  if (probe === "readiness") {
    return readinessResponse(request, allowDetailedView(request));
  }

  return livenessResponse();
}

export async function HEAD(request: Request) {
  const response = await GET(request);
  return new NextResponse(null, {
    status: response.status,
    headers: response.headers,
  });
}
