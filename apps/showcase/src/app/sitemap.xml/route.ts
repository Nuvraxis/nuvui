import { absoluteUrl, docs } from "@/lib/site";

export const dynamic = "force-static";

// The site is two apps, and each lists its own pages. This is the index
// that points to both lists, at the address crawlers look for.
export function GET() {
  const sitemaps = ["/site-sitemap.xml", docs.sitemap];
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemaps.map((path) => `  <sitemap><loc>${absoluteUrl(path)}</loc></sitemap>`).join("\n")}
</sitemapindex>
`;
  return new Response(body, {
    headers: { "content-type": "application/xml" },
  });
}
