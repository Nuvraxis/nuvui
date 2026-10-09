import type { NextConfig } from "next";

const dev = process.env.NODE_ENV === "development";

const config: NextConfig = {
  reactStrictMode: true,
  // The same compiler the library is built with.
  sassOptions: { implementation: "sass-embedded" },
  ...(dev
    ? {
        // The docs are another app, served under /docs. Once built, its
        // files are copied into this app's export, so both are one site. In
        // development this sends /docs to the docs app's own server, which
        // `pnpm dev` at the root starts on port 3000.
        async rewrites() {
          return [
            {
              source: "/docs/:path*",
              destination: "http://localhost:3000/docs/:path*",
            },
            { source: "/docs", destination: "http://localhost:3000/docs" },
          ];
        },
      }
    : {
        // Every page is written to `out` as a plain file, so the site can be
        // hosted anywhere. An export can't have rewrites, which is why this
        // is only set outside development.
        output: "export" as const,
      }),
};

export default config;
