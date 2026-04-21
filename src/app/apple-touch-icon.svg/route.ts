import { assetHeaders, kenmatchAppleIconSvg } from "@/lib/brand-assets";

export const dynamic = "force-static";

export function GET() {
  return new Response(kenmatchAppleIconSvg(), {
    headers: assetHeaders("image/svg+xml; charset=utf-8"),
  });
}
