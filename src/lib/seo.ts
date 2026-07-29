import type { Metadata } from "next";

import { canonicalOrigin } from "./env.ts";

export const SITE_NAME = "KenMatch";
export const SITE_DESCRIPTION =
  "A public board for proposing, ranking, funding, and auditing sustained AI-assisted work through visible checkpoints.";
export const SOCIAL_IMAGE_VERSION = "a4ef921360a0";
export const SOCIAL_IMAGE_WIDTH = 2400;
export const SOCIAL_IMAGE_HEIGHT = 1199;

export interface StaticSitemapRoute {
  path: string;
  changeFrequency: "daily" | "weekly" | "monthly" | "yearly";
  priority: number;
}

export const PUBLIC_STATIC_SITEMAP_ROUTES: StaticSitemapRoute[] = [
  { path: "/", changeFrequency: "daily", priority: 1 },
  { path: "/kens", changeFrequency: "daily", priority: 0.95 },
  { path: "/discuss", changeFrequency: "daily", priority: 0.8 },
  { path: "/profiles", changeFrequency: "weekly", priority: 0.65 },
  { path: "/submit", changeFrequency: "monthly", priority: 0.75 },
  { path: "/governance", changeFrequency: "monthly", priority: 0.8 },
  { path: "/economics", changeFrequency: "weekly", priority: 0.75 },
  { path: "/about", changeFrequency: "monthly", priority: 0.7 },
  { path: "/faq", changeFrequency: "monthly", priority: 0.8 },
  { path: "/glossary", changeFrequency: "monthly", priority: 0.7 },
  { path: "/reviews", changeFrequency: "daily", priority: 0.65 },
  { path: "/verification", changeFrequency: "yearly", priority: 0.5 },
];

export const PRIVATE_INDEX_PATH_PREFIXES = [
  "/account",
  "/admin",
  "/api",
  "/auth",
  "/forgot-password",
  "/reset",
  "/verify",
] as const;

const SOCIAL_IMAGE = `/og-image.png?v=${SOCIAL_IMAGE_VERSION}`;
const TWITTER_IMAGE = `/share-image.png?v=${SOCIAL_IMAGE_VERSION}`;

function socialTitle(title: string) {
  return title.toLowerCase().includes("kenmatch") ? title : `${title} · ${SITE_NAME}`;
}

export function canonicalUrl(path = "/") {
  return new URL(path, `${canonicalOrigin}/`).toString();
}

export function seoDescription(value: string, maxLength = 180) {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) return normalized;
  const clipped = normalized.slice(0, Math.max(1, maxLength - 1));
  const boundary = clipped.lastIndexOf(" ");
  return `${clipped.slice(0, boundary > maxLength * 0.65 ? boundary : clipped.length).trim()}…`;
}

export function isPrivateIndexPath(pathname: string) {
  return PRIVATE_INDEX_PATH_PREFIXES.some((prefix) => (
    pathname === prefix || pathname.startsWith(`${prefix}/`)
  ));
}

export function buildPublicMetadata(input: {
  title: string;
  description: string;
  path: string;
  imageAlt?: string;
  index?: boolean;
  type?: "website" | "article" | "profile";
}): Metadata {
  const index = input.index ?? true;
  const canonical = canonicalUrl(input.path);
  const title = socialTitle(input.title);
  return {
    title: input.title,
    description: input.description,
    alternates: { canonical },
    robots: {
      index,
      follow: true,
      noarchive: !index,
      googleBot: {
        index,
        follow: true,
        noimageindex: !index,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    openGraph: {
      title,
      description: input.description,
      siteName: SITE_NAME,
      type: input.type ?? "website",
      url: canonical,
      images: [{
        url: SOCIAL_IMAGE,
        width: SOCIAL_IMAGE_WIDTH,
        height: SOCIAL_IMAGE_HEIGHT,
        type: "image/png",
        alt: input.imageAlt ?? "KenMatch public board preview",
      }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: input.description,
      images: [TWITTER_IMAGE],
    },
  };
}

export function buildPrivateMetadata(title: string, description: string): Metadata {
  return {
    title,
    description,
    robots: {
      index: false,
      follow: false,
      noarchive: true,
      noimageindex: true,
      googleBot: {
        index: false,
        follow: false,
        noimageindex: true,
        "max-image-preview": "none",
        "max-snippet": 0,
        "max-video-preview": 0,
      },
    },
  };
}

export interface KensQueryIndexState {
  index: boolean;
  canonicalPath: string;
  kind: "base" | "category" | "lane" | "noncanonical";
  value: string | null;
}

export function classifyKensQuery(
  params: Record<string, string | string[] | undefined>,
  validCategorySlugs: ReadonlySet<string>,
): KensQueryIndexState {
  const present = Object.entries(params).filter(([, value]) => (
    Array.isArray(value) ? value.length > 0 : value !== undefined
  ));
  if (present.length === 0) {
    return { index: true, canonicalPath: "/kens", kind: "base", value: null };
  }
  if (present.length === 1) {
    const [key, rawValue] = present[0];
    if (typeof rawValue === "string" && key === "category" && validCategorySlugs.has(rawValue)) {
      return {
        index: true,
        canonicalPath: `/kens?category=${encodeURIComponent(rawValue)}`,
        kind: "category",
        value: rawValue,
      };
    }
    if (
      typeof rawValue === "string"
      && key === "tier"
      && ["months", "weeks", "days", "queued", "blocked"].includes(rawValue)
    ) {
      return {
        index: true,
        canonicalPath: `/kens?tier=${encodeURIComponent(rawValue)}`,
        kind: "lane",
        value: rawValue,
      };
    }
  }
  return { index: false, canonicalPath: "/kens", kind: "noncanonical", value: null };
}

export function hasQueryVariant(params: Record<string, string | string[] | undefined>) {
  return Object.values(params).some((value) => (
    Array.isArray(value) ? value.length > 0 : value !== undefined
  ));
}

export function jsonLdString(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

export function breadcrumbJsonLd(items: Array<{ name: string; path: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: canonicalUrl(item.path),
    })),
  };
}
