import "./index.scss";
import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-react";
import { axe } from "../../test/axe";
import { contrast } from "../../test/contrast";
import { emulateMedia } from "../../test/media";

const root = document.documentElement;

function token(name: string, element: Element = root): string {
  return getComputedStyle(element).getPropertyValue(name).trim();
}

describe("themes", () => {
  test("light is the default", () => {
    expect(token("--color-background")).toBe(token("--color-white"));
  });

  test("a dark system preference alone changes nothing", async () => {
    await emulateMedia({ colorScheme: "dark" });

    expect(token("--color-background")).toBe(token("--color-white"));
  });

  test("the library leaves color-scheme alone until a theme is set", () => {
    expect(getComputedStyle(root).colorScheme).toBe("normal");
  });

  test('data-theme="dark" switches to dark', () => {
    root.setAttribute("data-theme", "dark");

    expect(token("--color-background")).toBe(token("--color-gray-950"));
    expect(getComputedStyle(root).colorScheme).toBe("dark");
  });

  test('data-theme="light" stays light under a dark system preference', async () => {
    await emulateMedia({ colorScheme: "dark" });
    root.setAttribute("data-theme", "light");

    expect(token("--color-background")).toBe(token("--color-white"));
    expect(getComputedStyle(root).colorScheme).toBe("light");
  });

  test('data-theme="system" follows the system preference', async () => {
    root.setAttribute("data-theme", "system");

    await emulateMedia({ colorScheme: "light" });
    expect(token("--color-background")).toBe(token("--color-white"));

    await emulateMedia({ colorScheme: "dark" });
    expect(token("--color-background")).toBe(token("--color-gray-950"));

    expect(getComputedStyle(root).colorScheme).toBe("light dark");
  });

  test("a theme can be set on part of the page, and nested", async () => {
    const screen = await render(
      <div data-theme="dark" data-testid="dark">
        <div data-theme="light" data-testid="light" />
        <div data-theme="system" data-testid="system" />
      </div>,
    );
    const dark = screen.getByTestId("dark").element();
    const light = screen.getByTestId("light").element();
    const system = screen.getByTestId("system").element();

    expect(token("--color-background", dark)).toBe(token("--color-gray-950"));
    expect(token("--color-background", light)).toBe(token("--color-white"));
    // The system here is light, so this section resets to light instead of
    // inheriting dark from its parent.
    expect(token("--color-background", system)).toBe(token("--color-white"));
    expect(token("--color-background")).toBe(token("--color-white"));
  });
});

describe("overriding", () => {
  test("a consumer's rule wins without needing more specificity", () => {
    const style = document.createElement("style");
    // :where() has zero specificity, lower than the library's own :root.
    // It still wins because the tokens sit in a cascade layer.
    style.textContent = ":where(html) { --radius-md: 1rem; }";
    document.head.prepend(style);

    try {
      expect(token("--radius-md")).toBe("1rem");
    } finally {
      style.remove();
    }
  });
});

// Foreground on background, as text. WCAG AA asks for 4.5:1.
const textPairs = [
  ["foreground", "background"],
  ["foreground", "muted"],
  ["surface-foreground", "surface"],
  ["muted-foreground", "background"],
  ["muted-foreground", "surface"],
  ["muted-foreground", "muted"],
  ["primary-foreground", "primary"],
  ["primary", "background"],
  ["primary", "surface"],
  ["danger-foreground", "danger"],
  ["danger", "background"],
  ["danger", "surface"],
  ["success", "background"],
  ["success", "surface"],
  ["warning", "background"],
  ["warning", "surface"],
] as const;

// Focus rings and control edges aren't text, so the bar is 3:1 (WCAG 1.4.11).
// --color-border isn't here on purpose: it's a divider color, not something
// a control depends on to be found.
const nonTextPairs = [
  ["ring", "background"],
  ["ring", "surface"],
  ["ring", "muted"],
  ["border-strong", "background"],
  ["border-strong", "surface"],
  ["border-strong", "muted"],
] as const;

describe.each(["light", "dark"] as const)("contrast in %s", (theme) => {
  test("text pairs pass axe", async () => {
    const screen = await render(
      <main data-theme={theme}>
        {textPairs.map(([foreground, background]) => (
          <p
            key={`${foreground}-${background}`}
            style={{
              color: `var(--color-${foreground})`,
              backgroundColor: `var(--color-${background})`,
            }}
          >
            {foreground} on {background}
          </p>
        ))}
      </main>,
    );

    const results = await axe(screen.container);

    expect(results).toHaveNoViolations();
    // "Incomplete" means axe couldn't work a pair out. That must not pass
    // for a clean result, so every swatch has to be counted as checked.
    const checked = results.passes.find((rule) => rule.id === "color-contrast");
    expect(checked?.nodes).toHaveLength(textPairs.length);
  });

  test.each(nonTextPairs)(
    "%s is visible against %s",
    async (color, background) => {
      const screen = await render(
        <div data-theme={theme} data-testid="scope" />,
      );
      const scope = screen.getByTestId("scope").element();

      const ratio = contrast(
        token(`--color-${color}`, scope),
        token(`--color-${background}`, scope),
      );

      expect(ratio).toBeGreaterThanOrEqual(3);
    },
  );
});
