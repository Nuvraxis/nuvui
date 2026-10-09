"use client";

import { afterPaint, takeNavigation, type VitalMetric } from "@nuvui/telemetry";
import { usePathname } from "next/navigation";
import { useReportWebVitals } from "next/web-vitals";
import { useEffect } from "react";
import { telemetry } from "@/lib/telemetry";

// Outside the component, so it's the same function on every render. The
// hook reports everything again to a function it hasn't seen.
const report = (metric: VitalMetric) => telemetry.vital(metric);

/**
 * Sends the page's web vitals, and how long each navigation inside the app
 * took, to the collector. The layout renders it only in a build that was
 * given one.
 */
export function Telemetry() {
  useReportWebVitals(report);

  // The address changing is the new page being rendered. Where the
  // navigation started is a mark that instrumentation-client.ts left. On
  // the first page there's none, and nothing to report.
  const pathname = usePathname();
  // biome-ignore lint/correctness/useExhaustiveDependencies: the address isn't read, it's what says a navigation ended
  useEffect(
    () =>
      afterPaint(() => {
        const navigation = takeNavigation();
        if (navigation) {
          telemetry.navigation(navigation.duration, navigation.type);
        }
      }),
    [pathname],
  );

  return null;
}
