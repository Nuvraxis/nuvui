import { resolveChoice, type ThemeChoice } from "./theme";

// A choice as a short string that can sit in a URL: every part is made of
// characters a URL leaves alone. The number in front is the format's
// version. A later format gets a new number, and old links keep working
// for as long as this one is still read.
//
//   1.blue.gray.md.default.standard
//   1.x7c3aed.slate.lg.compact.high.Public+Sans
//
// A hex brand color is written with an "x" where its "#" was. A font name's
// spaces are written as "+".
const version = "1";

/** Encodes a choice. Throws a TypeError if the choice isn't valid. */
export function encodeChoice(choice: Partial<ThemeChoice> = {}): string {
  const { brand, base, radius, density, contrast, font } =
    resolveChoice(choice);
  const parts = [
    version,
    brand.startsWith("#") ? `x${brand.slice(1)}` : brand,
    base,
    radius,
    density,
    contrast,
  ];
  if (font !== undefined) parts.push(font.replaceAll(" ", "+"));
  return parts.join(".");
}

/**
 * Decodes a code back into a choice. Throws a TypeError on a code from a
 * version it doesn't know, or one with a part that isn't allowed, so
 * nothing from a URL gets through unchecked.
 */
export function decodeChoice(code: string): ThemeChoice {
  const [found, brand = "", base, radius, density, contrast, font, ...extra] =
    code.split(".");

  if (found !== version) {
    throw new TypeError(
      `"${code}" isn't a theme code this version can read. It reads codes that start with "${version}."`,
    );
  }
  if (extra.length > 0 || contrast === undefined) {
    throw new TypeError(`"${code}" isn't a complete theme code.`);
  }

  const choice: Record<string, string> = {
    brand: /^x(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(brand)
      ? `#${brand.slice(1)}`
      : brand,
    base: base ?? "",
    radius: radius ?? "",
    density: density ?? "",
    contrast,
  };
  if (font !== undefined) choice.font = font.replaceAll("+", " ");

  return resolveChoice(choice as Partial<ThemeChoice>);
}
