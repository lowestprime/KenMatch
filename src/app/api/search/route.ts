import { NextResponse } from "next/server";

import { getViewerProfileId } from "@/lib/session";
import { searchSite } from "@/lib/site-search";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q")?.slice(0, 120) ?? "";
  const results = await searchSite(query, await getViewerProfileId());
  return NextResponse.json({ results }, {
    headers: {
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex, nofollow, noarchive",
    },
  });
}
