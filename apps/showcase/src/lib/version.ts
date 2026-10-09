import { readFileSync } from "node:fs";
import path from "node:path";

// Next runs with the app folder as the working directory, in dev and in a
// build. This is read on the server, when a page is made.
const manifest = path.join(
  process.cwd(),
  "..",
  "..",
  "packages",
  "ui",
  "package.json",
);

/**
 * The core package's version in the repository, or `null` while it has
 * never been released. Changesets sets it in the pull request a release is
 * published from, and it's "0.0.0" until the first one.
 */
export function libraryVersion(): string | null {
  const { version } = JSON.parse(readFileSync(manifest, "utf8")) as {
    version: string;
  };
  return version === "0.0.0" ? null : version;
}
