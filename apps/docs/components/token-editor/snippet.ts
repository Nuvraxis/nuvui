import type { ColorToken, Edits, SizeToken } from "./types";

// Two short lines, so it fits a phone without scrolling sideways.
export const emptySnippet =
  "/* Change a value above.\n   The CSS for it shows up here. */";

// The CSS someone would paste into their own stylesheet to get what the
// preview shows.
export function buildSnippet(
  edits: Edits,
  colors: ColorToken[],
  sizes: SizeToken[],
): string {
  const root = [
    ...sizes
      .filter(({ name }) => name in edits.sizes)
      .map(({ name }) => `  ${name}: ${edits.sizes[name]}rem;`),
    ...colors
      .filter(({ name }) => name in edits.colors.light)
      .map(({ name }) => `  ${name}: ${edits.colors.light[name]};`),
  ];

  const dark = colors
    .filter(({ name }) => name in edits.colors.dark)
    .map(({ name }) => `  ${name}: ${edits.colors.dark[name]};`);

  // A rule outside a cascade layer beats the library's layered ones, the dark
  // ones included. So a color set on :root would show up in dark as well.
  // Writing the library's dark value back out keeps the two themes apart,
  // which is how the preview behaves.
  const restored = colors
    .filter(
      ({ name }) => name in edits.colors.light && !(name in edits.colors.dark),
    )
    .map(({ name, dark: declared }) => `  ${name}: ${declared};`);
  if (restored.length > 0) {
    dark.push(
      "  /* Not changed. Repeated because a color set on :root applies in dark too. */",
      ...restored,
    );
  }

  const blocks = [
    root.length > 0 && `:root {\n${root.join("\n")}\n}`,
    dark.length > 0 && `[data-theme="dark"] {\n${dark.join("\n")}\n}`,
  ].filter(Boolean);

  return blocks.length > 0 ? blocks.join("\n\n") : emptySnippet;
}
