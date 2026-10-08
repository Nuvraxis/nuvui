import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/json-ld";
import { chartCount, chartsHome, families, familyPath } from "@/lib/charts";
import { absoluteUrl, docs, pages, site } from "@/lib/site";

const page = pages.find((entry) => entry.path === chartsHome);
const description = page?.description ?? site.description;

export const metadata: Metadata = {
  title: "Charts",
  description,
  alternates: { canonical: chartsHome },
  openGraph: { url: chartsHome, images: "/og/charts.png" },
};

export default function ChartsPage() {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "Charts",
          description,
          url: absoluteUrl(chartsHome),
          hasPart: families.map((family) => ({
            "@type": "WebPage",
            name: family.title,
            url: absoluteUrl(familyPath(family)),
          })),
        }}
      />
      <div className="site-backdrop">
        <section className="site-intro">
          <h1 className="site-intro__title">Charts</h1>
          <p className="site-intro__lead">
            {chartCount} charts to copy, in {families.length} families. Each is
            one file: Recharts' own parts, inside the library's container,
            tooltip, legend and data table. They take their colors from the
            theme, so change the theme at the top of the page and they follow.
          </p>
          <p className="site-intro__text">
            How the parts work is in{" "}
            <a className="site-intro__link" href={`${docs.home}/charts`}>
              the charts docs
            </a>
            . The figures on these pages are made up.
          </p>
        </section>
      </div>
      <section className="site-section" aria-labelledby="families-heading">
        <h2
          id="families-heading"
          className="site-section__title site-section__title--small"
        >
          Families
        </h2>
        <ul className="site-tiles">
          {families.map((family) => (
            <li key={family.slug} className="site-tile">
              <h3 className="site-tile__title">
                <Link href={familyPath(family)} className="site-tile__link">
                  {family.title}
                </Link>
              </h3>
              <p className="site-tile__text">{family.description}</p>
              <p className="site-tile__more">
                {family.charts.length} charts
                <ArrowRight aria-hidden="true" size={14} />
              </p>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
