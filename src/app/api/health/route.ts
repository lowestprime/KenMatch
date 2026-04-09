import { NextResponse } from "next/server";

import { getHealthSummary } from "@/lib/db";
import { env } from "@/lib/env";

function allowDetailedView(request: Request) {
  const token = request.headers.get("x-kenmatch-health-token") ?? request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (env.KENMATCH_HEALTH_TOKEN) {
    return token === env.KENMATCH_HEALTH_TOKEN;
  }

  return env.NODE_ENV !== "production";
}

export async function GET(request: Request) {
  const summary = await getHealthSummary();
  if (allowDetailedView(request)) {
    return NextResponse.json(summary, { status: 200 });
  }

  return NextResponse.json(
    {
      ok: summary.ok,
      databaseMode: summary.databaseMode,
      checkedAt: summary.checkedAt,
    },
    { status: 200 },
  );
}

export async function HEAD(request: Request) {
  const response = await GET(request);
  return new NextResponse(null, {
    status: response.status,
    headers: response.headers,
  });
}
