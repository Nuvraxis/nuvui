import { absoluteUrl, pages } from "@/lib/site";

export const dynamic = "force-static";

// This app's own pages. The docs' are in /docs/sitemap.xml.
export function GET() {
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages
  .map(
    (page) =>
      `  <url><loc>${absoluteUrl(page.path)}</loc><priority>${page.path === "/" ? "1" : "0.8"}</priority></url>`,
  )
  .join("\n")}
</urlset>
`;
  return new Response(body, {
    headers: { "content-type": "application/xml" },
  });
}
