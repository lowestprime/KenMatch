import type { MetadataRoute } from "next";

import { canonicalOrigin } from "@/lib/env";
import { PRIVATE_INDEX_PATH_PREFIXES } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [...PRIVATE_INDEX_PATH_PREFIXES],
    },
    sitemap: `${canonicalOrigin}/sitemap.xml`,
    host: canonicalOrigin,
  };
}
