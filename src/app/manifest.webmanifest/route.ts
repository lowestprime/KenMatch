import { assetHeaders, kenmatchManifest } from "@/lib/brand-assets";

export const dynamic = "force-static";

export function GET() {
  return Response.json(kenmatchManifest(), {
    headers: assetHeaders("application/manifest+json; charset=utf-8"),
  });
}
