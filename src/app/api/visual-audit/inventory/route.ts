import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { basename, join, relative, sep } from "node:path";

import { NextResponse } from "next/server";

import { getVisualAuditPublicInventory } from "@/lib/db";
import { listVisualAuditDiscussionInventory } from "@/lib/discussion-db";
import { env } from "@/lib/env";
import { PUBLIC_STATIC_SITEMAP_ROUTES } from "@/lib/seo";
import { getViewerSession } from "@/lib/session";
import { allocationTiers } from "@/lib/types";
import {
  isValidVisualAuditToken,
  VISUAL_AUDIT_TOKEN_HEADER,
} from "@/lib/visual-audit-context";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const PUBLIC_ASSET_EXTENSIONS = new Set([
  ".avif",
  ".gif",
  ".ico",
  ".jpeg",
  ".jpg",
  ".png",
  ".svg",
  ".webp",
  ".woff",
  ".woff2",
]);

function extension(path: string) {
  const match = path.toLowerCase().match(/\.[a-z0-9]+$/);
  return match?.[0] ?? "";
}

async function walkPublicAssets(root: string, directory = root): Promise<Array<{ absolutePath: string; url: string }>> {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const absolutePath = join(directory, entry.name);
    if (entry.isDirectory()) return walkPublicAssets(root, absolutePath);
    if (!entry.isFile() || !PUBLIC_ASSET_EXTENSIONS.has(extension(entry.name))) return [];
    const publicPath = relative(root, absolutePath).split(sep).join("/");
    return [{ absolutePath, url: `/${publicPath}` }];
  }));
  return nested.flat();
}

async function digestAsset(absolutePath: string, url: string) {
  const bytes = await readFile(absolutePath);
  return {
    url,
    bytes: bytes.byteLength,
    sha256: createHash("sha256").update(bytes).digest("hex"),
  };
}

async function listPublicAssetDigests(illustrationUrls: Array<string | null>) {
  const publicRoot = join(process.cwd(), "public");
  const publicAssets = await walkPublicAssets(publicRoot);
  const generatedAssets = [
    { absolutePath: join(process.cwd(), "src", "app", "icon.svg"), url: "/icon.svg" },
    { absolutePath: join(process.cwd(), "src", "app", "apple-touch-icon.svg"), url: "/apple-touch-icon.svg" },
    { absolutePath: join(process.cwd(), "src", "app", "og-image.png"), url: "/og-image.png" },
  ];
  const illustrationAssets = illustrationUrls.flatMap((url) => {
    if (!url?.startsWith("/api/ken-illustrations/")) return [];
    const safeName = basename(url);
    if (safeName !== url.split("/").at(-1)) return [];
    return [{
      absolutePath: join(process.cwd(), "data", "ken-illustrations", safeName),
      url,
    }];
  });

  const unique = new Map(
    [...publicAssets, ...generatedAssets, ...illustrationAssets]
      .map((asset) => [asset.url, asset] as const),
  );
  const digests = await Promise.all(
    [...unique.values()].map(async (asset) => {
      try {
        return await digestAsset(asset.absolutePath, asset.url);
      } catch {
        return null;
      }
    }),
  );
  return digests.filter((asset): asset is NonNullable<typeof asset> => asset !== null)
    .sort((left, right) => left.url.localeCompare(right.url));
}

function unavailable() {
  return NextResponse.json({ error: "Not found." }, {
    status: 404,
    headers: {
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow, noarchive",
    },
  });
}

export async function GET(request: Request) {
  if (!isValidVisualAuditToken(request.headers.get(VISUAL_AUDIT_TOKEN_HEADER))) {
    return unavailable();
  }

  const session = await getViewerSession();
  if (!session || (session.account.systemRole !== "owner" && session.account.systemRole !== "admin")) {
    return unavailable();
  }

  const [publicInventory, discussions] = await Promise.all([
    getVisualAuditPublicInventory(),
    listVisualAuditDiscussionInventory(),
  ]);
  const assets = await listPublicAssetDigests(
    publicInventory.kens.map((ken) => ken.illustrationUrl),
  );

  const taskStages = [...new Set(publicInventory.kens.map((ken) => ken.stage))].sort();
  const safetyStates = [...new Set(publicInventory.kens.map((ken) => ken.safetyStatus))].sort();
  return NextResponse.json({
    schemaVersion: 1,
    complete: true,
    generatedAt: new Date().toISOString(),
    lastModified: publicInventory.lastModified,
    build: {
      sha: env.KENMATCH_BUILD_SHA ?? null,
      tier: env.KENMATCH_AUDIT_TIER ?? null,
      dataProvenance: env.KENMATCH_AUDIT_DATA_PROVENANCE,
      labMode: env.KENMATCH_AUDIT_LAB_MODE,
    },
    counts: {
      ...publicInventory.counts,
      discussions: discussions.length,
      assets: assets.length,
    },
    routes: {
      static: PUBLIC_STATIC_SITEMAP_ROUTES.map((route) => route.path),
      kens: publicInventory.kens.map((ken) => `/kens/${encodeURIComponent(ken.slug)}`),
      profiles: publicInventory.profiles.map((profile) => `/people/${encodeURIComponent(profile.slug)}`),
      discussions: discussions.map((discussion) => `/discuss/${encodeURIComponent(discussion.slug)}`),
    },
    taxonomy: {
      categories: publicInventory.categories.map((category) => category.slug),
      lanes: [...allocationTiers],
    },
    states: {
      taskStages,
      safetyStates,
      hasComments: publicInventory.kens.some((ken) => ken.hasComments),
      hasUploadedIllustration: publicInventory.kens.some((ken) => ken.illustrationSource === "uploaded"),
      hasFallbackIllustration: publicInventory.kens.some((ken) => !ken.illustrationUrl),
    },
    kens: publicInventory.kens,
    discussions,
    assets,
  }, {
    headers: {
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow, noarchive",
    },
  });
}
