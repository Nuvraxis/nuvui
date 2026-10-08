// Run after `next build`. For every route, Next writes small files that its
// router fetches ahead of a navigation, with names like
// `__next.docs.$oc$slug.__PAGE__.txt`. On Windows the export builds that name
// from a path with backslashes in it, so the file lands in nested folders,
// `__next.docs/$oc$slug/__PAGE__.txt`, where the router never looks. Every
// prefetch then gets a 404. Pages still open, but each navigation starts
// from nothing.
//
// This moves those files to the names they're asked for by. On Linux the
// export is already right and there's nothing to move. It can go once Next
// fixes the export. That's https://github.com/vercel/next.js/issues/85374,
// still open and still happening in 16.4.0-canary.61.
import { readdir, rename, rm } from "node:fs/promises";
import { join, resolve } from "node:path";

// The export to fix: node scripts/fix-next-export.mjs <folder>
const [folder] = process.argv.slice(2);
if (!folder) {
  console.error("fix-export: usage: node scripts/fix-next-export.mjs <folder>");
  process.exit(1);
}
const outDir = resolve(folder);
const prefix = "__next.";

// Every file under a folder, as the list of names that lead to it.
async function filesIn(dir, parents = []) {
  const entries = await readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((entry) =>
      entry.isDirectory()
        ? filesIn(join(dir, entry.name), [...parents, entry.name])
        : [[...parents, entry.name]],
    ),
  );
  return nested.flat();
}

let moved = 0;

async function fix(dir) {
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const path = join(dir, entry.name);

    // A correct export has no folder with this prefix, only files.
    if (!entry.name.startsWith(prefix)) {
      await fix(path);
      continue;
    }

    for (const parts of await filesIn(path)) {
      await rename(
        join(path, ...parts),
        join(dir, [entry.name, ...parts].join(".")),
      );
      moved += 1;
    }
    await rm(path, { recursive: true });
  }
}

await fix(outDir);

console.log(
  moved > 0
    ? `fix-export: moved ${moved} prefetch files to the names the router asks for`
    : "fix-export: nothing to move",
);
