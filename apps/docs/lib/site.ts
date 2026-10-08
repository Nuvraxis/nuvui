export const site = {
  name: "Nuvui",
  packageName: "@nuvui/react",
  description:
    "React components built on Radix UI primitives, styled with SCSS and BEM class names.",
  // No trailing slash. Canonical URLs, the sitemap and OG images are all
  // built from this.
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://nuvui.nuvraxis.com",
  repo: "https://github.com/Nuvraxis/nuvui",
};

// Where the docs app is served. The same value as basePath in
// next.config.ts, which can't import this file.
export const docsBase = "/docs";

/**
 * The path a visitor sees for a path inside this app: /components/button
 * becomes /docs/components/button. Next adds the base path to links and
 * routes, but not to the URLs written into metadata, a sitemap or JSON-LD.
 */
export function docsPath(path: string): string {
  return path === "/" ? docsBase : `${docsBase}${path}`;
}

export function absoluteUrl(path: string): string {
  return new URL(path, site.url).toString();
}
