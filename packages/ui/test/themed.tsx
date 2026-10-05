import type { ReactNode } from "react";
import { expect } from "vitest";
import { render } from "vitest-browser-react";
import { axe } from "./axe";

export const themes = ["light", "dark"] as const;
export type Theme = (typeof themes)[number];

// Renders inside a themed landmark with the theme's own background, so axe
// measures contrast against the color the component would really sit on.
export function renderThemed(theme: Theme, node: ReactNode) {
  return render(
    <main
      data-theme={theme}
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
// page for the portaled part to pick it up.
export function setPageTheme(theme: Theme) {
  document.documentElement.setAttribute("data-theme", theme);
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
