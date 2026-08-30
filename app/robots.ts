import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // /b/ holds booking tokens. Everything else here is just noise for a
      // crawler, but that one is a genuine privacy boundary.
      disallow: ["/admin", "/b/", "/book"],
    },
    sitemap: `${site.url}/sitemap.xml`,
  };
}
