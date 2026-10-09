"use client";

import { useEffect } from "react";

// Marks the page once React has attached its handlers. The pages are static
// HTML and look finished long before that, and the end-to-end tests wait
// for this before they type or click. It's rendered last in the layout: an
// effect runs after those of everything rendered before it.
export function Hydrated() {
  useEffect(() => {
    document.documentElement.setAttribute("data-hydrated", "");
  }, []);
  return null;
}
