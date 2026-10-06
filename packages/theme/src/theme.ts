import { contrast, formatOklch, isHex, toOklch } from "./color";
import { palette, type Scale, type Step, steps } from "./palette";

export const brands = [
  "red",
  "orange",
  "amber",
  "yellow",
  "lime",
  "green",
  "emerald",
  "teal",
  "cyan",
  "sky",
  "blue",
  "indigo",
  "violet",
  "purple",
  "fuchsia",
  "pink",
  "rose",
] as const satisfies readonly Scale[];

export const bases = [
  "slate",
  "gray",
  "zinc",
  "neutral",
  "stone",
  "mauve",
  "olive",
  "mist",
  "taupe",
] as const satisfies readonly Scale[];

export const radii = ["none", "sm", "md", "lg", "xl"] as const;
export const densities = ["compact", "default", "comfortable"] as const;
export const contrasts = ["standard", "high"] as const;

export type Brand = (typeof brands)[number];
export type Base = (typeof bases)[number];
export type Radius = (typeof radii)[number];
export type Density = (typeof densities)[number];
export type ContrastLevel = (typeof contrasts)[number];
export type Mode = "light" | "dark";

export interface ThemeChoice {
  /** One of Tailwind's hues, or a color of your own as `#rrggbb`. */
  brand: Brand | `#${string}`;
  /** The neutral scale behind backgrounds, text and borders. */
  base: Base;
  radius: Radius;
  /** How tall controls are with a mouse. Touch screens keep 44 pixels. */
  density: Density;
  /** `standard` is WCAG AA: 4.5:1 for text and 3:1 for controls. `high` is 7:1 and 4.5:1. */
  contrast: ContrastLevel;
  /** A font family to put in front of the system fonts. Loading it is up to the page. */
  font?: string;
}

export const defaultChoice = {
  brand: "blue",
  base: "gray",
  radius: "md",
  density: "default",
  contrast: "standard",
} as const satisfies ThemeChoice;

export const colorTokens = [
  "--color-background",
  "--color-foreground",
  "--color-surface",
  "--color-surface-foreground",
  "--color-muted",
  "--color-muted-foreground",
  "--color-primary",
  "--color-primary-foreground",
  "--color-danger",
  "--color-danger-foreground",
  "--color-success",
  "--color-warning",
  "--color-border",
  "--color-border-strong",
  "--color-ring",
] as const;

export type ColorToken = (typeof colorTokens)[number];
export type Colors = Record<ColorToken, string>;

export interface Theme {
  /** The choice this theme was made from, with every default filled in. */
  choice: ThemeChoice;
  light: Colors;
  dark: Colors;
  /** Tokens that are the same in light and dark: radius, control heights and the font. */
  shape: Record<string, string>;
}

export interface ContrastResult {
  mode: Mode;
  /** The color drawn on top. */
  token: string;
  /** What it's drawn on. */
  against: string;
  ratio: number;
  /** The ratio the pair has to reach. */
  needed: number;
}

export class ThemeError extends Error {
  readonly failures: ContrastResult[];

  constructor(failures: ContrastResult[]) {
    const lines = failures.map(
      ({ mode, token, against, ratio, needed }) =>
        `${token} on ${against} in ${mode} is ${ratio.toFixed(2)}:1 and needs ${needed}:1`,
    );
    super(`This theme doesn't have enough contrast:\n${lines.join("\n")}`);
    this.name = "ThemeError";
    this.failures = failures;
  }
}

// Same stack as --font-sans in @nuvui/react, which is Tailwind's.
export const systemFont =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", "Noto Sans", Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"';

// A font name ends up inside a stylesheet, and a choice can come from a URL.
// Letters, digits, spaces, hyphens and underscores are all a family name
// needs, and none of them can end the declaration it's written into.
const fontPattern = /^[\p{L}\p{N}][\p{L}\p{N} _-]{0,63}$/u;

