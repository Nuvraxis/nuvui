import type { MetadataRoute } from "next";
import { absoluteUrl, docsPath } from "@/lib/site";
import { source } from "@/lib/source";

export const dynamic = "force-static";

// The docs' pages only. It's served at /docs/sitemap.xml, and the website's
// sitemap index at /sitemap.xml points to it.
export default function sitemap(): MetadataRoute.Sitemap {
  return source.getPages().map((page) => ({
    url: absoluteUrl(docsPath(page.url)),
    priority: page.url === "/" ? 0.9 : 0.8,
  }));
}
