import { createTheme, presetNames, presets } from "@nuvui/theme";
import { readTokens } from "@/lib/tokens";
import { Editor } from "./editor";
import type { ColorToken, PresetValues, SizeToken } from "./types";

// What the editor offers. Each control sets one real token, and the defaults
// come from the package's tokens.css, so a renamed token stops the build
// here instead of leaving a control that does nothing.
const colorNames = [
  "--color-primary",
  "--color-primary-foreground",
  "--color-background",
  "--color-foreground",
  "--color-danger",
  "--color-danger-foreground",
  "--color-border-strong",
  "--color-ring",
];

// Ranges are in rem.
const sizeRanges = [
  { name: "--radius-sm", min: 0, max: 0.75, step: 0.0625 },
  { name: "--radius-md", min: 0, max: 1.5, step: 0.0625 },
  { name: "--spacing", min: 0.2, max: 0.35, step: 0.01 },
  { name: "--text-sm", min: 0.75, max: 1.125, step: 0.0625 },
];

export async function TokenEditor() {
  const tokens = await readTokens();

  const colors: ColorToken[] = colorNames.map((name) => {
    const light = tokens.light.get(name);
    const dark = tokens.dark.get(name);
    if (!light || !dark) {
      throw new Error(
        `The token editor lists ${name}, which isn't a color with a light and a dark value in tokens.css.`,
      );
    }
    return { name, light, dark };
  });

  const sizes: SizeToken[] = sizeRanges.map((range) => {
    const value = tokens.light.get(range.name) ?? "";
    const rem = /^(\d*\.?\d+)rem$/.exec(value)?.[1];
    if (!rem) {
      throw new Error(
        `The token editor lists ${range.name}, which is "${value}" in tokens.css. It needs a length in rem.`,
      );
    }
    return { ...range, initial: Number(rem) };
  });

  // What each preset sets for those same tokens, from the generator that
  // writes the preset stylesheets. A token a preset leaves alone has no
  // entry, and the editor falls back to the default for it.
  const starts: PresetValues[] = presetNames.map((name) => {
    const theme = createTheme(presets[name]);
    const pick = (values: Record<string, string>) =>
      Object.fromEntries(
        colorNames.flatMap((token) => {
          const value = values[token];
          return value ? [[token, value]] : [];
        }),
      );

    return {
      name,
      colors: { light: pick(theme.light), dark: pick(theme.dark) },
      sizes: Object.fromEntries(
        sizeRanges.flatMap((range) => {
          const rem = /^(\d*\.?\d+)rem$/.exec(theme.shape[range.name] ?? "");
          return rem ? [[range.name, Number(rem[1])]] : [];
        }),
      ),
    };
  });

  return <Editor colors={colors} sizes={sizes} presets={starts} />;
}
