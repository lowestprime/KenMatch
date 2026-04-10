import { NextResponse } from "next/server";

import { getHealthSummary } from "@/lib/db";
import { env } from "@/lib/env";

const noStoreHeaders = { "Cache-Control": "no-store" };

function deploymentVersion() {
  return process.env.DEPLOYMENT_VERSION ?? null;
}

function allowDetailedView(request: Request) {
  const token = request.headers.get("x-kenmatch-health-token") ?? request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (env.KENMATCH_HEALTH_TOKEN) {
    return token === env.KENMATCH_HEALTH_TOKEN;
  }

  return env.NODE_ENV !== "production";
}

export async function GET(request: Request) {
  try {
    const summary = await getHealthSummary();
    const version = deploymentVersion();
    const status = summary.ok ? 200 : 503;
    if (allowDetailedView(request)) {
      return NextResponse.json(
        { ...summary, version },
        { status, headers: noStoreHeaders },
      );
    }

    return NextResponse.json(
      {
        ok: summary.ok,
        checkedAt: summary.checkedAt,
        version,
      },
      { status, headers: noStoreHeaders },
    );
  } catch {
    return NextResponse.json(
      { ok: false, checkedAt: new Date().toISOString(), version: deploymentVersion() },
      { status: 503, headers: noStoreHeaders },
    );
  }
}

export async function HEAD(request: Request) {
  const response = await GET(request);
  return new NextResponse(null, {
    status: response.status,
    headers: response.headers,
  });
}
