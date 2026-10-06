// Color math for the generator. It has to give the numbers a browser would,
// because the contrast rules are about what ends up on the screen. A test in
// @nuvui/react paints every palette color in a real browser and compares.

/** Red, green and blue as a browser paints them: whole numbers from 0 to 255. */
export type Rgb = [red: number, green: number, blue: number];

export interface Oklch {
  /** Lightness, from 0 to 1. */
  l: number;
  /** Chroma. 0 is gray, and about 0.37 is the most a screen shows. */
  c: number;
  /** Hue, in degrees. */
  h: number;
}

const hexPattern = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;
const oklchPattern =
  /^oklch\(\s*([\d.]+)(%?)\s+([\d.]+)\s+([\d.]+|none)(?:deg)?\s*\)$/i;

const fromGamma = (value: number) =>
  value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;

const toGamma = (value: number) =>
  value <= 0.0031308 ? value * 12.92 : 1.055 * value ** (1 / 2.4) - 0.055;

// Björn Ottosson's OKLab matrices, the ones CSS Color 4 specifies.
function oklchToRgb({ l, c, h }: Oklch): Rgb {
  const angle = (h * Math.PI) / 180;
  const a = c * Math.cos(angle);
  const b = c * Math.sin(angle);

  const long = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const medium = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const short = (l - 0.0894841775 * a - 1.291485548 * b) ** 3;

  const linear = [
    4.0767416621 * long - 3.3077115913 * medium + 0.2309699292 * short,
    -1.2684380046 * long + 2.6097574011 * medium - 0.3413193965 * short,
    -0.0041960863 * long - 0.7034186147 * medium + 1.707614701 * short,
  ];

  // A color outside what sRGB can show is clipped channel by channel, which
  // is what browsers do when they paint one.
  return linear.map((channel) =>
    Math.round(toGamma(Math.min(1, Math.max(0, channel))) * 255),
  ) as Rgb;
}

function rgbToOklch([red, green, blue]: Rgb): Oklch {
  const r = fromGamma(red / 255);
  const g = fromGamma(green / 255);
  const b = fromGamma(blue / 255);

  const long = Math.cbrt(
    0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b,
  );
  const medium = Math.cbrt(
    0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b,
  );
  const short = Math.cbrt(
    0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b,
  );

  const l = 0.2104542553 * long + 0.793617785 * medium - 0.0040720468 * short;
  const a = 1.9779984951 * long - 2.428592205 * medium + 0.4505937099 * short;
  const bAxis =
    0.0259040371 * long + 0.7827717662 * medium - 0.808675766 * short;

  const hue = (Math.atan2(bAxis, a) * 180) / Math.PI;
  return { l, c: Math.hypot(a, bAxis), h: hue < 0 ? hue + 360 : hue };
}

function hexToRgb(hex: string): Rgb {
  const digits = hex.slice(1);
  const full =
    digits.length === 3
      ? [...digits].map((digit) => digit + digit).join("")
      : digits;
  return [0, 2, 4].map((start) =>
    Number.parseInt(full.slice(start, start + 2), 16),
  ) as Rgb;
}

/** Whether `color` is a hex color this package can read: `#rgb` or `#rrggbb`. */
export function isHex(color: string): boolean {
  return hexPattern.test(color);
}

function parseOklch(color: string): Oklch | undefined {
  const match = oklchPattern.exec(color);
  if (!match) return undefined;
  const [, lightness = "", percent, chroma = "", hue = ""] = match;
  return {
    l: Number(lightness) / (percent ? 100 : 1),
    c: Number(chroma),
    // Tailwind writes the hue of a pure gray as "none".
    h: hue === "none" ? 0 : Number(hue),
  };
}

/**
 * Reads a hex color or an `oklch()` color with no alpha, the two forms the
 * generator works with. Throws on anything else.
 */
export function toRgb(color: string): Rgb {
  if (isHex(color)) return hexToRgb(color);
  const oklch = parseOklch(color);
  if (oklch) return oklchToRgb(oklch);
  throw new Error(
    `"${color}" isn't a color the theme generator can read. It takes #rgb, #rrggbb and oklch(L C H).`,
  );
}

export function toOklch(color: string): Oklch {
  return parseOklch(color) ?? rgbToOklch(toRgb(color));
}

export function formatOklch({ l, c, h }: Oklch): string {
  const round = (value: number, places: number) =>
    Number(value.toFixed(places)).toString();
  return `oklch(${round(l * 100, 1)}% ${round(c, 3)} ${round(h, 3)})`;
}

export function toHex(color: string): string {
  return `#${toRgb(color)
    .map((channel) => channel.toString(16).padStart(2, "0"))
    .join("")}`;
}

function luminance(color: string): number {
  const [red, green, blue] = toRgb(color).map((channel) =>
    fromGamma(channel / 255),
  ) as Rgb;
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

/** WCAG contrast ratio between two colors, from 1 to 21. */
export function contrast(first: string, second: string): number {
  const a = luminance(first);
  const b = luminance(second);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}
