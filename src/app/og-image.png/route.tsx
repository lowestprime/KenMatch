import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-static";
export const contentType = "image/png";
export const size = { width: 2048, height: 1075 };
export const alt = "KenMatch — rank sustained AI work with public checkpoints, review, and backing.";

export async function GET() {
  const image = await readFile(join(process.cwd(), "public", "og-image.png"));

  return new Response(image, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
