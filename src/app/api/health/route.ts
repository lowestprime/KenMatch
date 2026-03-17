import { NextResponse } from "next/server";

import { getHealthSummary } from "@/lib/db";

export async function GET() {
  const summary = await getHealthSummary();
  return NextResponse.json(summary, { status: 200 });
}
