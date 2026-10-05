import { defineConfig } from "fumadocs-mdx/config";
import { codeHighlight } from "./lib/code-themes";

// The content collections themselves are defined in lib/source.ts. This file
// only holds options that apply to every MDX file.
export default defineConfig({
  mdxOptions: {
    rehypeCodeOptions: codeHighlight,
  },
});
