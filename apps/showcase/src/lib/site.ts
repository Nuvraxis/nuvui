import {
  blockCount,
  blocksHome,
  blocksIn,
  categories,
  categoryPath,
} from "./blocks";
import { chartCount, chartsHome, families, familyPath } from "./charts";

export const site = {
  name: "Nuvui",
  packageName: "@nuvui/react",
  description:
    "React components built on Radix UI primitives, styled with SCSS and BEM class names.",
  // No trailing slash. Canonical URLs, the sitemap and OG images are all
  // built from this. The docs app's lib/site.ts has the same value, and a
  // test holds the two together.
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://nuvui.nuvraxis.com",
  repo: "https://github.com/Nuvraxis/nuvui",
};

export function absoluteUrl(path: string): string {
  return new URL(path, site.url).toString();
}

// The docs are another app, copied into this one's export under /docs. A
// link to them is a plain <a>, not the router's Link: the page it leads to
// isn't one of this app's, and the router would ask for files that the docs
// don't have.
export const docs = {
  home: "/docs",
  components: "/docs/components/button",
  // The docs' search index, a file. This site's search reads it too.
  search: "/docs/api/search",
  sitemap: "/docs/sitemap.xml",
};

export const themesHome = "/themes";

export interface NavItem {
  label: string;
  href: string;
  /** In the docs app, so a plain link. */
  docs?: boolean;
}

// What the header links to. The docs app shows the same header, from a
// list of its own in apps/docs/lib/site.ts, and a test holds the two
// together.
export const navigation: NavItem[] = [
  { label: "Docs", href: docs.home, docs: true },
  { label: "Components", href: docs.components, docs: true },
  { label: "Blocks", href: blocksHome },
  { label: "Charts", href: chartsHome },
  { label: "Themes", href: themesHome },
];

// This app's own pages, for the sitemap and the search.
export const pages = [
  {
    path: "/",
    title: "Home",
    description: site.description,
  },
  {
    path: blocksHome,
    title: "Blocks",
    description: `${blockCount} blocks built from the library's components, each a TSX file and an SCSS file to copy: sign-in screens, app layouts and dashboards.`,
  },
  ...categories.map((category) => ({
    path: categoryPath(category),
    title: `${category.title} blocks`,
    description: `${blocksIn(category).length} blocks. ${category.description}`,
  })),
  {
    path: chartsHome,
    title: "Charts",
    description: `${chartCount} charts built with Recharts and the library's chart parts, each with its code to copy.`,
  },
  ...families.map((family) => ({
    path: familyPath(family),
    title: family.title,
    description: family.description,
  })),
  {
    path: themesHome,
    title: "Themes",
    description:
      "Make a theme from a brand color, a base color, a radius and a density, see it on real components in light and dark, and copy it as CSS.",
  },
];
