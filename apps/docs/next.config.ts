import { createMDX } from "fumadocs-mdx/next";
import type { NextConfig } from "next";

const withMDX = createMDX();

const config: NextConfig = {
  // Every page, the search index and the OG images are written to `out` as
  // plain files, so the site can be hosted anywhere.
  output: "export",
  reactStrictMode: true,
};

export default withMDX(config);
