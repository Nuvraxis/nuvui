import { createGetUrl, loader } from "fumadocs-core/source";
import { metaSchema, pageSchema } from "fumadocs-core/source/schema";
import { defineDocs } from "fumadocs-mdx/macro";

const docs = defineDocs({
  dir: "content/docs",
  docs: { schema: pageSchema },
  meta: { schema: metaSchema },
});

// The app is served under /docs, which is its basePath in next.config.ts.
// Next adds that to every link and route by itself, so a page's url here is
// its path inside the app: the Button page is /components/button. Use
// docsPath from lib/site.ts for the address a visitor sees.
export const source = loader({
  baseUrl: "/",
  source: docs.toFumadocsSource(),
});

const getImageUrl = createGetUrl("/og");

// The image lives one segment below the page it belongs to, so the docs
// index, which has no slug of its own, still gets a path.
export function getPageImage(page: { slugs: string[] }) {
  const segments = [...page.slugs, "image.png"];
  return { segments, url: getImageUrl(segments) };
}
