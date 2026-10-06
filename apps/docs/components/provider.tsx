"use client";

import { RootProvider } from "fumadocs-ui/provider/next";
import { type ReactNode, useEffect } from "react";
import SearchDialog from "@/components/search";

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