const radiusScale = { xs: 0.125, sm: 0.25, md: 0.375, lg: 0.5, xl: 0.75 };
const radiusFactor: Record<Radius, number> = {
  none: 0,
  sm: 0.5,
  md: 1,
  lg: 1.5,
  xl: 2,
};

const controlHeights: Record<Density, Record<"sm" | "md" | "lg", number>> = {
  compact: { sm: 1.75, md: 2.25, lg: 2.75 },
  default: { sm: 2, md: 2.5, lg: 3 },
  comfortable: { sm: 2.25, md: 2.75, lg: 3.25 },
};

// Always with a unit, so a zero still works inside calc().
const rem = (value: number) => `${Number(value.toFixed(4))}rem`;

const white = "#fff";

const minimums: Record<ContrastLevel, { text: number; control: number }> = {
  standard: { text: 4.5, control: 3 },
  high: { text: 7, control: 4.5 },
};

// A browser rounds each channel of a color to a whole number, and now and
// then rounds one a step differently from the arithmetic here. Measured over
// Tailwind's palette that moves a ratio by under 1%. Colors are picked with
// that much to spare, so a theme that passes here still passes when it's
// measured on a screen.
const headroom = 1.01;

type Kind = "text" | "control";
type Pair = [token: ColorToken, against: ColorToken, kind: Kind];

// Every pair of colors the components put on top of each other. Text has to
// reach the text minimum. A control's edge, a filled control and the focus
// ring have to reach the control minimum against what's around them.
const pairs: Pair[] = [
  ["--color-foreground", "--color-background", "text"],
  ["--color-foreground", "--color-muted", "text"],
  ["--color-surface-foreground", "--color-surface", "text"],
  ["--color-muted-foreground", "--color-background", "text"],
  ["--color-muted-foreground", "--color-surface", "text"],
  ["--color-muted-foreground", "--color-muted", "text"],
  ["--color-primary-foreground", "--color-primary", "text"],
  ["--color-primary", "--color-background", "control"],
  ["--color-primary", "--color-surface", "control"],
  ["--color-danger-foreground", "--color-danger", "text"],
  ["--color-danger", "--color-background", "text"],
  ["--color-danger", "--color-surface", "text"],
  ["--color-success", "--color-background", "text"],
  ["--color-success", "--color-surface", "text"],
  ["--color-warning", "--color-background", "text"],
  ["--color-warning", "--color-surface", "text"],
  ["--color-border-strong", "--color-background", "control"],
  ["--color-border-strong", "--color-surface", "control"],
  ["--color-border-strong", "--color-muted", "control"],
  ["--color-ring", "--color-background", "control"],
  ["--color-ring", "--color-surface", "control"],
  ["--color-ring", "--color-muted", "control"],
];

// With high contrast, dividers count as something you have to be able to see.
const highContrastPairs: Pair[] = [
  ["--color-border", "--color-background", "control"],
  ["--color-border", "--color-surface", "control"],
];

function pairsFor(level: ContrastLevel): Pair[] {
  return level === "high" ? [...pairs, ...highContrastPairs] : pairs;
}

/**
 * Eight colors for chart series, the values of `--color-chart-1` to
 * `--color-chart-8`. They don't change with the theme. Each reaches 3:1
 * against the page and against a surface, and they're ordered so that
 * neighbours stay apart for people with the common kinds of color blindness.
 */
export const chartColors: Record<Mode, readonly string[]> = {
  light: [
    palette.blue[600],
    palette.orange[800],
    palette.teal[700],
    palette.violet[800],
    palette.amber[600],
    palette.pink[700],
    palette.cyan[600],
    palette.red[600],
  ],
  dark: [
    palette.blue[400],
    palette.orange[400],
    palette.teal[400],
    palette.violet[500],
    palette.amber[300],
    palette.pink[500],
    palette.cyan[300],
    palette.red[300],
  ],
};

