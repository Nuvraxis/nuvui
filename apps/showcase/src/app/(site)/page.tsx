import { Button } from "@nuvui/react/button";
import {
  ArrowRight,
  BarChart3,
  Blocks,
  Braces,
  FileCode2,
  Layers,
  Package,
  Palette,
  ScanEye,
  SwatchBook,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Dashboard } from "@/components/dashboard/dashboard";
import { JsonLd } from "@/components/json-ld";
import { blockCount, blocksHome } from "@/lib/blocks";
import { chartCount, chartsHome } from "@/lib/charts";
import { docs, site, themesHome } from "@/lib/site";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
  openGraph: { url: "/", images: "/og/home.png" },
};

// Counted from the packages: the README lists the components by name.
const facts = [
  { value: "52", label: "Components in the core" },
  { value: "3", label: "Add-on packages" },
  { value: String(chartCount), label: "Charts to copy" },
  { value: "5", label: "Presets, each in light and dark" },
];

const features = [
  {
    Icon: Layers,
    title: "Radix underneath",
    text: "Focus, keyboard and screen reader behavior come from Radix primitives. The library adds the styling, and the parts Radix leaves out.",
  },
  {
    Icon: FileCode2,
    title: "One plain stylesheet",
    text: "Import it once. Nothing in the JavaScript imports CSS, so it works with server components and needs no build plugin.",
  },
  {
    Icon: Braces,
    title: "Every value is a variable",
    text: "Colors, radius, spacing and sizes are CSS custom properties, named after Tailwind v4's theme variables. Set one and every component follows.",
  },
  {
    Icon: ScanEye,
    title: "Tested in real browsers",
    text: "Each component is tested in Chromium, Firefox and WebKit for keyboard use, touch sizes and contrast, in light, dark and forced colors.",
  },
  {
    Icon: SwatchBook,
    title: "Themes by measurement",
    text: "Five presets and three densities ship in the package. Each pair of colors in a theme is measured for contrast, not assumed to pass.",
  },
  {
    Icon: Package,
    title: "Add-ons kept apart",
    text: "The date picker, the tables and the charts are packages of their own, so an app that wants buttons doesn't install a charting library.",
  },
];

const parts = [
  {
    Icon: Blocks,
    title: "Blocks",
    href: blocksHome,
    text: "Sign-in screens, app layouts and dashboards built from the components. Each is a TSX file and an SCSS file to copy.",
    more: `${blockCount} blocks`,
  },
  {
    Icon: BarChart3,
    title: "Charts",
    href: chartsHome,
    text: "Area, bar, line, pie, radar and more, on Recharts. They take their colors from the theme and carry their numbers as a table.",
    more: `${chartCount} charts`,
  },
  {
    Icon: Palette,
    title: "Themes",
    href: themesHome,
    text: "Pick a brand color, a base color, a radius and a density, see it on real components, and take the result as CSS.",
    more: "Open the builder",
  },
];

export default function HomePage() {
  return (
    <div className="site-home">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: site.name,
          description: site.description,
          url: site.url,
        }}
      />
      <div className="site-backdrop">
        <section className="site-hero">
          <p className="site-hero__eyebrow">
            <span className="site-hero__dot" aria-hidden="true" />
            Open source, and early: nothing is on npm yet
          </p>
          <h1 className="site-hero__title">
            React components on Radix UI, styled with plain SCSS
          </h1>
          <p className="site-hero__lead">
            {site.name} wraps Radix primitives and styles them with BEM class
            names and CSS custom properties. The stylesheet ships as a normal
            CSS file, so it works with server components and needs no build
            plugin.
          </p>
          <div className="site-hero__actions">
            <Button asChild size="lg">
              <a href={docs.home}>
                Get started
                <ArrowRight aria-hidden="true" size={18} />
              </a>
            </Button>
            <Button asChild size="lg" intent="secondary">
              <a href={docs.components}>See the components</a>
            </Button>
          </div>
          <dl className="site-facts">
            {facts.map((fact) => (
              <div key={fact.label} className="site-facts__item">
                <dt className="site-facts__label">{fact.label}</dt>
                <dd className="site-facts__value">{fact.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>

      <section className="site-section" aria-labelledby="dashboard-heading">
        <div className="site-section__intro site-section__intro--center">
          <p className="site-section__label">Live, not a screenshot</p>
          <h2 id="dashboard-heading" className="site-section__title">
            Built from the library
          </h2>
          <p className="site-section__text">
            This dashboard is the components themselves, not a picture of them:
            cards, badges, two charts and a data table. Change the theme at the
            top of the page and it follows. The figures are made up.
          </p>
        </div>
        <div className="site-window">
          <div className="site-window__bar" aria-hidden="true">
            <span className="site-window__dot" />
            <span className="site-window__dot" />
            <span className="site-window__dot" />
          </div>
          <div className="site-window__body">
            <Dashboard />
          </div>
        </div>
      </section>

      <section className="site-section" aria-labelledby="features-heading">
        <div className="site-section__intro">
          <p className="site-section__label">How it's made</p>
          <h2 id="features-heading" className="site-section__title">
            Made for apps that have to last
          </h2>
          <p className="site-section__text">
            The choices behind the library, each one checked by a test and
            written up in the docs.
          </p>
        </div>
        <ul className="site-features">
          {features.map(({ Icon, title, text }) => (
            <li key={title} className="site-features__item">
              <span className="site-features__icon">
                <Icon aria-hidden="true" size={20} />
              </span>
              <h3 className="site-features__title">{title}</h3>
              <p className="site-features__text">{text}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="site-section" aria-labelledby="parts-heading">
        <div className="site-section__intro">
          <p className="site-section__label">Beyond the components</p>
          <h2 id="parts-heading" className="site-section__title">
            Things to take with you
          </h2>
          <p className="site-section__text">
            Whole screens, charts and themes, built with the library and offered
            as code. Copy what you need and it's yours to change.
          </p>
        </div>
        <ul className="site-tiles site-tiles--three">
          {parts.map(({ Icon, title, href, text, more }) => (
            <li key={href} className="site-tile site-tile--large">
              <span className="site-tile__icon">
                <Icon aria-hidden="true" size={20} />
              </span>
              <h3 className="site-tile__title site-tile__title--large">
                <Link href={href} className="site-tile__link">
                  {title}
                </Link>
              </h3>
              <p className="site-tile__text">{text}</p>
              <p className="site-tile__more">
                {more}
                <ArrowRight aria-hidden="true" size={14} />
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section className="site-section" aria-labelledby="start-heading">
        <div className="site-cta">
          <h2 id="start-heading" className="site-section__title">
            Start with the docs
          </h2>
          <p className="site-section__text">
            Getting started takes one import and one stylesheet. Every component
            has a page with examples, its props and its variables.
          </p>
          <div className="site-hero__actions">
            <Button asChild size="lg">
              <a href={docs.home}>Read the docs</a>
            </Button>
            <Button asChild size="lg" intent="secondary">
              <a href={site.repo}>See the source</a>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
