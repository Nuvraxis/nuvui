// Run after `next build`. Copies the docs app's export into this app's, under
// /docs, so that `out` is the whole site: the website at / and the docs at
// /docs, in one folder of plain files.
//
// The docs are built with /docs as their base path, so every link and file
// name in them already says /docs. Nothing is rewritten here.
import { copyFile, cp, readFile, rm, stat, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const here = fileURLToPath(new URL("..", import.meta.url));
const docs = join(here, "..", "docs", "out");
const out = join(here, "out");
const target = join(out, "docs");

const isFile = async (path) => {
  try {
    return (await stat(path)).isFile();
  } catch {
    return false;
  }
};

if (!(await isFile(join(docs, "index.html")))) {
  console.error(
    "add-docs: the docs aren't built. Run pnpm build at the root, which builds them first.",
  );
  process.exit(1);
}

// A page of this app's own at /docs would be overwritten, silently.
if (await isFile(join(out, "docs.html"))) {
  console.error("add-docs: this app has a page at /docs, which is the docs'.");
  process.exit(1);
}

// Was the docs app really built to live under /docs? If its base path were
// taken away, every link in the copy would point outside the folder.
const index = await readFile(join(docs, "index.html"), "utf8");
if (!index.includes('"/docs/_next/')) {
  console.error(
    "add-docs: the docs' files don't ask for /docs/_next. Is basePath still /docs in apps/docs/next.config.ts?",
  );
  process.exit(1);
}

await rm(target, { recursive: true, force: true });
await cp(docs, target, { recursive: true });

// A static host serves one 404 page, the one at the root, which is this
// app's. The docs' own would never be shown.
await rm(join(target, "404.html"), { force: true });
await rm(join(target, "_not-found.html"), { force: true });

// Next's router asks for a page's data at the page's address with .txt on
// the end. For the docs' first page that's /docs.txt, beside the folder and
// not in it, where the export has nothing: its copy is /docs/index.txt.
// Without this a link to the docs' first page, followed before the router
// had fetched it ahead, got a 404 and loaded the whole page again.
await copyFile(join(target, "index.txt"), join(out, "docs.txt"));

// The marker the e2e tests and anyone looking at the folder can read.
await writeFile(
  join(out, "site.json"),
  `${JSON.stringify({ apps: { "/": "@nuvui/showcase", "/docs": "@nuvui/docs" } }, null, 2)}\n`,
);

console.log("add-docs: copied the docs into out/docs");
