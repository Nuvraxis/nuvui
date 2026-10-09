// Fails when a dependency has a license that isn't on a list.
//
// There are two lists. What the published packages depend on reaches the
// people who install them, and gets the short list. Everything else in the
// workspace, the docs, the website and the tools, is only used to build and
// test, and may also have the licenses on the second list.
//
// A license that isn't on either list isn't refused for good. It stops the
// build so that someone reads it and adds it here, or takes the dependency
// out.
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));

// Permissive licenses: use, change and pass on, with the notice kept.
const shipped = new Set([
  "MIT",
  "MIT-0",
  "ISC",
  "0BSD",
  "BSD-2-Clause",
  "BSD-3-Clause",
  "Apache-2.0",
  "CC0-1.0",
]);

// Also fine in a tool that isn't passed on. Each has a reason.
const toolsOnly = new Set([
  // Weak copyleft, file by file. axe-core in the tests, lightningcss in
  // the builds. Neither is changed or shipped.
  "MPL-2.0",
  // caniuse-lite's data, read by the build tools.
  "CC-BY-4.0",
  // argparse, a command line parser a tool depends on.
  "Python-2.0",
]);

// The folders of the packages that are published.
const published = ["ui", "table", "date-picker", "charts"];

// One string, run by a shell: pnpm is a .cmd file on Windows, which only
// runs through one. Nothing in it comes from outside this file.
function licenses(filters) {
  const command = [
    "pnpm",
    ...filters.map((name) => `--filter ./packages/${name}`),
    "licenses list --prod --json",
  ].join(" ");
  const out = execSync(command, {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
  return JSON.parse(out);
}

/**
 * Whether every license in an SPDX expression is allowed. "A AND B" needs
 * both, and so does "A OR B" here: it's simpler than choosing, and nothing
 * has needed the choice yet.
 */
export function allowed(expression, list) {
  return expression
    .replace(/[()]/g, "")
    .split(/\s+(?:AND|OR)\s+/)
    .every((license) => list.has(license.trim()));
}

function check(name, found, list) {
  const problems = [];
  let count = 0;
  for (const [license, packages] of Object.entries(found)) {
    count += packages.length;
    if (allowed(license, list)) continue;
    for (const item of packages) {
      problems.push(`  ${item.name} ${item.versions.join(", ")}: ${license}`);
    }
  }
  if (problems.length > 0) {
    console.error(`check-licenses: ${name}: not on the list:`);
    console.error(problems.join("\n"));
    return false;
  }
  console.log(`check-licenses: ${name}: ${count} dependencies, all allowed`);
  return true;
}

const everything = new Set([...shipped, ...toolsOnly]);
const ok = [
  check("the published packages", licenses(published), shipped),
  check("the whole workspace", licenses([]), everything),
];

if (ok.includes(false)) process.exit(1);
