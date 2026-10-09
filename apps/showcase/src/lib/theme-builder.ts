import {
  bases,
  brands,
  contrasts,
  createTheme,
  decodeChoice,
  defaultChoice,
  densities,
  encodeChoice,
  type PresetName,
  presets,
  radii,
  type ThemeChoice,
  toCss,
} from "@nuvui/theme";

// The parts of a choice that have a list to pick from, and so can be locked
// and shuffled. The font is typed, and Shuffle leaves it alone.
export const axes = ["brand", "base", "radius", "density", "contrast"] as const;
export type Axis = (typeof axes)[number];
export type Locks = Record<Axis, boolean>;

export const noLocks: Locks = {
  brand: false,
  base: false,
  radius: false,
  density: false,
  contrast: false,
};

const options: Record<Axis, readonly string[]> = {
  brand: brands,
  base: bases,
  radius: radii,
  density: densities,
  contrast: contrasts,
};

export const labels = {
  brand: "Brand color",
  base: "Base color",
  radius: "Radius",
  density: "Density",
  contrast: "Contrast",
} as const satisfies Record<Axis, string>;

const named: Record<string, string> = {
  none: "None",
  sm: "Small",
  md: "Medium",
  lg: "Large",
  xl: "Extra large",
  compact: "Compact",
  default: "Default",
  comfortable: "Comfortable",
  standard: "Standard (AA)",
  high: "High (AAA)",
};

/** A value as it's shown: "Extra large" for xl, "Indigo" for indigo. */
export const nameOf = (value: string) =>
  named[value] ?? value.charAt(0).toUpperCase() + value.slice(1);

export const starts: { name: string; label: string; choice: ThemeChoice }[] = [
  { name: "default", label: "Default", choice: defaultChoice },
  ...(Object.keys(presets) as PresetName[]).map((name) => ({
    name,
    label: nameOf(name).replace("-", " "),
    choice: presets[name] as ThemeChoice,
  })),
];

/**
 * A new value for every part that isn't locked, and always a different
 * choice from the one given unless everything is locked. Every brand color
 * with every base color at either contrast level passes the generator's
 * checks, which a test in @nuvui/theme holds, so nothing this returns can
 * fail them.
 */
export function shuffle(
  choice: ThemeChoice,
  locks: Locks,
  random: () => number = Math.random,
): ThemeChoice {
  const free = axes.filter((axis) => !locks[axis]);
  if (free.length === 0) return choice;

  const pick = (axis: Axis) => {
    const list = options[axis];
    return list[Math.floor(random() * list.length)] ?? choice[axis];
  };

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const next: Record<string, unknown> = { ...choice };
    for (const axis of free) next[axis] = pick(axis);
    if (free.some((axis) => next[axis] !== choice[axis])) {
      return next as unknown as ThemeChoice;
    }
  }
  return choice;
}

/** The address of the Themes page with this choice in it. */
export function linkTo(choice: ThemeChoice, origin: string) {
  return `${origin}/themes?preset=${encodeChoice(choice)}`;
}

/** The choice a `?preset=` holds, or undefined if it isn't one. */
export function fromCode(code: string | null): ThemeChoice | undefined {
  if (!code) return undefined;
  try {
    return decodeChoice(code);
  } catch {
    return undefined;
  }
}

// The library's layers, in order, so that a stylesheet that arrives before
// the library's own still sorts under it.
const layerOrder = "@layer tokens, base, components;";

/** A theme as a preset's CSS, in the tokens layer, as the library ships its own. */
export function presetCss(choice: ThemeChoice, preset: string) {
  return `${layerOrder}\n${toCss(createTheme(choice), { preset, layer: "tokens" })}`;
}