/** The ratio of every pair the rules cover, chart colors included. */
export function audit(theme: Theme): ContrastResult[] {
  const minimum = minimums[theme.choice.contrast];
  const results: ContrastResult[] = [];

  for (const mode of ["light", "dark"] as const) {
    const colors = theme[mode];
    for (const [token, against, kind] of pairsFor(theme.choice.contrast)) {
      results.push({
        mode,
        token,
        against,
        ratio: contrast(colors[token], colors[against]),
        needed: minimum[kind],
      });
    }

    chartColors[mode].forEach((color, index) => {
      for (const against of [
        "--color-background",
        "--color-surface",
      ] as const) {
        results.push({
          mode,
          token: `--color-chart-${index + 1}`,
          against,
          ratio: contrast(color, colors[against]),
          // Chart colors are fixed, so they're held to AA at either level.
          needed: minimums.standard.control,
        });
      }
    });
  }

  return results;
}

// Tailwind writes the hue of a pure gray as "none". That's valid CSS, and a
// gray has no hue to speak of, but not every tool that reads a stylesheet
// knows the keyword: axe-core gives up on the color and reports that it
// couldn't measure the contrast. A hue of 0 is the same gray.
function shade(scale: Scale, step: Step): string {
  return palette[scale][step].replace(" none)", " 0)");
}

// The steps of a scale from `from` towards more contrast: darker in light,
// lighter in dark.
function ladder(scale: Scale, from: Step, mode: Mode): string[] {
  const ordered = mode === "light" ? steps : [...steps].reverse();
  return ordered.slice(ordered.indexOf(from)).map((step) => shade(scale, step));
}

// The same for a color that isn't on a scale: its lightness moves 2% at a
// time and its hue and chroma stay.
function customLadder(color: string, mode: Mode): string[] {
  const start = toOklch(color);
  const rungs = [formatOklch(start)];
  for (let step = 1; step <= 50; step += 1) {
    const l = start.l + (mode === "light" ? -0.02 : 0.02) * step;
    if (l < 0 || l > 1) break;
    rungs.push(formatOklch({ ...start, l }));
  }
  return rungs;
}

function brandLadder(
  brand: ThemeChoice["brand"],
  from: Step,
  mode: Mode,
): string[] {
  return isHex(brand)
    ? customLadder(brand, mode)
    : ladder(brand as Brand, from, mode);
}

function buildColors(choice: ThemeChoice, mode: Mode): Colors {
  const base = (step: Step) => shade(choice.base, step);
  const minimum = minimums[choice.contrast];
  const rules = pairsFor(choice.contrast);
  const light = mode === "light";
  const colors: Partial<Colors> = {};

  // Whether `color` as `token` reaches its minimum against every color
  // that's already decided.
  const fits = (token: ColorToken, color: string) =>
    rules.every(([first, second, kind]) => {
      const other =
        first === token ? second : second === token ? first : undefined;
      const decided = other && colors[other];
      return !decided || contrast(color, decided) >= minimum[kind] * headroom;
    });

  // The first candidate that fits. If none does, the last one is kept and
  // the audit that follows reports the pair that fell short.
  const choose = (token: ColorToken, candidates: string[]) => {
    colors[token] =
      candidates.find((color) => fits(token, color)) ?? candidates.at(-1);
  };

  // A filled color and the text on it are picked together. White is tried
  // first on a light theme and the darkest base color first on a dark one,
  // and the fill moves on a step when neither can be read on it.
  const chooseFill = (
    token: ColorToken,
    foreground: ColorToken,
    candidates: string[],
  ) => {
    const texts = light ? [white, base(950)] : [base(950), white];
    for (const fill of candidates) {
      if (!fits(token, fill)) continue;
      const text = texts.find(
        (color) => contrast(color, fill) >= minimum.text * headroom,
      );
      if (!text) continue;
      colors[token] = fill;
      colors[foreground] = text;
      return;
    }
    colors[token] = candidates.at(-1);
    colors[foreground] = texts[0];
  };

  colors["--color-background"] = light ? white : base(950);
  colors["--color-foreground"] = light ? base(950) : base(50);
  colors["--color-surface"] = light ? white : base(900);
  colors["--color-surface-foreground"] = light ? base(950) : base(50);
  colors["--color-muted"] = light ? base(100) : base(800);

  const high = choice.contrast === "high";
  const tone = light ? 600 : 400;

  choose("--color-muted-foreground", ladder(choice.base, tone, mode));
  choose(
    "--color-border",
    ladder(choice.base, light ? (high ? 400 : 200) : high ? 600 : 800, mode),
  );
  choose("--color-border-strong", ladder(choice.base, 500, mode));

  const brand = brandLadder(choice.brand, tone, mode);
  chooseFill("--color-primary", "--color-primary-foreground", brand);
  // The ring starts from the primary color and only moves on where that
  // can't be seen against a muted fill.
  const primary = colors["--color-primary"] ?? "";
  choose("--color-ring", brand.slice(Math.max(0, brand.indexOf(primary))));

  chooseFill(
    "--color-danger",
    "--color-danger-foreground",
    ladder("red", tone, mode),
  );
  choose("--color-success", ladder("green", light ? 700 : 400, mode));
  choose("--color-warning", ladder("amber", light ? 700 : 400, mode));

  // In the order the tokens are listed, whatever order they were picked in.
  return Object.fromEntries(
    colorTokens.map((token) => [token, colors[token]]),
  ) as Colors;
}

