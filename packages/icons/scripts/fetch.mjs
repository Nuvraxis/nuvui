// Fetches the icons from the Figma file they're drawn in and writes each
// style's SVGs, the file types' SVGs and the manifest. Run it with
// `pnpm icons:fetch` when the file has changed, and commit what it writes:
// nothing else needs Figma.
//
// It needs a Figma token that can read the file, in FIGMA_TOKEN or in a
// .env.local at the root of the repository, which git ignores.
import { mkdirSync, readdirSync, unlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { componentName, fileTypeComponentName } from "../src/names.ts";
import { fileTypeSize, iconSize, iconStyles } from "../src/strokes.ts";
import { normalize, normalizeFileType, parse } from "./svg.mjs";

const fileKey = "zJXmLZTLY57dhyhVSmZD1I";
const root = fileURLToPath(new URL("..", import.meta.url));

try {
  process.loadEnvFile(join(root, "..", "..", ".env.local"));
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}
const token = process.env.FIGMA_TOKEN;
if (!token) {
  console.error(
    "icons:fetch needs a Figma token that can read the file, in FIGMA_TOKEN or in .env.local at the root of the repository.",
  );
  process.exit(1);
}

async function figma(path) {
  for (let attempt = 1; ; attempt++) {
    const response = await fetch(`https://api.figma.com/v1/${path}`, {
      headers: { "X-Figma-Token": token },
    });
    const wait = Number(response.headers.get("retry-after") ?? 0);
    // Figma can ask for a wait of hours once a token is over its limit.
    // Only a short one is waited out.
    if (response.status === 429 && attempt < 4 && wait <= 120) {
      console.log(`Figma asked for a wait of ${wait} seconds.`);
      await new Promise((resolve) => setTimeout(resolve, wait * 1000));
      continue;
    }
    if (!response.ok) {
      throw new Error(
        `Figma answered ${response.status} for ${path.split("?")[0]}: ${await response.text()}`,
      );
    }
    return response.json();
  }
}

// Every component set named Icon/<name>, the page it's on as its category,
// and every component named FileType/<extension>, which has one style.
const file = await figma(`files/${fileKey}`);
const icons = [];
const fileTypes = [];
const problems = [];

function collectFileType(node) {
  const name = node.name.slice("FileType/".length);
  let component;
  try {
    component = fileTypeComponentName(name);
  } catch (error) {
    problems.push(`${node.name}: ${error.message}`);
    return;
  }
  const { width, height } = node.absoluteBoundingBox ?? {};
  if (width !== fileTypeSize || height !== fileTypeSize) {
    problems.push(`${node.name} is ${width} by ${height}`);
  }
  // The file keeps components' descriptions beside the tree, not on the node.
  const description = (file.components?.[node.id]?.description ?? "").trim();
  if (description === "") problems.push(`${node.name} has no description`);
  fileTypes.push({ name, component, description, id: node.id });
}

function collect(set, category) {
  const name = set.name.slice("Icon/".length);
  let component;
  try {
    component = componentName(name);
  } catch (error) {
    problems.push(`${set.name}: ${error.message}`);
    return;
  }
  const variants = {};
  for (const variant of set.children) {
    const style = /^Style=(Rounded|Standard|Sharp)$/
      .exec(variant.name)?.[1]
      .toLowerCase();
    if (!style) {
      problems.push(`${set.name} has a variant named "${variant.name}"`);
      continue;
    }
    if (variants[style]) problems.push(`${set.name} has two ${style} variants`);
    const { width, height } = variant.absoluteBoundingBox ?? {};
    if (width !== iconSize || height !== iconSize) {
      problems.push(`${set.name}'s ${style} variant is ${width} by ${height}`);
    }
    variants[style] = variant.id;
  }
  for (const style of iconStyles) {
    if (!variants[style]) problems.push(`${set.name} has no ${style} variant`);
  }
  icons.push({ name, component, category, variants });
}

function walk(node, category) {
  if (node.type === "COMPONENT_SET") {
    if (node.name.startsWith("Icon/")) collect(node, category);
    return;
  }
  if (node.type === "COMPONENT" && node.name.startsWith("FileType/")) {
    collectFileType(node);
    return;
  }
  for (const child of node.children ?? []) walk(child, category);
}

for (const page of file.document.children) walk(page, page.name);

for (const [key, list] of [
  ["name", icons],
  ["component", icons],
  ["name", fileTypes],
  ["component", fileTypes],
]) {
  const seen = new Set();
  for (const icon of list) {
    if (seen.has(icon[key])) problems.push(`two icons are ${icon[key]}`);
    seen.add(icon[key]);
  }
}

// Each variant as SVG, from addresses Figma makes for a few minutes. The
// frame's own bounds, not what's drawn: a sharp corner's miter can reach
// past the frame, and Figma would widen the picture to take it in, which
// would make that one icon smaller than the rest.
const ids = [
  ...icons.flatMap((icon) => Object.values(icon.variants)),
  ...fileTypes.map((fileType) => fileType.id),
];
const addresses = {};
for (let start = 0; start < ids.length; start += 100) {
  const chunk = ids.slice(start, start + 100).join(",");
  const { err, images } = await figma(
    `images/${fileKey}?ids=${encodeURIComponent(chunk)}&format=svg&svg_include_id=false&svg_include_node_id=false&svg_simplify_stroke=true&svg_outline_text=true&use_absolute_bounds=true`,
  );
  if (err) throw new Error(`Figma couldn't export the icons: ${err}`);
  Object.assign(addresses, images);
}

const svgs = new Map();
const jobs = [
  ...icons.flatMap((icon) =>
    iconStyles.map((style) => ({ icon, style, id: icon.variants[style] })),
  ),
  ...fileTypes.map((icon) => ({ icon, style: "file-types", id: icon.id })),
];
async function work() {
  for (let job = jobs.shift(); job; job = jobs.shift()) {
    const { icon, style, id } = job;
    if (!id) continue;
    const label = `${icon.name}, ${style}`;
    if (!addresses[id]) {
      problems.push(`${label}: Figma gave no SVG`);
      continue;
    }
    const response = await fetch(addresses[id]);
    if (!response.ok) {
      problems.push(`${label}: the SVG answered ${response.status}`);
      continue;
    }
    try {
      const fileType = style === "file-types";
      const text = await response.text();
      const svg = fileType ? normalizeFileType(text) : normalize(text);
      const size = fileType ? fileTypeSize : iconSize;
      const { viewBox } = parse(svg).attributes;
      if (viewBox !== `0 0 ${size} ${size}`) {
        throw new Error(`the SVG's viewBox is "${viewBox}"`);
      }
      svgs.set(`${style}/${icon.name}`, svg);
    } catch (error) {
      problems.push(`${label}: ${error.message}`);
    }
  }
}
await Promise.all(Array.from({ length: 8 }, work));

if (problems.length > 0) {
  console.error(
    `Nothing was written. The file breaks its own rules:\n${problems.map((problem) => `  - ${problem}`).join("\n")}`,
  );
  process.exit(1);
}

for (const style of iconStyles) {
  const dir = join(root, "svg", style);
  mkdirSync(dir, { recursive: true });
  const names = new Set(icons.map((icon) => `${icon.name}.svg`));
  // An icon taken out of the file goes from here too.
  for (const old of readdirSync(dir)) {
    if (!names.has(old)) unlinkSync(join(dir, old));
  }
  for (const icon of icons) {
    writeFileSync(
      join(dir, `${icon.name}.svg`),
      svgs.get(`${style}/${icon.name}`),
    );
  }
}

{
  const dir = join(root, "svg", "file-types");
  mkdirSync(dir, { recursive: true });
  const names = new Set(fileTypes.map((icon) => `${icon.name}.svg`));
  for (const old of readdirSync(dir)) {
    if (!names.has(old)) unlinkSync(join(dir, old));
  }
  for (const icon of fileTypes) {
    writeFileSync(
      join(dir, `${icon.name}.svg`),
      svgs.get(`file-types/${icon.name}`),
    );
  }
}

const manifest = {
  source: `https://www.figma.com/design/${fileKey}`,
  styles: iconStyles,
  icons: icons.map(({ name, component, category }) => ({
    name,
    component,
    category,
  })),
  fileTypes: fileTypes.map(({ name, component, description }) => ({
    name,
    component,
    description,
  })),
};
writeFileSync(
  join(root, "manifest.json"),
  `${JSON.stringify(manifest, null, 2)}\n`,
);

const categories = new Set(icons.map((icon) => icon.category));
console.log(
  `icons:fetch: ${icons.length} icons on ${categories.size} pages of "${file.name}", ${fileTypes.length} file types, ${svgs.size} SVGs.`,
);
