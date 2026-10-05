import { createMDX } from "fumadocs-mdx/next";
import type { NextConfig } from "next";

const withMDX = createMDX();

const config: NextConfig = {
  // Every page, the search index and the OG images are written to `out` as
  // plain files, so the site can be hosted anywhere.
  output: "export",
  reactStrictMode: true,
  // Only the SCSS guide's example needs Sass. It's compiled here, by the
  // same compiler the library uses, so the guide can't describe a setup
  // that doesn't work.
  sassOptions: { implementation: "sass-embedded" },
};

export default withMDX(config);
