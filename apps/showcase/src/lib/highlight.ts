import { codeToHtml } from "shiki";

// The docs' code blocks use the same two themes, with the same change.
// GitHub's default themes put red and orange tokens and gray comments on a
// light gray block, which misses WCAG AA at code font sizes. These are the
// same palette with more contrast.
const themes = {
  light: "github-light-high-contrast",
  dark: "github-dark-high-contrast",
} as const;

const colorReplacements = {
  // Comments in the light theme are 4.46:1 on the block's background. One
  // step darker clears 4.5:1.
  "github-light-high-contrast": { "#66707b": "#59636e" },
};

/**
 * Code as HTML, colored when the site is built. Nothing is highlighted in
 * the browser. Each token carries both themes' colors as custom properties,
 * and the stylesheet picks one by the page's theme.
 */
export function highlight(code: string, lang: "tsx" | "css" | "scss") {
  return codeToHtml(code, {
    lang,
    themes,
    colorReplacements,
    // No color of its own on any element: without this the light theme's
    // would be written inline and the dark theme would have to override it.
    defaultColor: false,
  });
}
