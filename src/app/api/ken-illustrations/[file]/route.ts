import { readFile } from "node:fs/promises";
import { basename, join } from "node:path";

import { NextResponse } from "next/server";

const MIME_BY_EXTENSION: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

export async function GET(_: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  const safeName = basename(file);
  if (!safeName || safeName !== file || safeName.includes("..")) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const extension = safeName.slice(safeName.lastIndexOf(".")).toLowerCase();
  const contentType = MIME_BY_EXTENSION[extension];
  if (!contentType) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  try {
    const bytes = await readFile(join(process.cwd(), "data", "ken-illustrations", safeName));
    return new NextResponse(bytes, {
      headers: {
        "content-type": contentType,
        "cache-control": "public, max-age=31536000, immutable",
        "x-content-type-options": "nosniff",
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
