import type { Metadata } from "next";
import { JsonLd } from "@/components/json-ld";
import { ThemeBuilder } from "@/components/themes/theme-builder";
import { share } from "@/lib/seo";
import { absoluteUrl, docs, pages, site, themesHome } from "@/lib/site";

const page = pages.find((entry) => entry.path === themesHome);
const description = page?.description ?? site.description;

export const metadata: Metadata = {
  title: "Themes",
  description,
  ...share({
    path: themesHome,
    image: "/og/themes.png",
    title: "Themes",
    description,
  }),
};

export default function ThemesPage() {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: `${site.name} theme builder`,
          description,
          url: absoluteUrl(themesHome),
          applicationCategory: "DeveloperApplication",
          operatingSystem: "Any",
        }}
      />
      <div className="site-backdrop">
        <section className="site-intro site-intro--wide">
          <h1 className="site-intro__title">Themes</h1>
          <p className="site-intro__lead">
            Pick a brand color, a base color, a radius and a density, and see
            the components in it, in light and in dark. Then take the result as
            CSS. A theme is a set of values for the library's variables and
            nothing else, so there's nothing to install.
          </p>
          <p className="site-intro__text">
            Each color is chosen by measuring its contrast against the colors
            it's used with. What the variables are is in{" "}
            <a className="site-intro__link" href={`${docs.home}/theming`}>
              the theming guide
            </a>
            .
          </p>
        </section>
      </div>
      <ThemeBuilder />
    </>
  );
}
