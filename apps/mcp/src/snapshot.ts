import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readDocs } from "./sources";
import { lineOf, parseVersion } from "./versions";

// Keeps the docs of a release, so the server can answer for that release
// after newer ones are out. Run from dist/ after tsdown:
//
//   pnpm --filter @nuvui/mcp snapshot             the repository as it is
//   pnpm --filter @nuvui/mcp snapshot <git ref>   a release from before
//
// `pnpm version-packages` runs the first, after `changeset version`, so the
// pull request that releases the library has its docs in it. The second
// is for releases from before that, such as @nuvui/react@0.6.0. The skill
// that the docs are read from first shipped in 0.6.0, so nothing older can
// be kept.
//
// Each release line is one file, such as versions/0.6.json, and a patch
// release writes over its line's file: the latest of a line describes it.

const root = fileURLToPath(new URL("../../../", import.meta.url));
const folder = fileURLToPath(new URL("../versions/", import.meta.url));

// What the docs are read from, and nothing else of the repository.
const paths = [
  "skills/nuvui",
  "apps/showcase/src/blocks",
  "packages/*/package.json",
];

function git(args: string[]) {
  const result = spawnSync("git", args, { cwd: root, maxBuffer: 1 << 30 });
  if (result.status !== 0) {
    throw new Error(
      `git ${args.join(" ")}: ${result.stderr.toString().trim() || `exit ${result.status}`}`,
    );
  }
  return result.stdout;
}

// The files of a release, in a folder of their own, laid out as the
// repository is.
function checkout(ref: string) {
  const dir = mkdtempSync(path.join(tmpdir(), "nuvui-snapshot-"));
  const tar = path.join(dir, "release.tar");
  writeFileSync(tar, git(["archive", "--format=tar", ref, "--", ...paths]));
  const result = spawnSync("tar", ["-xf", "release.tar"], { cwd: dir });
  if (result.status !== 0) {
    throw new Error(`tar: ${result.stderr.toString().trim()}`);
  }
  return dir;
}

const ref = process.argv[2];
const from = ref ? checkout(ref) : root;
try {
  const docs = readDocs(from);
  const version = parseVersion(docs.version);
  if (!version || docs.version === "0.0.0") {
    throw new Error(`@nuvui/react has no release version: ${docs.version}`);
  }
  mkdirSync(folder, { recursive: true });
  const file = path.join(folder, `${lineOf(version)}.json`);
  writeFileSync(file, `${JSON.stringify(docs)}\n`);
  console.log(
    `snapshot: ${docs.pages.length} pages and ${docs.blocks.length} blocks, for @nuvui/react ${docs.version}${ref ? ` at ${ref}` : ""}, to ${file}`,
  );
} finally {
  if (from !== root) rmSync(from, { recursive: true, force: true });
}
