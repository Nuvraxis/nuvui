// Compiles a package's SCSS into the CSS files it ships. No JS file imports
// CSS, so this is separate from the tsdown build.
import { cp, mkdir, readdir, rm, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { basename, dirname, join, relative, sep } from "node:path";
import { pathToFileURL } from "node:url";
import { createTheme, presetNames, presets, toCss } from "@nuvui/theme";
import { initAsyncCompiler } from "sass-embedded";

export const layerOrder = "@layer tokens, base, components;";

async function scssFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((entry) => {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) return scssFiles(path);
      return entry.name.endsWith(".scss") ? [path] : [];
    }),
  );
  return nested.flat();
}

// Lets an add-on's SCSS load the core's mixins by the name people outside
// this repository use: @use "@nuvui/react/scss/mixins". Sass has no idea
// what a package is, so this looks the file up the way Node would, starting
// from the package being built.
export function packageImporter(root) {
  const require = createRequire(join(root, "package.json"));
  return {
    findFileUrl(url) {
      if (!url.startsWith("@nuvui/")) return null;
      return pathToFileURL(require.resolve(url));
    },
  };
}

// The text of a preset's stylesheet. It opens with the layer order like
// every other stylesheet, and sits in the tokens layer so a rule of the
// consumer's own still wins over it.
export function presetCss(name) {
  const css = toCss(createTheme(presets[name]), {
    preset: name,
    layer: "tokens",
  });
  return `${layerOrder}
${css}`;
}

/**
 * @param {object} options
 * @param {string} options.root The package's folder.
 * @param {Record<string, string>} options.stylesheets A file in dist, and
 *   the SCSS file in src it's compiled from. Every component's own
 *   stylesheet goes to dist/css without being listed.
 * @param {boolean} [options.presets] Write the presets to dist/themes.
 * @param {boolean} [options.scss] Copy the SCSS source to dist/scss, for
 *   people who'd rather compile it themselves.
 */
export async function buildCss({
  root,
  stylesheets,
  presets: withPresets = false,
  scss = false,
}) {
  const srcDir = join(root, "src");
  const distDir = join(root, "dist");
  const sources = await scssFiles(srcDir);

  const outputs = new Map(
    Object.entries(stylesheets).map(([output, source]) => [
      output,
      join(root, source),
    ]),
  );

  // src/components/button/button.scss becomes dist/css/button.css.
  const componentsDir = join(srcDir, "components") + sep;
  for (const file of sources) {
    if (!file.startsWith(componentsDir) || basename(file).startsWith("_")) {
      continue;
    }
    outputs.set(join("css", `${basename(file, ".scss")}.css`), file);
  }

  // tsdown empties dist on a full build, but this also runs alone in watch
  // mode, where a deleted component would otherwise leave its CSS behind.
  for (const folder of ["css", "scss", "themes"]) {
    await rm(join(distDir, folder), { recursive: true, force: true });
  }

  const compiler = await initAsyncCompiler();
  try {
    for (const [output, entry] of outputs) {
      const { css } = await compiler.compileAsync(entry, {
        style: "expanded",
        importers: [packageImporter(root)],
      });
      const target = join(distDir, output);
      await mkdir(dirname(target), { recursive: true });
      await writeFile(target, `${css}\n`);

      const kb = (Buffer.byteLength(css) / 1024).toFixed(2);
      console.log(`build-css: dist/${output.split(sep).join("/")}  ${kb} kB`);
    }
  } finally {
    await compiler.dispose();
  }

  if (withPresets) {
    await mkdir(join(distDir, "themes"), { recursive: true });
    for (const name of presetNames) {
      await writeFile(join(distDir, "themes", `${name}.css`), presetCss(name));
    }
    console.log(
      `build-css: wrote ${presetNames.length} presets to dist/themes (${presetNames.join(", ")})`,
    );
  }

  if (scss) {
    // The folder structure is kept so the relative @use paths still resolve.
    for (const file of sources) {
      const target = join(distDir, "scss", relative(srcDir, file));
      await mkdir(dirname(target), { recursive: true });
      await cp(file, target);
    }
    console.log(`build-css: copied ${sources.length} SCSS files to dist/scss`);
  }
}
