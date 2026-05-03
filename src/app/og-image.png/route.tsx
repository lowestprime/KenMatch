import { readFile } from "fs/promises";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-static";

const imagePath = path.join(process.cwd(), "public", "og-image.png");
const cacheControl = "public, max-age=14400";

export async function GET() {
  const image = await readFile(imagePath);

  return new Response(image, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": cacheControl,
    },
  });
}
