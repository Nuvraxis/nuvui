// Compiles the SCSS into the CSS files the package ships, and copies the SCSS
// source next to them for people who'd rather compile it themselves. No JS
// file imports CSS, so this is separate from the tsdown build.
import { cp, mkdir, readdir, rm, writeFile } from "node:fs/promises";
import { basename, dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { initAsyncCompiler } from "sass-embedded";

const root = fileURLToPath(new URL("..", import.meta.url));
const srcDir = join(root, "src");
const distDir = join(root, "dist");

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

const sources = await scssFiles(srcDir);

const outputs = new Map([
  ["styles.css", join(srcDir, "styles", "index.scss")],
  ["tokens.css", join(srcDir, "styles", "tokens.scss")],
  ["base.css", join(srcDir, "styles", "base.scss")],
]);

// src/components/button/button.scss becomes dist/css/button.css.
const componentsDir = join(srcDir, "components") + sep;
for (const file of sources) {
  if (!file.startsWith(componentsDir) || basename(file).startsWith("_")) {
    continue;
  }
  outputs.set(join("css", `${basename(file, ".scss")}.css`), file);
}

// tsdown empties dist on a full build, but this script also runs alone in
// watch mode, where a deleted component would otherwise leave its CSS behind.
await rm(join(distDir, "css"), { recursive: true, force: true });
await rm(join(distDir, "scss"), { recursive: true, force: true });

const compiler = await initAsyncCompiler();
try {
  for (const [output, entry] of outputs) {
    const { css } = await compiler.compileAsync(entry, { style: "expanded" });
    const target = join(distDir, output);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, `${css}\n`);

    const kb = (Buffer.byteLength(css) / 1024).toFixed(2);
    console.log(`build-css: dist/${output.split(sep).join("/")}  ${kb} kB`);
  }
} finally {
  await compiler.dispose();
}

// The folder structure is kept so the relative @use paths still resolve.
for (const file of sources) {
  const target = join(distDir, "scss", relative(srcDir, file));
  await mkdir(dirname(target), { recursive: true });
  await cp(file, target);
}
console.log(`build-css: copied ${sources.length} SCSS files to dist/scss`);
