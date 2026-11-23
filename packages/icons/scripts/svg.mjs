// What fetch.mjs and generate.mjs both do to an SVG.
import { optimize } from "svgo";

const ink = /^#111827$/i;

// Figma writes every line in the file's ink. An icon takes the color of the
// text around it, and an SVG with any other color in it has broken the
// set's rules, so it stops the fetch instead of being let through.
const currentColor = {
  name: "currentColor",
  fn: () => ({
    element: {
      enter(node) {
        for (const key of ["stroke", "fill"]) {
          const value = node.attributes[key];
          // Multipass brings this back to what it changed on the first pass.
          if (value === undefined || value === "none") continue;
          if (value === "currentColor") continue;
          if (!ink.test(value)) {
            throw new Error(`a ${key} of ${value}, where the set has #111827`);
          }
          node.attributes[key] = "currentColor";
        }
      },
    },
  }),
};

/**
 * An SVG as Figma exports it, made the same as every other: no width or
 * height, the line in `currentColor`, coordinates to two decimals. The
 * `viewBox`, the stroke's width and how lines end and join are kept.
 *
 * @param {string} svg
 */
export function normalize(svg) {
  return `${
    optimize(svg, {
      multipass: true,
      floatPrecision: 2,
      plugins: ["preset-default", "removeDimensions", currentColor],
    }).data
  }\n`;
}

// A file type's page is drawn in the ink, and follows the text around it
// like the set's icons do, so it's seen on a dark page too. Its tag keeps
// the colors it was drawn in, the label on it included, since the label
// is read against the tag and not against the page.
const outlineInCurrentColor = {
  name: "outlineInCurrentColor",
  fn: () => ({
    element: {
      enter(node) {
        const value = node.attributes.stroke;
        if (value === undefined || value === "none") return;
        if (value === "currentColor") return;
        if (!ink.test(value)) {
          throw new Error(`a stroke of ${value}, where the page has #111827`);
        }
        node.attributes.stroke = "currentColor";
      },
    },
  }),
};

/**
 * A file type icon as Figma exports it: as `normalize` makes an icon of the
 * set, except that only the page's line is put in `currentColor`. The tag's
 * fills are kept.
 *
 * @param {string} svg
 */
export function normalizeFileType(svg) {
  return `${
    optimize(svg, {
      multipass: true,
      floatPrecision: 2,
      plugins: ["preset-default", "removeDimensions", outlineInCurrentColor],
    }).data
  }\n`;
}

/**
 * The SVG's elements as a tree, read and left as they are.
 *
 * @param {string} svg
 * @returns {{ name: string, attributes: Record<string, string>, children: any[] }}
 */
export function parse(svg) {
  let root;
  optimize(svg, {
    plugins: [
      {
        name: "read",
        fn: (ast) => {
          root = ast;
          return {};
        },
      },
    ],
  });
  const element = root?.children.find((node) => node.type === "element");
  if (element?.name !== "svg") throw new Error("no <svg> element");
  return element;
}
