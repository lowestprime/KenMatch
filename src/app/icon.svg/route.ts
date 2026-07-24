const target = "/icon-dark.svg?v=a4ef921360a0";

export function GET() {
  return new Response(null, {
    status: 308,
    headers: {
      Location: target,
      "Cache-Control": "public, max-age=0, must-revalidate",
    },
  });
}
