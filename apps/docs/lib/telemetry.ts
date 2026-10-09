import { createReporter } from "@nuvui/telemetry";

// Where the numbers go is decided when the site is built, by two variables
// Next writes into the pages. Without the first, the reporter does nothing
// and the layout leaves the component out, so nothing is measured. The
// code is still in the pages, a few kilobytes that never run. A build
// made with pnpm build is like that unless someone asks: one on your
// machine, and the tests'. apps/Dockerfile asks, with /otlp.
//
//   NEXT_PUBLIC_OTLP_ENDPOINT  the collector, such as /otlp
//   NEXT_PUBLIC_SITE_VERSION   what was built, such as the commit
//
// apps/showcase/src/lib/telemetry.ts is the same file with another
// name for the service, so the two apps can be told apart on a dashboard.
export const telemetry = createReporter({
  endpoint: process.env.NEXT_PUBLIC_OTLP_ENDPOINT,
  serviceName: "nuvui-docs",
  serviceVersion: process.env.NEXT_PUBLIC_SITE_VERSION,
});
