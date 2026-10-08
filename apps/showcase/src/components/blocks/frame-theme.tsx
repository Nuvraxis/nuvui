"use client";

import { useEffect } from "react";
import { redraw } from "@/lib/site-theme";
import { isTheme, themeKey } from "@/lib/theme";

// A block's preview is a page of its own, shown in a frame on another page.
// It gets the theme the way every page does, from the scripts in <head>.
// This keeps it in step afterwards: a browser tells every other page of a
// site when one of them writes to localStorage, and a page in a frame is
// one of them. So is the same preview opened in a tab of its own.
export function FrameTheme() {
  useEffect(() => {
    const follow = () => {
      let theme: string | null = null;
      try {
        theme = localStorage.getItem(themeKey);
      } catch {
        // Storage is off, and then nothing was stored to follow.
      }
      document.documentElement.setAttribute(
        "data-theme",
        isTheme(theme) ? theme : "system",
      );
      redraw();
    };
    window.addEventListener("storage", follow);
    return () => window.removeEventListener("storage", follow);
  }, []);

  return null;
}
