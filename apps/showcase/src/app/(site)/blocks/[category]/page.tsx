import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlockCard } from "@/components/blocks/block-card";
import { CategoryNav } from "@/components/blocks/category-nav";
import { JsonLd } from "@/components/json-ld";
import { blocksHome, blocksIn, categories, categoryPath } from "@/lib/blocks";
import { absoluteUrl, docs, pages } from "@/lib/site";

// Only the categories listed are pages. Anything else is the 404 page.
export const dynamicParams = false;

export function generateStaticParams() {
  return categories.map((category) => ({ category: category.slug }));
}

const find = (slug: string) => categories.find((entry) => entry.slug === slug);

export async function generateMetadata({
  params,
}: PageProps<"/blocks/[category]">): Promise<Metadata> {
  const category = find((await params).category);
  if (!category) return {};
  const path = categoryPath(category);
  const page = pages.find((entry) => entry.path === path);

  return {
    title: page?.title,
    description: page?.description,
    alternates: { canonical: path },
    openGraph: { url: path, images: `/og/blocks-${category.slug}.png` },
  };
}

export default async function CategoryPage({
  params,
}: PageProps<"/blocks/[category]">) {
  const category = find((await params).category);
  if (!category) notFound();

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            {
              "@type": "ListItem",
              position: 1,
              name: "Blocks",
              item: absoluteUrl(blocksHome),
            },
            {
              "@type": "ListItem",
              position: 2,
              name: category.title,
              item: absoluteUrl(categoryPath(category)),
            },
          ],
        }}
      />
      <div className="site-backdrop">
        <section className="site-intro site-intro--wide">
          <h1 className="site-intro__title">{category.title}</h1>
          <p className="site-intro__lead">{category.description}</p>
          <p className="site-intro__text">
            Try a block at a phone's width or a tablet's, or open it in a tab of
            its own. Its files are under Code, each with a button to copy it.
            The components they're built from are in{" "}
            <a className="site-intro__link" href={docs.components}>
              the docs
            </a>
            .
          </p>
          <CategoryNav current={category.slug} />
        </section>
      </div>
      <div className="site-block-list">
        {blocksIn(category).map((block) => (
          <BlockCard key={block.name} block={block} />
        ))}
      </div>
    </>
  );
}
