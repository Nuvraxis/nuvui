// Checks the built package for two things that break consumers quietly and
// that nothing else in the toolchain would catch.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { compileAsync } from "sass-embedded";

const root = fileURLToPath(new URL("..", import.meta.url));
const srcDir = join(root, "src");
const distDir = join(root, "dist");

const problems = [];
const display = (file) => relative(root, file).split(sep).join("/");

// 1. "use client" has to match between src and dist. Bundlers strip
// module-level directives in some output modes, and a missing one only shows
// up later as a confusing RSC error in someone else's app.
const directive = /^\s*(?:\/\/[^\n]*\n|\/\*[\s\S]*?\*\/|\s)*["']use client["']/;
const isClient = (file) => directive.test(readFileSync(file, "utf8"));

function sourceFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    if (!/\.tsx?$/.test(entry.name)) return [];
    if (/\.(test|d)\.tsx?$/.test(entry.name)) return [];
    return [path];
  });
}

let scripts = 0;

for (const source of sourceFiles(srcDir)) {
  const base = relative(srcDir, source).replace(/\.tsx?$/, "");
  const expected = isClient(source);

  for (const ext of [".js", ".cjs"]) {
    const output = join(distDir, base + ext);
    // Files that no entry imports are never emitted. That's fine.
    if (!existsSync(output)) continue;
    scripts += 1;

    const actual = isClient(output);
    if (expected === actual) continue;

    problems.push(
      expected
        ? `${display(output)} lost its "use client" directive`
        : `${display(output)} has a "use client" directive its source doesn't`,
    );
  }
}

if (scripts === 0) {
  problems.push("no built scripts found in dist, did the build run?");
}

// 2. Every stylesheet has to open with the layer order. Someone who imports
// only button.css would otherwise get whatever order their bundler produces.
const layerOrder = "@layer tokens, base, components;";
const cssDir = join(distDir, "css");
const stylesheets = [
  ...["styles.css", "tokens.css", "base.css"].map((name) =>
    join(distDir, name),
  ),
  ...(existsSync(cssDir)
    ? readdirSync(cssDir)
        .filter((name) => name.endsWith(".css"))
        .map((name) => join(cssDir, name))
    : []),
];

for (const file of stylesheets) {
  if (!existsSync(file)) {
    problems.push(`${display(file)} is missing`);
  } else if (!readFileSync(file, "utf8").startsWith(layerOrder)) {
    problems.push(`${display(file)} doesn't start with "${layerOrder}"`);
  }
}

// 3. A component has to be wired up in four places. Missing one gives a
// component that passes its own tests and is absent for some consumers.
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const barrel = readFileSync(join(srcDir, "index.ts"), "utf8");
const allStyles = readFileSync(join(srcDir, "styles", "index.scss"), "utf8");
const componentsDir = join(srcDir, "components");
const components = existsSync(componentsDir)
  ? readdirSync(componentsDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
  : [];

for (const name of components) {
  if (!pkg.exports[`./${name}`]) {
    problems.push(`package.json has no "./${name}" export`);
  }
  if (!barrel.includes(`"./components/${name}"`)) {
    problems.push(`src/index.ts doesn't export ${name}`);
  }
  if (!allStyles.includes(`"../components/${name}/${name}"`)) {
    problems.push(`src/styles/index.scss doesn't @use ${name}`);
  }
  if (!existsSync(join(cssDir, `${name}.css`))) {
    problems.push(`dist/css/${name}.css is missing`);
  }
}

// 4. The SCSS copy has to compile from where it sits in dist, and give the
// same CSS as the precompiled file. A broken relative @use would fail here.
const shippedScss = join(distDir, "scss", "styles", "index.scss");
const shippedCss = join(distDir, "styles.css");
if (!existsSync(shippedScss)) {
  problems.push(`${display(shippedScss)} is missing`);
} else if (existsSync(shippedCss)) {
  try {
    const { css } = await compileAsync(shippedScss, { style: "expanded" });
    if (css.trim() !== readFileSync(shippedCss, "utf8").trim()) {
      problems.push(
        `${display(shippedScss)} compiles to different CSS than ${display(shippedCss)}`,
      );
    }
  } catch (error) {
    problems.push(`${display(shippedScss)} doesn't compile: ${error.message}`);
  }
}

if (problems.length > 0) {
  console.error(
    `check-dist failed:\n${problems.map((p) => `  - ${p}`).join("\n")}`,
  );
  process.exit(1);
}

console.log(
  `check-dist: "use client" matches src in ${scripts} scripts, ${stylesheets.length} stylesheets start with the layer order, ${components.length} components are fully wired up, shipped SCSS compiles to styles.css`,
);
