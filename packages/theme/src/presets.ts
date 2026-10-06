import type { ThemeChoice } from "./theme";

// The themes @nuvui/react ships as `themes/<name>.css`. They differ in more
// than hue, so that between them they exercise every axis: both ends of
// radius and density, a brand color that takes dark text, and high contrast.
export const presets = {
  ink: {
    brand: "indigo",
    base: "slate",
    radius: "md",
    density: "default",
    contrast: "standard",
  },
  ledger: {
    brand: "teal",
    base: "zinc",
    radius: "none",
    density: "compact",
    contrast: "standard",
  },
  meadow: {
    brand: "emerald",
    base: "stone",
    radius: "xl",
    density: "comfortable",
    contrast: "standard",
  },
  ember: {
    brand: "orange",
    base: "neutral",
    radius: "sm",
    density: "default",
    contrast: "standard",
  },
  "high-contrast": {
    brand: "blue",
    base: "neutral",
    radius: "md",
    density: "default",
    contrast: "high",
  },
} as const satisfies Record<string, ThemeChoice>;

export type PresetName = keyof typeof presets;

export const presetNames = Object.keys(presets) as PresetName[];
