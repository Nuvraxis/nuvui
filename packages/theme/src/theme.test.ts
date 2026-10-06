import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { describe, expect, test } from "vitest";
import { decodeChoice, encodeChoice } from "./code";
import { contrast, toHex, toRgb } from "./color";
import { toCss, toScss, toTailwind } from "./css";
import { palette } from "./palette";
import { presetNames, presets } from "./presets";
import {
  audit,
  bases,
  brands,
  chartColors,
  colorTokens,
  contrasts,
  createTheme,
  densities,
  radii,
  type Theme,
  ThemeError,
} from "./theme";

describe("palette", () => {
  test("is the one in the installed Tailwind CSS", () => {
    const require = createRequire(import.meta.url);
    const css = readFileSync(require.resolve("tailwindcss/theme.css"), "utf8");

    const found = [...css.matchAll(/--color-([a-z]+)-(\d+):\s*([^;]+);/g)];
    expect(found.length).toBeGreaterThan(0);
    for (const [, scale = "", step = "", value = ""] of found) {
      const steps = (palette as Record<string, Record<string, string>>)[scale];
      expect(steps?.[step], `${scale}-${step}`).toBe(value.trim());
    }
    expect(found).toHaveLength(Object.keys(palette).length * 11);
  });
});

describe("color", () => {
  test("converts oklch() the way Tailwind's own hex values say", () => {
    // From the comments in Tailwind's documentation for these colors.
    expect(toHex(palette.blue[600])).toBe("#155dfc");
    expect(toHex(palette.red[500])).toBe("#fb2c36");
    expect(toHex(palette.gray[950])).toBe("#030712");
  });

  test("reads short and long hex colors", () => {
    expect(toRgb("#fff")).toEqual([255, 255, 255]);
    expect(toRgb("#1A2b3C")).toEqual([26, 43, 60]);
  });

  test("refuses anything else", () => {
    expect(() => toRgb("red")).toThrow(/isn't a color/);
    expect(() => toRgb("rgb(0 0 0)")).toThrow(/isn't a color/);
  });

  test("measures contrast the way WCAG defines it", () => {
    expect(contrast("#fff", "#000")).toBe(21);
    expect(contrast("#000", "#fff")).toBe(21);
    expect(contrast("#777", "#777")).toBe(1);
    // The pair WCAG's own examples give as just passing AA.
    expect(contrast("#767676", "#fff")).toBeCloseTo(4.54, 2);
  });
});

const step = (scale: keyof typeof palette, at: keyof typeof palette.gray) =>
  palette[scale][at];

describe("the default theme", () => {
  const theme = createTheme();

  // What packages/ui/src/styles/tokens/_semantic.scss declares. A test in
  // @nuvui/react compares that stylesheet with this theme in a browser.
  test("is the one the library ships", () => {
    expect(theme.light).toEqual({
      "--color-background": "#fff",
      "--color-foreground": step("gray", 950),
      "--color-surface": "#fff",
      "--color-surface-foreground": step("gray", 950),
      "--color-muted": step("gray", 100),
      "--color-muted-foreground": step("gray", 600),
      "--color-primary": step("blue", 600),
      "--color-primary-foreground": "#fff",
      "--color-danger": step("red", 600),
      "--color-danger-foreground": "#fff",
      "--color-success": step("green", 700),
      "--color-warning": step("amber", 700),
      "--color-border": step("gray", 200),
      "--color-border-strong": step("gray", 500),
      "--color-ring": step("blue", 600),
    });
    expect(theme.dark).toEqual({
      "--color-background": step("gray", 950),
      "--color-foreground": step("gray", 50),
      "--color-surface": step("gray", 900),
      "--color-surface-foreground": step("gray", 50),
      "--color-muted": step("gray", 800),
      "--color-muted-foreground": step("gray", 400),
      "--color-primary": step("blue", 400),
      "--color-primary-foreground": step("gray", 950),
      "--color-danger": step("red", 400),
      "--color-danger-foreground": step("gray", 950),
      "--color-success": step("green", 400),
      "--color-warning": step("amber", 400),
      "--color-border": step("gray", 800),
      "--color-border-strong": step("gray", 500),
      "--color-ring": step("blue", 400),
    });
  });

  test("keeps the library's radius scale and control heights", () => {
    expect(theme.shape).toEqual({
      "--radius-xs": "0.125rem",
      "--radius-sm": "0.25rem",
      "--radius-md": "0.375rem",
      "--radius-lg": "0.5rem",
      "--radius-xl": "0.75rem",
      "--nuv-control-height-sm": "2rem",
      "--nuv-control-height-md": "2.5rem",
      "--nuv-control-height-lg": "3rem",
    });
  });

  test("lists its colors in the order the tokens are declared", () => {
    expect(Object.keys(theme.light)).toEqual([...colorTokens]);
    expect(Object.keys(theme.dark)).toEqual([...colorTokens]);
  });
});

// Every brand with every base, at both contrast levels, in light and dark.
describe.each(contrasts)("every theme at %s contrast", (level) => {
  test.each(brands)("%s passes on every base", (brand) => {
    for (const base of bases) {
      const theme = createTheme({ brand, base, contrast: level });
      const failed = audit(theme).filter(({ ratio, needed }) => ratio < needed);
      expect(failed, `${brand} on ${base}`).toEqual([]);
    }
  });
});

describe("picking colors", () => {
  // See the note on headroom in theme.ts.
  test("every pair a theme is made of clears its minimum by 1%", () => {
    for (const level of contrasts) {
      for (const brand of brands) {
        for (const base of bases) {
          const theme = createTheme({ brand, base, contrast: level });
          const tight = audit(theme).filter(
            ({ token, ratio, needed }) =>
              !token.startsWith("--color-chart-") && ratio < needed * 1.01,
          );
          expect(tight, `${brand} on ${base}`).toEqual([]);
        }
      }
    }
  });

  // axe-core can't read the keyword, and then can't check the contrast.
  test('no color is written with a hue of "none"', () => {
    expect(palette.neutral[950]).toContain("none");

    for (const base of bases) {
      const theme = createTheme({ base });
      const values = [
        ...Object.values(theme.light),
        ...Object.values(theme.dark),
      ];
      expect(values.join(" ")).not.toContain("none");
    }
  });

  test("a brand color white can't be read on gets dark text", () => {
    const { light } = createTheme({ brand: "orange" });

    expect(light["--color-primary"]).toBe(palette.orange[600]);
    expect(contrast("#fff", light["--color-primary"])).toBeLessThan(4.5);
    expect(light["--color-primary-foreground"]).toBe(palette.gray[950]);
  });

  test("a brand color that's too pale for a white page moves down its scale", () => {
    const { light } = createTheme({ brand: "yellow" });

    expect(contrast(palette.yellow[600], "#fff")).toBeLessThan(3);
    expect(light["--color-primary"]).toBe(palette.yellow[700]);
  });

  test("the focus ring moves on from the primary color where a muted fill hides it", () => {
    const { light } = createTheme({ brand: "green" });

    expect(light["--color-primary"]).toBe(palette.green[600]);
    expect(contrast(palette.green[600], light["--color-muted"])).toBeLessThan(
      3,
    );
    expect(light["--color-ring"]).toBe(palette.green[700]);
  });

  test("high contrast reaches 7:1 for text and 4.5:1 for controls", () => {
    const theme = createTheme({ contrast: "high" });
    const results = audit(theme).filter(
      ({ token }) => !token.startsWith("--color-chart-"),
    );

    for (const { ratio, needed } of results) {
      expect([7, 4.5]).toContain(needed);
      expect(ratio).toBeGreaterThanOrEqual(needed);
    }
    // Dividers are held to the control minimum as well.
    expect(
      contrast(
        theme.light["--color-border"],
        theme.light["--color-background"],
      ),
    ).toBeGreaterThanOrEqual(4.5);
  });

  test.each(["#ffcc00", "#000000", "#ffffff", "#7c3aed", "#0f0"])(
    "a brand color of your own, %s, is moved until it passes",
    (brand) => {
      const theme = createTheme({ brand: brand as `#${string}` });

      expect(audit(theme).every(({ ratio, needed }) => ratio >= needed)).toBe(
        true,
      );
    },
  );

  test("a color of your own that already passes is used as it is", () => {
    const { light } = createTheme({ brand: "#155dfc" });

    expect(toHex(light["--color-primary"])).toBe("#155dfc");
  });
});

describe("a theme that fails", () => {
  const broken: Theme = {
    ...createTheme(),
    light: { ...createTheme().light, "--color-muted-foreground": "#aaa" },
  };

  test("is reported pair by pair", () => {
    const failed = audit(broken).filter(({ ratio, needed }) => ratio < needed);

    expect(
      failed.map(({ mode, token, against }) => [mode, token, against]),
    ).toEqual([
      ["light", "--color-muted-foreground", "--color-background"],
      ["light", "--color-muted-foreground", "--color-surface"],
      ["light", "--color-muted-foreground", "--color-muted"],
    ]);
  });

  test("names every pair in the error", () => {
    const failed = audit(broken).filter(({ ratio, needed }) => ratio < needed);
    const error = new ThemeError(failed);

    expect(error.failures).toBe(failed);
    expect(error.message).toContain(
      "--color-muted-foreground on --color-background in light is 2.32:1 and needs 4.5:1",
    );
    expect(error.message.split("\n")).toHaveLength(4);
  });
});

describe("the choice", () => {
  test.each([
    [{ brand: "teal-ish" }, /isn't a brand color/],
    [{ base: "blue" }, /isn't a base color/],
    [{ radius: "huge" }, /isn't a radius/],
    [{ density: "tight" }, /isn't a density/],
    [{ contrast: "max" }, /isn't a contrast level/],
    [{ brand: "#12" }, /isn't a brand color/],
    [{ font: 'Inter"; } body { display: none' }, /font family/],
    [{ font: "" }, /font family/],
  ])("%o is refused", (choice, message) => {
    expect(() => createTheme(choice as never)).toThrow(message);
    expect(() => createTheme(choice as never)).toThrow(TypeError);
  });

  test("a font goes in front of the system fonts", () => {
    const { shape } = createTheme({ font: "Public Sans" });

    expect(shape["--font-sans"]).toMatch(/^"Public Sans", -apple-system, /);
  });

  test.each(radii)("radius %s scales the whole radius scale", (radius) => {
    const { shape } = createTheme({ radius });
    const factor = { none: 0, sm: 0.5, md: 1, lg: 1.5, xl: 2 }[radius];

    expect(shape["--radius-md"]).toBe(`${0.375 * factor}rem`);
    expect(shape["--radius-xl"]).toBe(`${0.75 * factor}rem`);
  });

  test.each(densities)(
    "density %s sets the three control heights",
    (density) => {
      const { shape } = createTheme({ density });
      const medium = { compact: 2.25, default: 2.5, comfortable: 2.75 }[
        density
      ];

      expect(shape["--nuv-control-height-sm"]).toBe(`${medium - 0.5}rem`);
      expect(shape["--nuv-control-height-md"]).toBe(`${medium}rem`);
      expect(shape["--nuv-control-height-lg"]).toBe(`${medium + 0.5}rem`);
    },
  );
});

// Machado, Oliveira and Fernandes (2009): what a color looks like with no
// working red, green or blue cones. The matrices apply to linear RGB.
const vision = {
  typical: [
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1],
  ],
  protanopia: [
    [0.152286, 1.052583, -0.204868],
    [0.114503, 0.786281, 0.099216],
    [-0.003882, -0.048116, 1.051998],
  ],
  deuteranopia: [
    [0.367322, 0.860646, -0.227968],
    [0.280085, 0.672501, 0.047413],
    [-0.01182, 0.04294, 0.968881],
  ],
  tritanopia: [
    [1.255528, -0.076749, -0.178779],
    [-0.078411, 0.930809, 0.147602],
    [0.004733, 0.691367, 0.3039],
  ],
} as const;

function seenAs(color: string, matrix: readonly (readonly number[])[]) {
  const [r = 0, g = 0, b = 0] = toRgb(color).map((channel) => {
    const value = channel / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  const [red = 0, green = 0, blue = 0] = matrix.map(([x = 0, y = 0, z = 0]) =>
    Math.min(1, Math.max(0, x * r + y * g + z * b)),
  );

  // To OKLab, where equal distances look about equally different.
  const long = Math.cbrt(
    0.4122214708 * red + 0.5363325363 * green + 0.0514459929 * blue,
  );
  const medium = Math.cbrt(
    0.2119034982 * red + 0.6806995451 * green + 0.1073969566 * blue,
  );
  const short = Math.cbrt(
    0.0883024619 * red + 0.2817188376 * green + 0.6299787005 * blue,
  );
  return [
    0.2104542553 * long + 0.793617785 * medium - 0.0040720468 * short,
    1.9779984951 * long - 2.428592205 * medium + 0.4505937099 * short,
    0.0259040371 * long + 0.7827717662 * medium - 0.808675766 * short,
  ] as const;
}

describe.each(["light", "dark"] as const)("chart colors in %s", (mode) => {
  const colors = chartColors[mode];

  test("there are eight, all different", () => {
    expect(new Set(colors).size).toBe(8);
  });

  // 0.02 is about the smallest difference anyone can see. Neighbours in the
  // sequence sit next to each other in a chart, so they get five times that,
  // and any two colors get two and a half.
  test.each(Object.entries(vision))(
    "they can be told apart with %s vision",
    (_name, matrix) => {
      for (let first = 0; first < colors.length; first += 1) {
        for (let second = first + 1; second < colors.length; second += 1) {
          const a = seenAs(colors[first] ?? "", matrix);
          const b = seenAs(colors[second] ?? "", matrix);
          const distance = Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

          expect(
            distance,
            `chart-${first + 1} and chart-${second + 1}`,
          ).toBeGreaterThanOrEqual(second === first + 1 ? 0.1 : 0.05);
        }
      }
    },
  );
});

describe("CSS for the whole page", () => {
  const theme = createTheme({ brand: "emerald", radius: "lg" });
  const css = toCss(theme);

  test("puts light values where the library puts its own", () => {
    expect(css).toContain(
      `:root,\n[data-theme="light"],\n[data-theme="system"] {\n  --color-background: #fff;`,
    );
  });

  test("writes dark values for data-theme and for the system setting", () => {
    const dark = `--color-primary: ${theme.dark["--color-primary"]};`;

    expect(css).toContain(`[data-theme="dark"] {\n`);
    expect(css).toContain(
      `@media (prefers-color-scheme: dark) {\n  [data-theme="system"] {\n`,
    );
    expect(css.split(dark)).toHaveLength(3);
  });

  test("keeps radius and control heights out of the color blocks", () => {
    expect(css.startsWith(":root {\n  --radius-xs: 0.1875rem;")).toBe(true);
    expect(css.split("--radius-md")).toHaveLength(2);
  });

  test("doesn't use light-dark(), so it works in every browser the library does", () => {
    expect(css).not.toContain("light-dark(");
  });

  test("can be wrapped in a cascade layer", () => {
    const layered = toCss(theme, { layer: "tokens" });

    expect(layered.startsWith("@layer tokens {\n  :root {\n")).toBe(true);
    expect(layered.trimEnd().endsWith("\n}")).toBe(true);
  });
});

describe("CSS for a preset", () => {
  const theme = createTheme(presets.ledger);
  const css = toCss(theme, { preset: "ledger" });

  test("gives both modes as variables, and leaves the semantic colors to the library", () => {
    expect(css).toContain(
      `:root[data-preset="ledger"],\n[data-preset="ledger"] {\n  --nuv-preset-light-background: #fff;`,
    );
    expect(css).toContain(
      `  --nuv-preset-dark-background: ${theme.dark["--color-background"]};`,
    );
    expect(css.match(/--nuv-preset-(light|dark)-/g)).toHaveLength(30);
    expect(css).not.toContain("--color-");
    expect(css).not.toContain("data-theme");
    expect(css).not.toContain("@media");
  });

  test("doesn't use light-dark(), which build tools rewrite in ways that break nesting", () => {
    expect(css).not.toContain("light-dark(");
  });

  test("steps aside for a density set on the same element", () => {
    expect(css).toContain(
      `:root[data-preset="ledger"]:not([data-density]),\n[data-preset="ledger"]:not([data-density]) {\n  --nuv-control-height-sm: 1.75rem;`,
    );
  });

  test.each(["Ledger", "my theme", "1st", 'x"] { }', ""])(
    "the name %o is refused",
    (name) => {
      expect(() => toCss(theme, { preset: name })).toThrow(TypeError);
    },
  );
});

describe("SCSS and Tailwind", () => {
  const theme = createTheme({ brand: "rose", radius: "sm", font: "Inter" });

  test("the SCSS uses the library's dark mixin", () => {
    const scss = toScss(theme);

    expect(scss.startsWith('@use "@nuvui/react/scss/mixins" as nuv;\n')).toBe(
      true,
    );
    expect(scss).toContain(
      `@include nuv.dark {\n  --color-background: ${theme.dark["--color-background"]};`,
    );
  });

  test("the Tailwind version puts the tokens Tailwind knows in @theme", () => {
    const tailwind = toTailwind(theme);
    const [block = "", rest = ""] = tailwind.split("\n}\n\n", 2);

    expect(block.startsWith("@theme {\n  --radius-xs: 0.0625rem;")).toBe(true);
    expect(block).toContain('--font-sans: "Inter", ');
    expect(block).not.toContain("--nuv-");
    expect(rest.startsWith(":root {\n  --nuv-control-height-sm: 2rem;")).toBe(
      true,
    );
    expect(rest).not.toContain("--radius-");
  });
});

describe("theme codes", () => {
  test("the default choice", () => {
    expect(encodeChoice()).toBe("1.blue.gray.md.default.standard");
  });

  test("every preset survives a round trip", () => {
    for (const name of presetNames) {
      expect(decodeChoice(encodeChoice(presets[name]))).toEqual(presets[name]);
    }
  });

  test("every value of every axis survives a round trip", () => {
    for (const brand of [...brands, "#7c3aed", "#abc"] as const) {
      for (const base of bases) {
        const choice = {
          brand,
          base,
          radius: "lg",
          density: "compact",
          contrast: "high",
        } as const;
        expect(decodeChoice(encodeChoice(choice))).toEqual(choice);
      }
    }
    for (const radius of radii) {
      for (const density of densities) {
        for (const level of contrasts) {
          const choice = {
            brand: "blue",
            base: "gray",
            radius,
            density,
            contrast: level,
          } as const;
          expect(decodeChoice(encodeChoice(choice))).toEqual(choice);
        }
      }
    }
  });

  test("a font and a color of your own are kept", () => {
    const code = encodeChoice({ brand: "#7C3AED", font: "Public Sans" });

    expect(code).toBe("1.x7c3aed.gray.md.default.standard.Public+Sans");
    expect(decodeChoice(code)).toMatchObject({
      brand: "#7c3aed",
      font: "Public Sans",
    });
  });

  test("a code is made of characters a URL leaves alone", () => {
    const code = encodeChoice({ brand: "#7c3aed", font: "IBM Plex Sans" });

    expect(encodeURIComponent(code)).toBe(code.replaceAll("+", "%2B"));
    expect(new URL(`https://example.com/?theme=${code}`).search).toBe(
      `?theme=${code}`,
    );
  });

  test.each([
    ["", /can read/],
    ["2.blue.gray.md.default.standard", /can read/],
    ["1.blue.gray.md.default", /complete/],
    ["1.blue.gray.md.default.standard.Inter.extra", /complete/],
    ["1.navy.gray.md.default.standard", /brand color/],
    ["1.xzzzzzz.gray.md.default.standard", /brand color/],
    ["1.blue.gray.md.default.standard.a;b", /font family/],
    ["1.blue.gray.md.default.standard.%22%7D", /font family/],
  ])("%o is refused", (code, message) => {
    expect(() => decodeChoice(code)).toThrow(message);
    expect(() => decodeChoice(code)).toThrow(TypeError);
  });
});

describe("presets", () => {
  test("there are five, and each makes a theme that passes", () => {
    expect(presetNames).toHaveLength(5);
    for (const name of presetNames) {
      expect(() => createTheme(presets[name])).not.toThrow();
    }
  });

  test("between them they cover both ends of radius and density, and high contrast", () => {
    const all = presetNames.map((name) => presets[name]);

    expect(
      all.some(
        ({ radius, density }) => radius === "none" && density === "compact",
      ),
    ).toBe(true);
    expect(
      all.some(
        ({ radius, density }) => radius === "xl" && density === "comfortable",
      ),
    ).toBe(true);
    expect(all.some(({ contrast: level }) => level === "high")).toBe(true);
    expect(new Set(all.map(({ brand }) => brand)).size).toBe(5);
    expect(new Set(all.map(({ base }) => base)).size).toBeGreaterThan(3);
  });
});
