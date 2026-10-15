// Checks the built package for what would break a consumer quietly. The
// shared check is for packages with a stylesheet and components in folders,
// and this one has neither.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join, relative, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const dist = join(root, "dist");
const manifest = JSON.parse(readFileSync(join(root, "manifest.json"), "utf8"));
const budgets = JSON.parse(
  readFileSync(join(root, ".size-limit.json"), "utf8"),
);
const require = createRequire(import.meta.url);
const display = (file) => relative(root, file).split(sep).join("/");

const problems = [];
const passed = [];

function files(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? files(path) : [path];
  });
}

if (!existsSync(dist)) {
  console.error("check-dist failed: there's no dist, did the build run?");
  process.exit(1);
}
const built = files(dist);
const scripts = built.filter((file) => /\.c?js$/.test(file));

// 1. No "use client" anywhere. An icon has no state, and the directive
// would make every icon a client component in a server component's tree.
const directive = /^\s*(?:\/\/[^\n]*\n|\/\*[\s\S]*?\*\/|\s)*["']use client["']/;
for (const file of scripts) {
  if (directive.test(readFileSync(file, "utf8"))) {
    problems.push(`${display(file)} has a "use client" directive`);
  }
}
passed.push(`no "use client" in ${scripts.length} scripts`);

// 2. Each entry, in both module formats, has every icon in the manifest by
// its name, and nothing else that ends in Icon.
const expected = manifest.icons.map((icon) => icon.component).sort();
const entries = ["index", ...manifest.styles.filter((s) => s !== "standard")];
for (const entry of entries) {
  const esm = await import(pathToFileURL(join(dist, `${entry}.js`)).href);
  const cjs = require(join(dist, `${entry}.cjs`));
  for (const [format, module] of [
    ["ESM", esm],
    ["CommonJS", cjs],
  ]) {
    const icons = Object.keys(module)
      // A component's name starts with a capital, and createIcon's doesn't.
      .filter((name) => /^[A-Z]\w*Icon$/.test(name))
      .sort();
    const missing = expected.filter((name) => !icons.includes(name));
    const extra = icons.filter((name) => !expected.includes(name));
    if (missing.length > 0) {
      problems.push(`${entry} (${format}) lacks ${missing.join(", ")}`);
    }
    if (extra.length > 0) {
      problems.push(
        `${entry} (${format}) has ${extra.join(", ")}, not in the manifest`,
      );
    }
  }
  for (const types of [`${entry}.d.ts`, `${entry}.d.cts`]) {
    if (!existsSync(join(dist, types)))
      problems.push(`dist/${types} is missing`);
  }
  if (!budgets.some(({ path }) => path === `dist/${entry}.js`)) {
    problems.push(`.size-limit.json has no size budget for dist/${entry}.js`);
  }
}
passed.push(
  `${entries.length} entries in 2 formats have the manifest's ${expected.length} icons`,
);

// 3. One module per icon per style, so a bundler can leave out the rest.
let modules = 0;
for (const style of manifest.styles) {
  for (const { name } of manifest.icons) {
    for (const ext of [".js", ".cjs"]) {
      const file = join(dist, "generated", style, `${name}${ext}`);
      if (existsSync(file)) modules += 1;
      else problems.push(`${display(file)} is missing`);
    }
  }
}
passed.push(`${modules} icon modules`);

// 4. The SVG files that ship are the manifest's, every one.
let svgs = 0;
for (const style of manifest.styles) {
  for (const { name } of manifest.icons) {
    const file = join(root, "svg", style, `${name}.svg`);
    if (existsSync(file)) svgs += 1;
    else problems.push(`${display(file)} is missing`);
  }
}
passed.push(`${svgs} SVG files`);

if (problems.length > 0) {
  console.error(
    `check-dist failed:\n${problems.map((p) => `  - ${p}`).join("\n")}`,
  );
  process.exit(1);
}
console.log(`check-dist: ${passed.join(", ")}`);
