import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
} from "fumadocs-ui/layouts/docs/page";
import { createRelativeLink } from "fumadocs-ui/mdx";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ComponentProps } from "react";
import { JsonLd } from "@/components/json-ld";
import { getMDXComponents } from "@/components/mdx";
import { changelogToc } from "@/lib/changelog";
import { share } from "@/lib/seo";
import { absoluteUrl, docsBase, docsPath, site } from "@/lib/site";
import { getPageImage, source } from "@/lib/source";

export default async function Page(props: PageProps<"/[[...slug]]">) {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  const MDX = page.data.body;
  // The changelog's headings are rendered from a file, not written in its
  // MDX, so they have to be added to the table of contents by hand.
  const toc =
    page.url === "/changelog"
      ? [...(await changelogToc()), ...page.data.toc]
      : page.data.toc;

  // One breadcrumb per URL segment: Docs, then Components, then Button.
  const crumbs = ["docs", ...page.slugs].map((_, index, all) => {
    const path = `/${all.slice(0, index + 1).join("/")}`;
    const target = source.getPage(all.slice(1, index + 1));
    return {
      "@type": "ListItem",
      position: index + 1,
      name: target?.data.title ?? all[index],
      item: absoluteUrl(path),
    };
  });

  const RelativeLink = createRelativeLink(source, page);

  return (
    <DocsPage toc={toc} full={page.data.full}>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "TechArticle",
          headline: page.data.title,
          description: page.data.description,
          url: absoluteUrl(docsPath(page.url)),
          image: absoluteUrl(docsPath(getPageImage(page).url)),
          isPartOf: { "@type": "WebSite", name: site.name, url: site.url },
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: crumbs,
        }}
      />
      <DocsTitle>{page.data.title}</DocsTitle>
      <DocsDescription>{page.data.description}</DocsDescription>
      <DocsBody>
        <MDX
          components={getMDXComponents({
            a: (link: ComponentProps<typeof RelativeLink>) => (
              <RelativeLink {...link} href={insideApp(link.href)} />
            ),
          })}
        />
      </DocsBody>
    </DocsPage>
  );
}

// The pages link to each other by the address a visitor sees,
// /docs/components/button, so the links read the same in the source and in
// the browser. Next adds the base path to a link itself, so it's taken off
// here first. A link to anywhere else is left as it is.
function insideApp(href: string | undefined) {
  if (href === undefined) return href;
  if (href === docsBase) return "/";
  for (const next of ["/", "#", "?"]) {
    if (href.startsWith(`${docsBase}${next}`)) {
      return next === "/"
        ? href.slice(docsBase.length)
        : `/${href.slice(docsBase.length)}`;
    }
  }
  return href;
}

export function generateStaticParams() {
  return source.generateParams();
}

export async function generateMetadata(
  props: PageProps<"/[[...slug]]">,
): Promise<Metadata> {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  const url = docsPath(page.url);

  return {
    title: page.data.title,
    description: page.data.description,
    ...share({
      path: url,
      image: docsPath(getPageImage(page).url),
      title: page.data.title,
      description: page.data.description,
      type: "article",
    }),
  };
}
