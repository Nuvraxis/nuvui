// Writes a module for each icon in each style into src/generated, from the
// SVGs fetch.mjs wrote. Git ignores that folder: the SVGs are the source,
// and build, typecheck and test each run this first.
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { componentName } from "../src/names.ts";
import {
  iconSize,
  iconStrokeWidth,
  iconStyles,
  strokes,
} from "../src/strokes.ts";
import { parse } from "./svg.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const manifest = JSON.parse(readFileSync(join(root, "manifest.json"), "utf8"));

const geometry = {
  path: ["d"],
  circle: ["cx", "cy", "r"],
  ellipse: ["cx", "cy", "rx", "ry"],
  rect: ["x", "y", "width", "height", "rx", "ry"],
  line: ["x1", "y1", "x2", "y2"],
  polyline: ["points"],
  polygon: ["points"],
};

// What SVG draws with when nothing says otherwise.
const initial = {
  fill: "black",
  "fill-rule": "nonzero",
  "clip-rule": "nonzero",
  stroke: "none",
  "stroke-width": "1",
  "stroke-linecap": "butt",
  "stroke-linejoin": "miter",
  "stroke-miterlimit": "4",
};

const kebab = (name) => name.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
const camel = (name) => name.replace(/-([a-z])/g, (_, c) => c.toUpperCase());

// What createIcon puts on the <svg> for a style.
function drawnWith(style) {
  const painted = {
    ...initial,
    fill: "none",
    stroke: "currentColor",
    "stroke-width": String(iconStrokeWidth),
  };
  for (const [key, value] of Object.entries(strokes[style])) {
    painted[kebab(key)] = value;
  }
  return painted;
}

const own = new Map();

/** The icon's shapes, each with only what it doesn't share with its style. */
function shapes(svg, style, label) {
  const element = parse(svg);
  const viewBox = `0 0 ${iconSize} ${iconSize}`;
  if (element.attributes.viewBox !== viewBox) {
    throw new Error(
      `${label} has a viewBox of "${element.attributes.viewBox}"`,
    );
  }
  const base = drawnWith(style);
  const out = [];

  function visit(node, inherited) {
    const painted = { ...inherited };
    const allowed = new Set(Object.keys(initial));
    if (node.name === "svg") allowed.add("viewBox").add("xmlns");
    for (const key of geometry[node.name] ?? []) allowed.add(key);
    for (const [key, value] of Object.entries(node.attributes)) {
      if (!allowed.has(key)) {
        throw new Error(`${label} has a <${node.name}> with ${key}="${value}"`);
      }
      if (key in initial) painted[key] = value;
    }

    if (node.name === "svg" || node.name === "g") {
      for (const child of node.children) {
        if (child.type !== "element") {
          throw new Error(`${label} has ${child.type} content in it`);
        }
        visit(child, painted);
      }
      return;
    }
    if (!geometry[node.name]) {
      throw new Error(
        `${label} has a <${node.name}>, which the set doesn't use`,
      );
    }

    const attributes = {};
    for (const key of geometry[node.name]) {
      if (key in node.attributes) attributes[key] = node.attributes[key];
    }
    for (const key of Object.keys(initial)) {
      if (painted[key] === base[key]) continue;
      // A miter limit only changes a mitered join.
      if (
        key === "stroke-miterlimit" &&
        painted["stroke-linejoin"] !== "miter"
      ) {
        continue;
      }
      attributes[camel(key)] = painted[key];
      own.set(label, [...(own.get(label) ?? []), `${key}="${painted[key]}"`]);
    }
    out.push([node.name, attributes]);
  }

  visit(element, initial);
  if (out.length === 0) throw new Error(`${label} draws nothing`);
  return out;
}

// For the editor: hovering an icon's name shows it.
function preview(svg) {
  const shown = svg
    .replaceAll("currentColor", "#111827")
    .replace(
      "<svg",
      '<svg width="48" height="48" style="background:#fff;border-radius:4px"',
    );
  return `data:image/svg+xml;base64,${Buffer.from(shown).toString("base64")}`;
}

const title = (style) => style[0].toUpperCase() + style.slice(1);

for (const style of iconStyles) {
  const dir = join(root, "src", "generated", style);
  mkdirSync(dir, { recursive: true });
  const files = new Set(["index.ts"]);
  const exports = [];

  for (const { name, component, category } of manifest.icons) {
    if (componentName(name) !== component) {
      throw new Error(`manifest.json names ${name} ${component}`);
    }
    const source = join(root, "svg", style, `${name}.svg`);
    if (!existsSync(source))
      throw new Error(`svg/${style}/${name}.svg is missing`);
    const svg = readFileSync(source, "utf8");
    const nodes = shapes(svg, style, `svg/${style}/${name}.svg`);

    files.add(`${name}.ts`);
    exports.push(`export { ${component} } from "./${name}";`);
    writeFileSync(
      join(dir, `${name}.ts`),
      [
        `// Written by scripts/generate.mjs from svg/${style}/${name}.svg.`,
        `import { createIcon } from "../../create-icon";`,
        "",
        "/**",
        ` * ${name}, from ${category}, in the ${title(style)} style.`,
        " *",
        ` * ![${name}](${preview(svg)})`,
        " */",
        `export const ${component} = /* @__PURE__ */ createIcon(${JSON.stringify(component)}, ${JSON.stringify(style)}, ${JSON.stringify(nodes)});`,
        "",
      ].join("\n"),
    );
  }

  writeFileSync(
    join(dir, "index.ts"),
    `// Written by scripts/generate.mjs.\n${exports.join("\n")}\n`,
  );
  // An icon taken out of the set goes from here too.
  for (const old of readdirSync(dir)) {
    if (!files.has(old)) unlinkSync(join(dir, old));
  }
}

const count = manifest.icons.length;
console.log(
  `icons:generate: ${count} icons in ${iconStyles.length} styles, ${count * iconStyles.length} modules.`,
);
if (own.size > 0) {
  console.log(
    `Drawn with something of their own, which the props don't change:\n${[...own].map(([label, list]) => `  - ${label}: ${[...new Set(list)].join(", ")}`).join("\n")}`,
  );
}
