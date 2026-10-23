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
        //
        // The ask service has no CORS: in the cluster it's on the site's own
        // address. Here it's `pnpm --filter @nuvui/ask start` on port 8080,
        // and the panel reaches it through this server. apps/ask/README.md
        // has the rest.
        async rewrites() {
          return [
            {
              source: "/docs/:path*",
              destination: "http://localhost:3000/docs/:path*",
            },
            { source: "/docs", destination: "http://localhost:3000/docs" },
            {
              source: "/api/ask",
              destination: "http://localhost:8080/api/ask",
            },
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
