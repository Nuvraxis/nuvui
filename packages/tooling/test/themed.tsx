import { presetNames } from "@nuvui/theme";
import type { ReactNode } from "react";
import { expect } from "vitest";
import { render } from "vitest-browser-react";
import { axe } from "./axe";

const modes = ["light", "dark"] as const;

// The default theme in both modes, then every preset in both: "light",
// "dark", "ink light", "ink dark" and so on. A test that runs once per entry
// covers every theme the package ships.
export const themes = [
  ...modes,
  ...presetNames.flatMap((preset) =>
    modes.map((mode) => `${preset} ${mode}` as const),
  ),
];
export type Theme = (typeof themes)[number];

// The attributes that put an element, and everything inside it, in a theme.
export function themeAttributes(theme: Theme): Record<string, string> {
  const [first = "light", second] = theme.split(" ");
  return second
    ? { "data-theme": second, "data-preset": first }
    : { "data-theme": first };
}

// Renders inside a themed landmark with the theme's own background, so axe
// measures contrast against the color the component would really sit on.
export function renderThemed(theme: Theme, node: ReactNode) {
  return render(
    <main
      {...themeAttributes(theme)}
      style={{
        padding: 16,
        backgroundColor: "var(--color-background)",
        color: "var(--color-foreground)",
      }}
    >
      {node}
    </main>,
  );
}

// For components that render in a portal, where the theme has to be on the
// page for the portaled part to pick it up. The page gets the theme's own
// background and text color as well. Without them, what a test renders
// straight into the page, a label say, sits on whatever the browser paints
// behind a page with no styles, and browsers differ on that inside a frame.
// test/setup.ts takes all of it off again.
export function setPageTheme(theme: Theme) {
  for (const [name, value] of Object.entries(themeAttributes(theme))) {
    document.documentElement.setAttribute(name, value);
  }
  document.body.style.backgroundColor = "var(--color-background)";
  document.body.style.color = "var(--color-foreground)";
}

export async function expectNoViolations(element: Element) {
  expect(await axe(element)).toHaveNoViolations();
}

// The element a tap at this offset from the control's center would land on.
export function hitAt(element: Element, dx: number, dy: number) {
  const rect = element.getBoundingClientRect();
  return document.elementFromPoint(
    rect.left + rect.width / 2 + dx,
    rect.top + rect.height / 2 + dy,
  );
}
