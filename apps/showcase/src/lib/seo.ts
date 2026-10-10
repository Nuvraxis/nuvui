import type { Metadata, Viewport } from "next";
import { site } from "./site";

// What every page's <head> says, and what a page adds to it. The docs app
// has the same file, apps/docs/lib/seo.ts, and a test holds the two
// together: they're one site to a search engine and to anyone who shares a
// link.
//
// The icons aren't here. Next finds them by their file names in the app
// folder: icon.svg, favicon.ico and apple-icon.png, which
// scripts/make-icons.mjs draws from the first.

// The background of the default theme, light and dark, written out: a
// browser reads these before any stylesheet.
const background = { light: "#ffffff", dark: "#030712" };

const title = `${site.name}: React components for enterprise applications`;

/** Goes in the root layout, as `metadata`. */
export const baseMetadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: title,
    template: `%s | ${site.name}`,
  },
  description: site.description,
  applicationName: site.name,
  authors: [{ name: site.author.name, url: site.author.url }],
  creator: site.author.name,
  publisher: site.author.name,
  category: "technology",
  keywords: [
    "React components",
    "React UI library",
    "enterprise UI components",
    "business applications",
    "admin dashboard",
    "Radix UI",
    "SCSS",
    "BEM",
    "CSS custom properties",
    "design tokens",
    "accessible components",
    "data table",
    "charts",
    "date picker",
  ],
  // A page is indexed unless it says otherwise, with as much of its text
  // and as large a picture as a result has room for.
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  // Numbers and addresses in the docs are examples, not ones to call.
  formatDetection: { telephone: false, email: false, address: false },
  openGraph: {
    siteName: site.name,
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
  },
};

/** Goes in the root layout, as `viewport`. */
export const viewport: Viewport = {
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: background.light },
    { media: "(prefers-color-scheme: dark)", color: background.dark },
  ],
};

interface Share {
  /** The page's address, from the root of the site. */
  path: string;
  /** The picture a shared link shows, from the root of the site. */
  image: string;
  /** What the picture shows, in words: the page's title. */
  title: string;
  description?: string;
  /** `"article"` for a page of the docs. */
  type?: "website" | "article";
}

/**
 * A page's canonical address and what a shared link to it shows.
 *
 * A page's `openGraph` replaces the layout's whole, it isn't merged into
 * it. So the site's name, the language and the type are said again here,
 * or a page that names its picture would lose them.
 */
export function share({
  path,
  image,
  title: pageTitle,
  description,
  type = "website",
}: Share): Pick<Metadata, "alternates" | "openGraph"> {
  return {
    alternates: { canonical: path },
    openGraph: {
      siteName: site.name,
      locale: "en_US",
      type,
      url: path,
      title: pageTitle,
      description,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          type: "image/png",
          // The home page's title already starts with the name.
          alt: pageTitle.startsWith(site.name)
            ? pageTitle
            : `${pageTitle}, on ${site.name}`,
        },
      ],
    },
  };
}
