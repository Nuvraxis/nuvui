// Installs the browsers the tests run in, unless they're already there.
//
//   node scripts/playwright-browsers.mjs [--with-deps]
//
// A self-hosted runner's image has them baked in, and there this finds them
// and does nothing. On a runner that starts empty it installs them, with the
// system libraries they need when --with-deps is given.
//
// "Already there" means the builds this repository's version of Playwright
// asks for, each one finished. A runner image made for another version has
// other builds, so they're not found, and the right ones are installed. That
// costs the time it would have saved, and nothing else: raise
// PLAYWRIGHT_VERSION in the image to match pnpm-workspace.yaml.
import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { argv } from "node:process";
import { pathToFileURL } from "node:url";

const browsers = ["chromium", "firefox", "webkit"];

/**
 * The folders `playwright install --dry-run` says it would install into.
 *
 * @param {string} text What it printed.
 */
export function locations(text) {
  return [...text.matchAll(/^\s*Install location:\s*(.+?)\s*$/gm)].map(
    (match) => match[1],
  );
}

/**
 * Whether every folder is there, with the file Playwright leaves in one
 * when an install has finished.
 *
 * @param {string[]} folders
 * @param {(file: string) => boolean} exists
 */
export function allInstalled(folders, exists = existsSync) {
  // None at all means the output wasn't understood, which isn't a yes.
  return (
    folders.length > 0 &&
    folders.every((folder) =>
      exists(path.join(folder, "INSTALLATION_COMPLETE")),
    )
  );
}

function main() {
  const withDeps = argv.includes("--with-deps");
  // Through the package that depends on Playwright, so it's that version.
  const playwright = (args, options) =>
    // One line for a shell, because on Windows pnpm is a .cmd file and only
    // a shell can start one. Every word of it is written in this file.
    execSync(
      ["pnpm --filter @nuvui/react exec playwright install", ...args].join(" "),
      options,
    );

  const asked = playwright(["--dry-run", ...browsers], { encoding: "utf8" });
  const folders = locations(asked);
  if (allInstalled(folders)) {
    console.log(
      `The browsers are already here, ${folders.length} builds. Nothing to install.`,
    );
    return;
  }

  console.log("Not every browser is here. Installing.");
  playwright([...(withDeps ? ["--with-deps"] : []), ...browsers], {
    stdio: "inherit",
  });
}

if (argv[1] && import.meta.url === pathToFileURL(argv[1]).href) {
  main();
}
