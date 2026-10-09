import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { BlockCard } from "@/components/blocks/block-card";
import { CategoryNav } from "@/components/blocks/category-nav";
import { JsonLd } from "@/components/json-ld";
import {
  blockCount,
  blocks,
  blocksHome,
  blocksIn,
  categories,
  categoryPath,
} from "@/lib/blocks";
import { absoluteUrl, docs, pages, site } from "@/lib/site";

const page = pages.find((entry) => entry.path === blocksHome);
const description = page?.description ?? site.description;

// The one shown on this page, whole: it has the most of the library in it.
const featured = blocks.find((block) => block.name === "dashboard");

export const metadata: Metadata = {
  title: "Blocks",
  description,
  alternates: { canonical: blocksHome },
  openGraph: { url: blocksHome, images: "/og/blocks.png" },
};

export default function BlocksPage() {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "Blocks",
          description,
          url: absoluteUrl(blocksHome),
          hasPart: categories.map((category) => ({
            "@type": "WebPage",
            name: category.title,
            url: absoluteUrl(categoryPath(category)),
          })),
        }}
      />
      <div className="site-backdrop">
        <section className="site-intro site-intro--wide">
          <h1 className="site-intro__title">Blocks</h1>
          <p className="site-intro__lead">
            {blockCount} parts of an app, built from the library's components
            and ready to copy. A block is a TSX file and an SCSS file. The class
            names are its own, with no prefix of the library's, because once
            it's copied it's your code.
          </p>
          <p className="site-intro__text">
            Each preview is the block on a page of its own, so it lays itself
            out for the width of the preview and not for your screen. The
            components they use are in{" "}
            <a className="site-intro__link" href={docs.components}>
              the docs
            </a>
            . The names and figures in them are made up.
          </p>
          <p className="site-intro__text">
            A block needs the stylesheet of each package it imports from, loaded
            once in your app, and an app that compiles Sass. Under Code, each
            block has the command that installs its packages, and one for
            shadcn's command line tool, which copies the files as well.
          </p>
          <CategoryNav />
        </section>
      </div>
      <section
        className="site-section site-section--wide"
        aria-labelledby="categories-heading"
      >
        <h2
          id="categories-heading"
          className="site-section__title site-section__title--small"
        >
          Categories
        </h2>
        <ul className="site-tiles site-tiles--three">
          {categories.map((category) => (
            <li key={category.slug} className="site-tile">
              <h3 className="site-tile__title">
                <Link href={categoryPath(category)} className="site-tile__link">
                  {category.title}
                </Link>
              </h3>
              <p className="site-tile__text">{category.description}</p>
              <p className="site-tile__more">
                {blocksIn(category).length} blocks
                <ArrowRight aria-hidden="true" size={14} />
              </p>
            </li>
          ))}
        </ul>
        {featured ? (
          <>
            <h2 className="site-section__title site-section__title--small">
              One to start with
            </h2>
            <BlockCard block={featured} level={3} />
          </>
        ) : null}
      </section>
    </>
  );
}
