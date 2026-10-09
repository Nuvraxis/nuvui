// Checks a built package for things that break consumers quietly and that
// nothing else in the toolchain would catch.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { presetNames } from "@nuvui/theme";
import { compileAsync } from "sass-embedded";
import { layerOrder, packageImporter, presetCss } from "./build-css.mjs";

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

/**
 * @param {object} options
 * @param {string} options.root The package's folder.
 * @param {string[]} options.stylesheets The stylesheets at the top of dist.
 * @param {boolean} [options.presets] The package ships the presets.
 * @param {boolean} [options.scss] The package ships its SCSS source.
 */
export async function checkDist({
  root,
  stylesheets: named,
  presets = false,
  scss = false,
}) {
  const srcDir = join(root, "src");
  const distDir = join(root, "dist");

  const problems = [];
  const passed = [];
  const display = (file) => relative(root, file).split(sep).join("/");

  // 1. "use client" has to match between src and dist. Bundlers strip
  // module-level directives in some output modes, and a missing one only
  // shows up later as a confusing RSC error in someone else's app.
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
  passed.push(`"use client" matches src in ${scripts} scripts`);

  // 2. Every stylesheet has to open with the layer order. Someone who
  // imports only button.css would otherwise get whatever order their
  // bundler produces.
  const cssDir = join(distDir, "css");
  const themesDir = join(distDir, "themes");
  const stylesheets = [
    ...named.map((name) => join(distDir, name)),
    ...(presets
      ? presetNames.map((name) => join(themesDir, `${name}.css`))
      : []),
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
  passed.push(`${stylesheets.length} stylesheets start with the layer order`);

  // 3. A component has to be wired up in five places. Missing one gives a
  // component that passes its own tests and is absent for some consumers.
  const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
  const barrel = readFileSync(join(srcDir, "index.ts"), "utf8");
  const allStyles = readFileSync(join(srcDir, "styles", "index.scss"), "utf8");
  const componentsDir = join(srcDir, "components");
  const budgets = JSON.parse(
    readFileSync(join(root, ".size-limit.json"), "utf8"),
  );
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
    if (
      !budgets.some(({ path }) => path === `dist/components/${name}/index.js`)
    ) {
      problems.push(`.size-limit.json has no size budget for ${name}`);
    }
  }
  passed.push(`${components.length} components are fully wired up`);

  if (scss) {
    // 4. The SCSS copy has to compile from where it sits in dist, and give
    // the same CSS as the precompiled file. A broken relative @use would
    // fail here.
    const shippedScss = join(distDir, "scss", "styles", "index.scss");
    const shippedCss = join(distDir, "styles.css");
    if (!existsSync(shippedScss)) {
      problems.push(`${display(shippedScss)} is missing`);
    } else if (existsSync(shippedCss)) {
      try {
        const { css } = await compileAsync(shippedScss, {
          style: "expanded",
          importers: [packageImporter(root)],
        });
        if (css.trim() !== readFileSync(shippedCss, "utf8").trim()) {
          problems.push(
            `${display(shippedScss)} compiles to different CSS than ${display(shippedCss)}`,
          );
        }
      } catch (error) {
        problems.push(
          `${display(shippedScss)} doesn't compile: ${error.message}`,
        );
      }
    }
    passed.push("shipped SCSS compiles to styles.css");

    // 5. The mixins file has to stand alone. It's the one people load from
    // the package into their own Sass, and on Windows, Next.js with
    // Turbopack fails on any file loaded that way that loads another by a
    // relative path.
    const shippedMixins = join(distDir, "scss", "styles", "_mixins.scss");
    if (!existsSync(shippedMixins)) {
      problems.push(`${display(shippedMixins)} is missing`);
    } else {
      const loads = readFileSync(shippedMixins, "utf8")
        .split("\n")
        .filter((line) => /^\s*@(use|forward|import)\s/.test(line))
        .filter((line) => !/^\s*@use\s+["']sass:/.test(line));
      if (loads.length > 0) {
        problems.push(
          `${display(shippedMixins)} loads other files: ${loads.map((line) => line.trim()).join(" ")}`,
        );
      }
    }
    passed.push("the mixins file loads nothing else");
  }

  if (presets) {
    // 6. Each preset has to be what the generator gives for it today, with
    // nothing left over from a preset that's been renamed or removed. The
    // generator throws if a preset no longer has enough contrast.
    if (!pkg.exports["./themes/*.css"]) {
      problems.push('package.json has no "./themes/*.css" export');
    }
    for (const name of presetNames) {
      const file = join(themesDir, `${name}.css`);
      if (!existsSync(file)) continue;
      if (readFileSync(file, "utf8") !== presetCss(name)) {
        problems.push(`${display(file)} isn't what the theme generator writes`);
      }
    }
    if (existsSync(themesDir)) {
      for (const name of readdirSync(themesDir)) {
        if (!presetNames.includes(name.replace(/.css$/, ""))) {
          problems.push(`${display(join(themesDir, name))} isn't a preset`);
        }
      }
    }
    passed.push(`${presetNames.length} presets match the generator`);
  }

  if (problems.length > 0) {
    console.error(
      `check-dist failed:\n${problems.map((p) => `  - ${p}`).join("\n")}`,
    );
    process.exit(1);
  }

  console.log(`check-dist: ${passed.join(", ")}`);
}
