import { type ColorToken, colorTokens, type Mode, type Theme } from "./theme";

export interface CssOptions {
  /**
   * Writes the theme for `[data-preset="<name>"]` instead of for the whole
   * page. Several presets can then be loaded at once and picked by
   * attribute, on `<html>` or on one section.
   *
   * A preset doesn't set the semantic colors itself. It gives both of its
   * modes as `--nuv-preset-light-*` and `--nuv-preset-dark-*` variables,
   * and a rule in @nuvui/react's tokens picks between them wherever
   * `data-theme` is set. That keeps the nearest `data-theme` in charge of
   * the mode however presets and modes are nested, in every browser the
   * library supports.
   */
  preset?: string;
  /** Wraps the CSS in this cascade layer. */
  layer?: string;
}

const presetPattern = /^[a-z][a-z0-9-]*$/;

const declarations = (values: Record<string, string>, indent = "  ") =>
  Object.entries(values).map(([name, value]) => `${indent}${name}: ${value};`);

const rule = (selectors: string[], lines: string[], indent = "") =>
  `${selectors.map((selector) => indent + selector).join(",\n")} {\n${lines
    .map((line) => indent + line)
    .join("\n")}\n${indent}}`;

const controlHeight = /^--nuv-control-height-/;

function split(shape: Record<string, string>) {
  const heights: Record<string, string> = {};
  const rest: Record<string, string> = {};
  for (const [name, value] of Object.entries(shape)) {
    (controlHeight.test(name) ? heights : rest)[name] = value;
  }
  return { heights, rest };
}

function wrap(css: string, layer: string | undefined): string {
  if (!layer) return `${css}\n`;
  const indented = css
    .split("\n")
    .map((line) => (line ? `  ${line}` : line))
    .join("\n");
  return `@layer ${layer} {\n${indented}\n}\n`;
}

/** The variable a preset gives a color in: `--nuv-preset-light-primary` for `--color-primary`. */
export function presetVariable(mode: Mode, token: ColorToken): string {
  return token.replace("--color-", `--nuv-preset-${mode}-`);
}

function presetCss(theme: Theme, preset: string): string {
  if (!presetPattern.test(preset)) {
    throw new TypeError(
      `"${preset}" can't be a preset name. Use lowercase letters, digits and hyphens, starting with a letter.`,
    );
  }

  const scope = `[data-preset="${preset}"]`;
  // :root alone has the same weight as one attribute. Naming both puts the
  // preset's radius and control heights ahead of the library's defaults on
  // <html>, whatever order the two stylesheets load in.
  const selectors = [`:root${scope}`, scope];
  const { heights, rest } = split(theme.shape);

  const colors = (["light", "dark"] as const).flatMap((mode) =>
    colorTokens.map(
      (token) => `  ${presetVariable(mode, token)}: ${theme[mode][token]};`,
    ),
  );

  return [
    rule(selectors, [...colors, ...declarations(rest)]),
    // Left out where the same element sets a density itself, so that
    // data-density wins over the density the preset comes with.
    rule(
      selectors.map((selector) => `${selector}:not([data-density])`),
      declarations(heights),
    ),
  ].join("\n\n");
}

const lightSelectors = [
  ":root",
  '[data-theme="light"]',
  '[data-theme="system"]',
];

function siteCss(theme: Theme): string {
  return [
    rule([":root"], declarations(theme.shape)),
    rule(lightSelectors, declarations(theme.light)),
    rule(['[data-theme="dark"]'], declarations(theme.dark)),
    `@media (prefers-color-scheme: dark) {\n${rule(
      ['[data-theme="system"]'],
      declarations(theme.dark),
      "  ",
    )}\n}`,
  ].join("\n\n");
}

/**
 * The theme as CSS. Without options it's for the whole page, written the
 * way the library writes its own tokens: light values on `:root`, dark
 * values under `data-theme`.
 */
export function toCss(theme: Theme, options: CssOptions = {}): string {
  const css =
    options.preset === undefined
      ? siteCss(theme)
      : presetCss(theme, options.preset);
  return wrap(css, options.layer);
}

/** The same as `toCss(theme)`, with the library's `dark` mixin writing the two dark blocks. */
export function toScss(theme: Theme): string {
  return `${[
    '@use "@nuvui/react/scss/mixins" as nuv;',
    rule([":root"], declarations(theme.shape)),
    rule(lightSelectors, declarations(theme.light)),
    `@include nuv.dark {\n${declarations(theme.dark).join("\n")}\n}`,
  ].join("\n\n")}\n`;
}

/**
 * For a stylesheet that Tailwind CSS v4 processes. The tokens Tailwind has
 * a name for go in `@theme`, so its utilities and the components change
 * together. The rest is plain CSS.
 */
export function toTailwind(theme: Theme): string {
  const shared: Record<string, string> = {};
  const own: Record<string, string> = {};
  for (const [name, value] of Object.entries(theme.shape)) {
    (name.startsWith("--nuv-") ? own : shared)[name] = value;
  }

  return `${[
    `@theme {\n${declarations(shared).join("\n")}\n}`,
    siteCss({ ...theme, shape: own }),
  ].join("\n\n")}\n`;
}
