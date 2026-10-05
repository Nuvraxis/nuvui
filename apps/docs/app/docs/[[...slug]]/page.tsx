import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
} from "fumadocs-ui/layouts/docs/page";
import { createRelativeLink } from "fumadocs-ui/mdx";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/json-ld";
import { getMDXComponents } from "@/components/mdx";
import { changelogToc } from "@/lib/changelog";
import { absoluteUrl, site } from "@/lib/site";
import { getPageImage, source } from "@/lib/source";

export default async function Page(props: PageProps<"/docs/[[...slug]]">) {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  const MDX = page.data.body;
  // The changelog's headings are rendered from a file, not written in its
  // MDX, so they have to be added to the table of contents by hand.
  const toc =
    page.url === "/docs/changelog"
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

  return (
    <DocsPage toc={toc} full={page.data.full}>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "TechArticle",
          headline: page.data.title,
          description: page.data.description,
          url: absoluteUrl(page.url),
          image: absoluteUrl(getPageImage(page).url),
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
            a: createRelativeLink(source, page),
          })}
        />
      </DocsBody>
    </DocsPage>
  );
}

export function generateStaticParams() {
  return source.generateParams();
}

export async function generateMetadata(
  props: PageProps<"/docs/[[...slug]]">,
): Promise<Metadata> {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  return {
    title: page.data.title,
    description: page.data.description,
    alternates: { canonical: page.url },
    openGraph: {
      title: page.data.title,
      description: page.data.description,
      url: page.url,
      type: "article",
      images: getPageImage(page).url,
    },
  };
}
