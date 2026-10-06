import { readFile } from "node:fs/promises";
import { cache } from "react";
import { library } from "@/lib/library";

export interface Tokens {
  /** Everything declared on :root, in file order. For a semantic color this is its light value. */
  light: Map<string, string>;
  /** What data-theme="dark" declares. Only the semantic colors have an entry. */
  dark: Map<string, string>;
}

// Reads the token stylesheet the package ships, so the reference tables and
// the editor's defaults are the values people actually get.
export const readTokens = cache(async (): Promise<Tokens> => {
  const css = (await readFile(library.tokens, "utf8")).replace(
    /\/\*[\s\S]*?\*\//g,
    "",
  );

  const light = new Map<string, string>();
  const dark = new Map<string, string>();
  // The selectors and at-rules the walk is currently inside.
  const open: string[] = [];
  let text = "";

  for (const char of css) {
    if (char === "{") {
      open.push(text.trim());
      text = "";
    } else if (char === "}") {
      open.pop();
      text = "";
    } else if (char === ";") {
      const declaration = /^\s*(--[\w-]+)\s*:\s*([\s\S]+)$/.exec(text);
      text = "";
      if (!declaration) continue;

      const [, name = "", raw = ""] = declaration;
      const value = raw.replace(/\s+/g, " ").trim();
      const selector = open.at(-1) ?? "";
      // The same dark values are repeated under a media query for
      // data-theme="system". One copy is enough.
      const inMedia = open.some((rule) => rule.startsWith("@media"));

      if (selector.includes(":root")) light.set(name, value);
      else if (selector.includes("dark") && !inMedia) dark.set(name, value);
    } else {
      text += char;
    }
  }

  if (light.size === 0 || dark.size === 0) {
    throw new Error(
      `No tokens found in ${library.tokens}. Build the library first.`,
    );
  }
  return { light, dark };
});

// Every token belongs to one group, and each group is one table on the
// Theming page. A token that fits none of them fails the build, so a new
// kind of token can't ship without being documented.
const chart = /^--color-chart-\d+$/;

const mode = /^--nuv-(light|dark)$/;

const groups = {
  semantic: (name, tokens) =>
    tokens.dark.has(name) && !chart.test(name) && !mode.test(name),
  // The two switches presets are built on. The page explains them in words.
  mode: (name) => mode.test(name),
  chart: (name) => chart.test(name),
  palette: (name) =>
    /^--color-(black|white|[a-z]+-\d+)$/.test(name) && !chart.test(name),
  spacing: (name) => name === "--spacing",
  type: (name) => /^--(font|text|tracking|leading)-/.test(name),
  radius: (name) => name.startsWith("--radius-"),
  shadow: (name) => name.startsWith("--shadow-"),
  motion: (name) => /^--(ease|nuv-duration)-/.test(name),
  breakpoint: (name) => name.startsWith("--breakpoint-"),
  stacking: (name) => name.startsWith("--nuv-z-"),
  control: (name) =>
    /^--nuv-(border-width|disabled-opacity|touch-size|control-height-)/.test(
      name,
    ),
} satisfies Record<string, (name: string, tokens: Tokens) => boolean>;

export type TokenGroup = keyof typeof groups;

export async function tokensIn(group: TokenGroup): Promise<[string, string][]> {
  const tokens = await readTokens();

  const homeless = [...tokens.light.keys()].filter(
    (name) => !Object.values(groups).some((belongs) => belongs(name, tokens)),
  );
  if (homeless.length > 0) {
    throw new Error(
      `These tokens aren't in any group in lib/tokens.ts, so the Theming page wouldn't list them: ${homeless.join(", ")}`,
    );
  }

  return [...tokens.light].filter(([name]) => groups[group](name, tokens));
}
