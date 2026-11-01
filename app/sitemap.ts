import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

/**
 * Only the pages worth indexing. /book, /b/[token], /admin and /lab are all
 * deliberately absent — booking tokens especially must never reach a crawler.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const pages = [
    { path: "/", priority: 1 },
    { path: "/rates", priority: 0.9 },
    { path: "/faq", priority: 0.7 },
    { path: "/contact", priority: 0.6 },
    // Low priority, but they must be crawlable and findable: a platform
    // reviewer checking our privacy or data-deletion URL should not have to
    // be handed the link.
    { path: "/privacy", priority: 0.3 },
    { path: "/terms", priority: 0.3 },
    { path: "/cancellation", priority: 0.3 },
    { path: "/data-deletion", priority: 0.3 },
  ];

  return pages.map((p) => ({
    url: `${site.url}${p.path}`,
    lastModified: new Date(),
    changeFrequency: p.path === "/rates" ? "weekly" : "monthly",
    priority: p.priority,
  }));
}
