import { assetHeaders, kenmatchIconSvg } from "@/lib/brand-assets";

export const dynamic = "force-static";

export function GET() {
  return new Response(kenmatchIconSvg({ dark: true }), {
    headers: assetHeaders("image/svg+xml; charset=utf-8"),
  });
}
