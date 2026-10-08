// Run after `next build`. Writes the blocks as a registry in the format
// shadcn's command line tool reads, into out/r: one JSON file for each block
// with its files in it, and registry.json, which lists them.
//
//   pnpm dlx shadcn@latest add https://<the site>/r/sign-in.json
//
// copies a block's files into an app and installs what they import from.
// The tool copies an SCSS file as it is. That was checked with shadcn
// 4.21.4, by installing an item made here into an empty project.
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const here = fileURLToPath(new URL("..", import.meta.url));
const blocks = join(here, "src", "blocks");
const target = join(here, "out", "r");
// The same address, from the same place, as src/lib/site.ts.
const site = process.env.NEXT_PUBLIC_SITE_URL ?? "https://nuvui.nuvraxis.com";

const names = (await readdir(blocks, { withFileTypes: true }))
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

const items = await Promise.all(
  names.map(async (name) => {
    const manifest = JSON.parse(
      await readFile(join(blocks, name, "block.json"), "utf8"),
    );
    return {
      $schema: "https://ui.shadcn.com/schema/registry-item.json",
      name,
      type: "registry:block",
      title: manifest.title,
      description: manifest.description,
      categories: [manifest.category],
      dependencies: manifest.install,
      files: await Promise.all(
        manifest.files.map(async (file) => ({
          path: `blocks/${name}/${file}`,
          // The tool's name for a file that goes with the app's components.
          // The two files of a block import each other by a relative path,
          // so they go in one folder.
          type: "registry:component",
          target: `components/${name}/${file}`,
          content: (await readFile(join(blocks, name, file), "utf8"))
            // A checkout on Windows may have the other line ending.
            .replaceAll("\r\n", "\n"),
        })),
      ),
    };
  }),
);

await mkdir(target, { recursive: true });
for (const item of items) {
  await writeFile(
    join(target, `${item.name}.json`),
    `${JSON.stringify(item, null, 2)}\n`,
  );
}
await writeFile(
  join(target, "registry.json"),
  `${JSON.stringify(
    {
      $schema: "https://ui.shadcn.com/schema/registry.json",
      name: "nuvui",
      homepage: site,
      // The list has everything but the files' contents, which are in each
      // block's own file.
      items: items.map(({ $schema, files, ...item }) => ({
        ...item,
        files: files.map(({ content, ...file }) => file),
      })),
    },
    null,
    2,
  )}\n`,
);

console.log(`add-registry: wrote ${items.length} blocks to out/r`);
