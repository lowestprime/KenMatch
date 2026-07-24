const assetVersion = "a4ef921360a0";

export const dynamic = "force-static";

export function GET() {
  return Response.json(
    {
      name: "KenMatch",
      short_name: "KenMatch",
      description:
        "Transparent allocation of frontier AI compute via quadratic voting, proof-of-value credits, and open checkpoints.",
      start_url: "/",
      scope: "/",
      display: "standalone",
      background_color: "#000000",
      theme_color: "#000000",
      icons: [
        { src: `/icon-dark.svg?v=${assetVersion}`, type: "image/svg+xml", sizes: "any", purpose: "any" },
        { src: `/icon-192.png?v=${assetVersion}`, type: "image/png", sizes: "192x192", purpose: "any maskable" },
        { src: `/icon-512.png?v=${assetVersion}`, type: "image/png", sizes: "512x512", purpose: "any maskable" },
        { src: `/apple-touch-icon.png?v=${assetVersion}`, type: "image/png", sizes: "180x180", purpose: "any maskable" },
        { src: `/favicon-96x96.png?v=${assetVersion}`, type: "image/png", sizes: "96x96", purpose: "any" },
      ],
    },
    {
      headers: {
        "Cache-Control": "public, max-age=0, must-revalidate",
        "Content-Type": "application/manifest+json; charset=utf-8",
        "X-Content-Type-Options": "nosniff",
      },
    },
  );
}