function buildShape(choice: ThemeChoice): Record<string, string> {
  const shape: Record<string, string> = {};

  for (const [name, size] of Object.entries(radiusScale)) {
    shape[`--radius-${name}`] = rem(size * radiusFactor[choice.radius]);
  }
  for (const [name, size] of Object.entries(controlHeights[choice.density])) {
    shape[`--nuv-control-height-${name}`] = rem(size);
  }
  if (choice.font) shape["--font-sans"] = `"${choice.font}", ${systemFont}`;

  return shape;
}

function oneOf<T extends string>(
  name: string,
  value: string,
  allowed: readonly T[],
): T {
  if (allowed.includes(value as T)) return value as T;
  throw new TypeError(
    `"${value}" isn't a ${name}. It can be ${allowed.join(", ")}.`,
  );
}

/** Fills in the defaults and throws a TypeError on a value that isn't allowed. */
export function resolveChoice(choice: Partial<ThemeChoice> = {}): ThemeChoice {
  const merged = { ...defaultChoice, ...choice };

  if (!isHex(merged.brand)) oneOf("brand color", merged.brand, brands);
  if (merged.font !== undefined && !fontPattern.test(merged.font)) {
    throw new TypeError(
      `"${merged.font}" can't be used as a font family. Use letters, digits, spaces, hyphens and underscores, up to 64 characters.`,
    );
  }

  const resolved: ThemeChoice = {
    brand: isHex(merged.brand)
      ? (merged.brand.toLowerCase() as `#${string}`)
      : merged.brand,
    base: oneOf("base color", merged.base, bases),
    radius: oneOf("radius", merged.radius, radii),
    density: oneOf("density", merged.density, densities),
    contrast: oneOf("contrast level", merged.contrast, contrasts),
  };
  if (merged.font !== undefined) resolved.font = merged.font;
  return resolved;
}

/**
 * Works out the token values for a choice. Each color is picked by measuring
 * its contrast against the colors it's used with, starting from the step the
 * default theme uses and moving along the scale until it passes.
 *
 * Throws a ThemeError that names every failing pair if the result still
 * doesn't pass, so a theme you get back is one that does.
 */
export function createTheme(choice: Partial<ThemeChoice> = {}): Theme {
  const resolved = resolveChoice(choice);
  const theme: Theme = {
    choice: resolved,
    light: buildColors(resolved, "light"),
    dark: buildColors(resolved, "dark"),
    shape: buildShape(resolved),
  };

  const failures = audit(theme).filter(({ ratio, needed }) => ratio < needed);
  if (failures.length > 0) throw new ThemeError(failures);
  return theme;
}
