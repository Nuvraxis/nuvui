import "./index.scss";
import {
  chartColors,
  colorTokens,
  createTheme,
  palette,
  systemFont,
  toHex,
} from "@nuvui/theme";
import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-react";
import { axe } from "../../test/axe";
import { contrast, toRgb } from "../../test/contrast";
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

// What the browser makes of a color, so two ways of writing the same color
// compare equal.
function computed(color: string, inside: Element = document.body): string {
  const probe = document.createElement("span");
  probe.style.color = color;
  inside.append(probe);
  const value = getComputedStyle(probe).color;
  probe.remove();
  return value;
}

// The theme generator in @nuvui/theme and this stylesheet are written
// separately. These tests are what keeps them the same.
describe("the theme generator", () => {
  const theme = createTheme();

  test.each(["light", "dark"] as const)(
    "its default theme is this stylesheet's, in %s",
    async (mode) => {
      const screen = await render(
        <div data-theme={mode} data-testid="scope" />,
      );
      const scope = screen.getByTestId("scope").element();

      for (const name of colorTokens) {
        expect(computed(`var(${name})`, scope), name).toBe(
          computed(theme[mode][name]),
        );
      }
    },
  );

  test("its default radius scale and control heights are this stylesheet's", () => {
    for (const [name, value] of Object.entries(theme.shape)) {
      expect(token(name), name).toBe(value);
    }
  });

  test("its system font stack is --font-sans", () => {
    const plain = (stack: string) => stack.replace(/\s+/g, " ").trim();

    expect(plain(token("--font-sans"))).toBe(plain(systemFont));
  });

  test.each(["light", "dark"] as const)(
    "its chart colors are --color-chart-1 to 8, in %s",
    async (mode) => {
      const screen = await render(
        <div data-theme={mode} data-testid="scope" />,
      );
      const scope = screen.getByTestId("scope").element();

      chartColors[mode].forEach((color, index) => {
        expect(computed(`var(--color-chart-${index + 1})`, scope)).toBe(
          computed(color),
        );
      });
      expect(token("--color-chart-9", scope)).toBe("");
    },
  );

  // The generator decides what passes from its own arithmetic. This paints
  // every color of every scale, to show the arithmetic agrees with the
  // screen. A channel may round one step the other way, and the generator
  // picks colors with room to spare for that.
  test("works out the colors this browser paints", () => {
    for (const [scale, shades] of Object.entries(palette)) {
      for (const [step, color] of Object.entries(shades)) {
        const painted = toRgb(color);
        const worked = [1, 3, 5].map((at) =>
          Number.parseInt(toHex(color).slice(at, at + 2), 16),
        );

        painted.forEach((channel, index) => {
          expect(
            Math.abs(channel - (worked[index] ?? Number.NaN)),
            `${scale}-${step}: painted ${painted}, worked out ${worked}`,
          ).toBeLessThanOrEqual(1);
        });
      }
    }
  });
});

describe("chart colors", () => {
  test.each(["light", "dark"] as const)(
    "each can be seen against the page and a surface in %s",
    async (theme) => {
      const screen = await render(
        <div data-theme={theme} data-testid="scope" />,
      );
      const scope = screen.getByTestId("scope").element();

      for (let index = 1; index <= 8; index += 1) {
        for (const background of ["background", "surface"]) {
          const ratio = contrast(
            token(`--color-chart-${index}`, scope),
            token(`--color-${background}`, scope),
          );
          expect(
            ratio,
            `chart-${index} on ${background}`,
          ).toBeGreaterThanOrEqual(3);
        }
      }
    },
  );
});
