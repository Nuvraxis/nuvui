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

export interface NavItem {
  label: string;
  href: string;
  /** In the docs app, so a plain link. */
  docs?: boolean;
}

// What the header links to. An item goes in when its page exists.
export const navigation: NavItem[] = [
  { label: "Docs", href: docs.home, docs: true },
  { label: "Components", href: docs.components, docs: true },
];

// This app's own pages, for the sitemap and the search.
export const pages = [
  {
    path: "/",
    title: "Home",
    description: site.description,
  },
];
