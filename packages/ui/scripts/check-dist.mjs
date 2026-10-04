// Fails the build if a "use client" directive was lost or gained between
// src and dist. Bundlers strip module-level directives in some output modes,
// and a missing one only shows up later as a confusing RSC error in a
// consumer's app.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const srcDir = join(root, "src");
const distDir = join(root, "dist");

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

const problems = [];
let checked = 0;

for (const source of sourceFiles(srcDir)) {
  const base = relative(srcDir, source).replace(/\.tsx?$/, "");
  const expected = isClient(source);

  for (const ext of [".js", ".cjs"]) {
    const output = join(distDir, base + ext);
    // Files that no entry imports are never emitted. That's fine.
    if (!existsSync(output)) continue;
    checked += 1;

    const actual = isClient(output);
    if (expected === actual) continue;

    const name = relative(root, output).split(sep).join("/");
    problems.push(
      expected
        ? `${name} lost its "use client" directive`
        : `${name} has a "use client" directive its source doesn't`,
    );
  }
}

if (checked === 0) {
  problems.push("no built files found in dist, did the build run?");
}

if (problems.length > 0) {
  console.error(
    `check-dist failed:\n${problems.map((p) => `  - ${p}`).join("\n")}`,
  );
  process.exit(1);
}

console.log(`check-dist: "use client" matches src in ${checked} files`);
