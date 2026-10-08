import { Button } from "@nuvui/react/button";
import type { Metadata } from "next";
import { Dashboard } from "@/components/dashboard/dashboard";
import { JsonLd } from "@/components/json-ld";
import { docs, site } from "@/lib/site";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
  openGraph: { url: "/", images: "/og/home.png" },
};

export default function HomePage() {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: site.name,
          description: site.description,
          url: site.url,
        }}
      />
      <section className="site-hero">
        <h1 className="site-hero__title">
          React components on Radix UI, styled with plain SCSS
        </h1>
        <p className="site-hero__lead">
          {site.name} wraps Radix primitives and styles them with BEM class
          names and CSS custom properties. The stylesheet ships as a normal CSS
          file, so it works with server components and needs no build plugin.
        </p>
        <p className="site-hero__note">
          It's early. There are fifty-two components so far, with a date picker,
          tables and charts in packages of their own, and nothing has been
          published to the registry yet.
        </p>
        <div className="site-hero__actions">
          <Button asChild size="lg">
            <a href={docs.home}>Get started</a>
          </Button>
          <Button asChild size="lg" intent="secondary">
            <a href={docs.components}>See the components</a>
          </Button>
        </div>
      </section>
      <section className="site-section" aria-labelledby="dashboard-heading">
        <div className="site-section__intro">
          <h2 id="dashboard-heading" className="site-section__title">
            Built from the library
          </h2>
          <p className="site-section__text">
            This dashboard is the components themselves, not a picture of them:
            cards, badges, two charts and a data table. Change the theme at the
            top of the page and it follows. The figures are made up.
          </p>
        </div>
        <Dashboard />
      </section>
    </>
  );
}
