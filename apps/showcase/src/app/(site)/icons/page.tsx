import type { Metadata } from "next";
import { IconBrowser } from "@/components/icons/icon-browser";
import { JsonLd } from "@/components/json-ld";
import { share } from "@/lib/seo";
import { absoluteUrl, docs, iconsHome, pages, site } from "@/lib/site";

const page = pages.find((entry) => entry.path === iconsHome);
const description = page?.description ?? site.description;

export const metadata: Metadata = {
  title: "Icons",
  description,
  ...share({
    path: iconsHome,
    image: "/og/icons.png",
    title: "Icons",
    description,
  }),
};

export default function IconsPage() {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: `${site.name} icons`,
          description,
          url: absoluteUrl(iconsHome),
        }}
      />
      <div className="site-backdrop">
        <section className="site-intro site-intro--wide">
          <h1 className="site-intro__title">Icons</h1>
          <p className="site-intro__lead">
            Line icons drawn for the library on a 24 pixel grid, in three
            styles: Standard, Rounded and Sharp. Each is a React component in
            the color of the text around it, and an SVG file.
          </p>
          <p className="site-intro__text">
            Press one to see it in each style and at each size, and to copy it.
            Installing them, naming them for screen readers and making icons of
            your own are in{" "}
            <a className="site-intro__link" href={`${docs.home}/icons`}>
              the docs
            </a>
            .
          </p>
        </section>
      </div>
      <IconBrowser />
    </>
  );
}
