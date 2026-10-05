import { createGetUrl, loader } from "fumadocs-core/source";
import { metaSchema, pageSchema } from "fumadocs-core/source/schema";
import { defineDocs } from "fumadocs-mdx/macro";

const docs = defineDocs({
  dir: "content/docs",
  docs: { schema: pageSchema },
  meta: { schema: metaSchema },
});

export const source = loader({
  baseUrl: "/docs",
  source: docs.toFumadocsSource(),
});

const getImageUrl = createGetUrl("/og/docs");

// The image lives one segment below the page it belongs to, so the docs
// index, which has no slug of its own, still gets a path.
export function getPageImage(page: { slugs: string[] }) {
  const segments = [...page.slugs, "image.png"];
  return { segments, url: getImageUrl(segments) };
}
