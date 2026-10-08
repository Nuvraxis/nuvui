import { createMDX } from "fumadocs-mdx/next";
import type { NextConfig } from "next";

const withMDX = createMDX();

const config: NextConfig = {
  // Every page, the search index and the OG images are written to `out` as
  // plain files, so the site can be hosted anywhere.
  output: "export",
  // The docs are one part of the site. The website, apps/showcase, is served
  // at / and copies this app's export into its own under /docs. With a base
  // path every link, route and file of this app is under /docs already, so
  // the copy needs nothing rewritten. lib/site.ts has the same value.
  basePath: "/docs",
  reactStrictMode: true,
  // Only the SCSS guide's example needs Sass. It's compiled here, by the
  // same compiler the library uses, so the guide can't describe a setup
  // that doesn't work.
  sassOptions: { implementation: "sass-embedded" },
};

export default withMDX(config);
