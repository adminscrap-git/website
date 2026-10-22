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
  ];

  return pages.map((p) => ({
    url: `${site.url}${p.path}`,
    lastModified: new Date(),
    changeFrequency: p.path === "/rates" ? "weekly" : "monthly",
    priority: p.priority,
  }));
}
