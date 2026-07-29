import type { MetadataRoute } from "next";

import { listPublicSitemapEntities } from "@/lib/db";
import { listDiscussionSitemapEntries } from "@/lib/discussion-db";
import { canonicalOrigin } from "@/lib/env";
import { PUBLIC_STATIC_SITEMAP_ROUTES } from "@/lib/seo";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [entities, discussions] = await Promise.all([
    listPublicSitemapEntities(),
    listDiscussionSitemapEntries(),
  ]);
  const staticEntries: MetadataRoute.Sitemap = PUBLIC_STATIC_SITEMAP_ROUTES.map((route) => ({
    url: `${canonicalOrigin}${route.path}`,
    lastModified: entities.generatedAt,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
  const kenEntries: MetadataRoute.Sitemap = entities.kens.map((ken) => ({
    url: `${canonicalOrigin}/kens/${encodeURIComponent(ken.slug)}`,
    lastModified: ken.lastModified,
    changeFrequency: ken.changeFrequency,
    priority: 0.8,
  }));
  const profileEntries: MetadataRoute.Sitemap = entities.profiles.map((profile) => ({
    url: `${canonicalOrigin}/people/${encodeURIComponent(profile.slug)}`,
    lastModified: profile.lastModified,
    changeFrequency: "weekly",
    priority: 0.55,
  }));
  const discussionEntries: MetadataRoute.Sitemap = discussions.map((discussion) => ({
    url: `${canonicalOrigin}/discuss/${encodeURIComponent(discussion.slug)}`,
    lastModified: discussion.lastModified,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  return [...staticEntries, ...kenEntries, ...profileEntries, ...discussionEntries];
}
