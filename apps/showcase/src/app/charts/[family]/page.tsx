import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ChartCard } from "@/components/charts/chart-card";
import { FamilyNav } from "@/components/charts/family-nav";
import { JsonLd } from "@/components/json-ld";
import { chartsHome, families, familyPath } from "@/lib/charts";
import { absoluteUrl, docs } from "@/lib/site";

// Only the families listed are pages. Anything else is the 404 page.
export const dynamicParams = false;

export function generateStaticParams() {
  return families.map((family) => ({ family: family.slug }));
}

const find = (slug: string) => families.find((entry) => entry.slug === slug);

export async function generateMetadata({
  params,
}: PageProps<"/charts/[family]">): Promise<Metadata> {
  const family = find((await params).family);
  if (!family) return {};
  const path = familyPath(family);

  return {
    title: family.title,
    description: family.description,
    alternates: { canonical: path },
    openGraph: { url: path, images: `/og/charts-${family.slug}.png` },
  };
}

export default async function FamilyPage({
  params,
}: PageProps<"/charts/[family]">) {
  const family = find((await params).family);
  if (!family) notFound();

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
              name: "Charts",
              item: absoluteUrl(chartsHome),
            },
            {
              "@type": "ListItem",
              position: 2,
              name: family.title,
              item: absoluteUrl(familyPath(family)),
            },
          ],
        }}
      />
      <section className="site-intro">
        <h1 className="site-intro__title">{family.title}</h1>
        <p className="site-intro__lead">{family.description}</p>
        <p className="site-intro__text">
          Copy a chart's code, or open it to read first. Each is one file with
          its data in it. The parts they're built from are in{" "}
          <a className="site-intro__link" href={`${docs.home}/charts`}>
            the charts docs
          </a>
          .
        </p>
        <FamilyNav current={family.slug} />
      </section>
      <div className="site-chart-grid">
        {family.charts.map((chart) => (
          <ChartCard key={chart.name} family={family} chart={chart} />
        ))}
      </div>
    </>
  );
}
