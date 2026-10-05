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

export function absoluteUrl(path: string): string {
  return new URL(path, site.url).toString();
}
