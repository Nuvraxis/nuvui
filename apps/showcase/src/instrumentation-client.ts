import { markNavigation } from "@nuvui/telemetry";
import { telemetry } from "@/lib/telemetry";

// Next loads this file in the browser before React starts, and calls this
// function when a navigation inside the app begins. components/telemetry.tsx
// measures from the mark to the new page's first paint.
export function onRouterTransitionStart(_url: string, type: string) {
  if (telemetry.enabled) markNavigation(type);
}
