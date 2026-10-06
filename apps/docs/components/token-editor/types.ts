export type Theme = "light" | "dark";

export interface ColorToken {
  name: string;
  /** The values tokens.css declares, such as `var(--color-blue-600)`. */
  light: string;
  dark: string;
}

/** A token whose value is a length in rem. */
export interface SizeToken {
  name: string;
  initial: number;
  min: number;
  max: number;
  step: number;
}

/** What a preset sets for the tokens the editor offers. */
export interface PresetValues {
  name: string;
  /** Colors as the preset's stylesheet writes them, per theme. */
  colors: Record<Theme, Record<string, string>>;
  /** Sizes in rem. */
  sizes: Record<string, number>;
}

export interface Edits {
  sizes: Record<string, number>;
  /** Colors are kept per theme, because each theme has its own values. */
  colors: Record<Theme, Record<string, string>>;
}
