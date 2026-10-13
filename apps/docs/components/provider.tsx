"use client";

import { setMapWorkerUrl } from "@nuvui/map";
import { RootProvider } from "fumadocs-ui/provider/next";
import { type ReactNode, useEffect } from "react";
import SearchDialog from "@/components/search";

// Where the maps in the examples find MapLibre's worker. The bundler gives
// the file an address of its own, and this is how it's asked for one.
setMapWorkerUrl(
  new URL("maplibre-gl/dist/maplibre-gl-worker.mjs", import.meta.url),
);

export function Provider({ children }: { children: ReactNode }) {
  // A parent's effect runs after its children's, so by now every handler on
  // the page is attached. The pages are static HTML and look finished long
  // before that, and the end-to-end tests wait for this before they type or
  // click.
  useEffect(() => {
    document.documentElement.setAttribute("data-hydrated", "");
  }, []);

  return (
    <RootProvider
      search={{ SearchDialog }}
      // Fumadocs styles itself off a `dark` class. The component library
      // reads data-theme. Setting both keeps the previews in step with the
      // rest of the page.
      theme={{ attribute: ["class", "data-theme"] }}
    >
      {children}
    </RootProvider>
  );
}
