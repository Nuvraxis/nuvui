/**
 * A color as the picker works with it: where it is round the wheel, how far
 * from grey, and how far from black. Hue is 0 to 360, the other two 0 to 100.
 */
export interface Hsv {
  h: number;
  s: number;
  v: number;
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

/**
 * A color someone typed, as `#rrggbb` in lower case, or null if it isn't one.
 * The `#` can be left off, and three digits stand for six.
 */
export function parseHex(text: string): string | null {
  const digits = text.trim().replace(/^#/, "").toLowerCase();
  if (/^[0-9a-f]{6}$/.test(digits)) return `#${digits}`;
  if (/^[0-9a-f]{3}$/.test(digits)) {
    return `#${[...digits].map((digit) => digit + digit).join("")}`;
  }
  return null;
}

/** `#rrggbb` to hue, saturation and brightness. Anything else is black. */
export function hexToHsv(hex: string): Hsv {
  const parsed = parseHex(hex) ?? "#000000";
  const r = Number.parseInt(parsed.slice(1, 3), 16) / 255;
  const g = Number.parseInt(parsed.slice(3, 5), 16) / 255;
  const b = Number.parseInt(parsed.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const span = max - Math.min(r, g, b);

  let h = 0;
  if (span > 0) {
    if (max === r) h = ((g - b) / span) % 6;
    else if (max === g) h = (b - r) / span + 2;
    else h = (r - g) / span + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  // Not rounded. A whole number of degrees and percent can't say every one
  // of the sixteen million colors, and the thumbs would land on a neighbour.
  return { h, s: max === 0 ? 0 : (span / max) * 100, v: max * 100 };
}

/** Hue, saturation and brightness to `#rrggbb`. */
export function hsvToHex({ h, s, v }: Hsv): string {
  const saturation = clamp(s, 0, 100) / 100;
  const value = clamp(v, 0, 100) / 100;
  const hue = (((h % 360) + 360) % 360) / 60;
  const chroma = value * saturation;
  const second = chroma * (1 - Math.abs((hue % 2) - 1));
  const [r, g, b] = (
    [
      [chroma, second, 0],
      [second, chroma, 0],
      [0, chroma, second],
      [0, second, chroma],
      [second, 0, chroma],
      [chroma, 0, second],
    ] as const
  )[Math.floor(hue) % 6] as readonly [number, number, number];
  const lift = value - chroma;
  const part = (channel: number) =>
    Math.round((channel + lift) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${part(r)}${part(g)}${part(b)}`;
}
