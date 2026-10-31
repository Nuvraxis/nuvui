import "@fontsource-variable/archivo/wdth.css";
import "@fontsource-variable/martian-mono/wdth.css";
import "@nuvui/react/themes/ember.css";
import "@nuvui/react/themes/high-contrast.css";
import "@nuvui/react/themes/ink.css";
import "@nuvui/react/themes/ledger.css";
import "@nuvui/react/themes/meadow.css";
import { Button } from "@nuvui/react/button";
import { Progress } from "@nuvui/react/progress";
import { ArrowRight, BarChart3, Blocks, Palette } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Bench } from "@/components/bench/bench";
import { CopyButton } from "@/components/charts/copy-button";
import { Dashboard } from "@/components/dashboard/dashboard";
import { JsonLd } from "@/components/json-ld";
import { blockCount, blocksHome } from "@/lib/blocks";
import { chartCount, chartsHome } from "@/lib/charts";
import { addOnCount, packages } from "@/lib/packages";
import { roadToOne } from "@/lib/road";
import { share } from "@/lib/seo";
import { docs, site, themesHome } from "@/lib/site";
import { libraryVersion } from "@/lib/version";

export const metadata: Metadata = share({
  path: "/",
  image: "/og/home.png",
  title: `${site.name}: React components for enterprise applications`,
  description: site.description,
});

const install = `pnpm add ${site.packageName}`;

// What every part is held to. The first column is what's being specified,
// the way it would be on a data sheet.
const specification = [
  {
    name: "Touch size",
    text: "44 pixels on a touch screen, at every density.",
  },
  {
    name: "Contrast",
    text: "Each pair of colors in a theme is measured, not assumed to pass.",
  },
  {
    name: "Browsers",
    text: "Tested in Chromium, Firefox and WebKit.",
  },
  {
    name: "Checks",
    text: "Keyboard use, touch sizes and contrast, in light, dark and forced colors, with axe in every theme.",
  },
  {
    name: "Theming",
    text: "CSS custom properties, named after Tailwind v4's theme variables. Set one and every component follows.",
  },
  {
    name: "Stylesheet",
    text: "One plain file, imported once. Nothing in the JavaScript imports CSS, so it works with server components and needs no build plugin.",
  },
  {
    name: "Language",
    text: "Every word a component says by itself is a prop you can translate.",
  },
  {
    name: "Direction",
    text: "Layouts follow a page that reads right to left.",
  },
  {
    name: "React",
    text: "18.2 and later 18 releases, and 19.",
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
  const version = libraryVersion();
  const road = roadToOne();
  const done = road.filter((item) => item.done).length;

  // The corner of the drawing, where a sheet says what it's a drawing of.
  // The parts above it are the real ones at their real size, so the scale
  // is true. Counted from the packages: the README lists the components by
  // name.
  const titleBlock = [
    { label: "Part", value: site.packageName },
    { label: "Revision", value: version ?? "Unreleased" },
    { label: "Scale", value: "1:1" },
    { label: "License", value: "MIT" },
    { label: "Components", value: "79" },
    { label: "Add-ons", value: String(addOnCount) },
    { label: "Blocks", value: String(blockCount) },
    { label: "Charts", value: String(chartCount) },
  ];

  return (
    <div className="site-home">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: site.name,
          alternateName: `${site.name} React components`,
          description: site.description,
          url: site.url,
        }}
      />
      <section className="site-lead" aria-labelledby="lead-heading">
        <p className="site-lead__status">
          <span className="site-lead__dot" aria-hidden="true" />
          {version
            ? `Open source, and early: version ${version}`
            : "Open source, and early: nothing is on npm yet"}
        </p>
        <h1 id="lead-heading" className="site-lead__title">
          <span className="site-lead__kicker">
            React components for enterprise applications
          </span>{" "}
          Business software, built once, consistent everywhere.
        </h1>
        <div className="site-lead__foot">
          <p className="site-lead__text">
            {site.name} is a library of open source React components: data
            tables, forms, charts, schedulers and admin screens, built on Radix
            UI and styled with plain CSS. Each part is tested for keyboard use
            and accessibility, and can be themed, translated and laid out right
            to left.
          </p>
          <div className="site-lead__actions">
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
        </div>
        <div className="site-sheet">
          <Bench />
          <dl className="site-sheet__block">
            {titleBlock.map(({ label, value }) => (
              <div key={label} className="site-sheet__cell">
                <dt className="site-sheet__label">{label}</dt>
                <dd className="site-sheet__value">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="site-section" aria-labelledby="specification-heading">
        <div className="site-section__intro">
          <p className="site-section__label">Specification</p>
          <h2
            id="specification-heading"
            className="site-section__title site-home__title"
          >
            What every React component is held to
          </h2>
          <p className="site-section__text">
            Checked by tests in real browsers and written up in the docs, along
            with what isn't finished yet.
          </p>
        </div>
        <div className="site-spec">
          <dl className="site-spec__list">
            {specification.map(({ name, text }) => (
              <div key={name} className="site-spec__row">
                <dt className="site-spec__name">{name}</dt>
                <dd className="site-spec__text">{text}</dd>
              </div>
            ))}
          </dl>
          <div className="site-road">
            <h3 className="site-road__title">The road to 1.0</h3>
            <p className="site-road__summary">
              {done} of {road.length} done. The packages are 0.x versions, so a
              minor version may still rename things.
            </p>
            <Progress
              value={done}
              max={road.length}
              size="sm"
              aria-label="The road to 1.0"
            />
            <ul className="site-road__list">
              {road.map(({ text, done: finished }) => (
                <li key={text} className="site-road__item">
                  <span
                    className={
                      finished
                        ? "site-road__mark site-road__mark--done"
                        : "site-road__mark"
                    }
                  >
                    {finished ? "Done" : "Open"}
                  </span>
                  <span className="site-road__text">{text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="site-section" aria-labelledby="packages-heading">
        <div className="site-section__intro">
          <p className="site-section__label">Parts list</p>
          <h2
            id="packages-heading"
            className="site-section__title site-home__title"
          >
            {packages.length} packages. Install the ones you use.
          </h2>
          <p className="site-section__text">
            The core has the React components, the tokens and the presets. The
            parts that need a library of their own are separate packages, so an
            app carries only what it uses.
          </p>
        </div>
        <ul className="site-parts">
          {packages.map(({ name, text, href }) => (
            <li key={name} className="site-parts__item">
              <a href={href} className="site-parts__link">
                <span className="site-parts__name">{name}</span>
                <span className="site-parts__text">{text}</span>
                <ArrowRight
                  className="site-parts__arrow"
                  aria-hidden="true"
                  size={16}
                />
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section className="site-section" aria-labelledby="dashboard-heading">
        <div className="site-section__intro">
          <p className="site-section__label">Assembly</p>
          <h2
            id="dashboard-heading"
            className="site-section__title site-home__title"
          >
            Built from the library
          </h2>
          <p className="site-section__text">
            This dashboard is React components, not a picture of them: cards,
            badges, two charts and a data table. Change the preset on the bench
            and it follows. The figures are made up.
          </p>
        </div>
        <div className="site-window">
          <p className="site-window__bar">
            @nuvui/react, @nuvui/charts, @nuvui/table
          </p>
          <div className="site-window__body">
            <Dashboard />
          </div>
        </div>
      </section>

      <section className="site-section" aria-labelledby="parts-heading">
        <div className="site-section__intro">
          <p className="site-section__label">Beyond the components</p>
          <h2
            id="parts-heading"
            className="site-section__title site-home__title"
          >
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
          <h2
            id="start-heading"
            className="site-section__title site-home__title"
          >
            Start with one import and one stylesheet
          </h2>
          <div className="site-install">
            <code className="site-install__command">{install}</code>
            <CopyButton code={install} label="Copy the install command" />
          </div>
          <div className="site-cta__actions">
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
