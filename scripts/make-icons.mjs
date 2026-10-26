// Draws every icon of the site from one file, apps/showcase/src/app/icon.svg.
// Run it after changing that file, and commit what it writes:
//
//   node scripts/make-icons.mjs
//
// What it writes, and who asks for each:
//
//   favicon.ico             a browser that asks for /favicon.ico without
//                           being told, and anything too old for an SVG icon
//   apple-icon.png          an iPhone's home screen
//   icons/icon-*.png        Android's home screen, through the manifest
//   the docs' copies        the docs app is served under /docs, and has to
//                           have its own to be whole when it's run alone
//
// Next finds icon.svg, favicon.ico and apple-icon.png by their names in an
// app folder and writes the <link> tags for them.
import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const website = join(root, "apps", "showcase");
const docs = join(root, "apps", "docs");

// sharp is installed with Next, which uses it for images. It isn't a
// dependency of anything here by name, so it's found through Next.
const fromWebsite = createRequire(join(website, "package.json"));
const sharp = createRequire(fromWebsite.resolve("next/package.json"))("sharp");

const source = await readFile(join(website, "src", "app", "icon.svg"), "utf8");

// The colors a light tab gets, where icon.svg changes them for a dark one.
// An image file has one set of colors, and can't swap them the way an SVG
// can.
const fixed = source.replace(/@media[^{]+\{(?:[^{}]*\{[^{}]*\})*[^{}]*\}/, "");

// For a home screen: the square fills the whole picture, with no rounded
// corners and no edge. The phone cuts its own shape out of it.
const fullBleed = fixed
  .replace(/(<rect class="tile"[^>]*?)\srx="[^"]*"/, "$1")
  .replace(/\s*<rect class="edge"[^>]*\/>/, "");
if (!/<rect class="tile"/.test(fixed) || /<rect class="edge"/.test(fullBleed)) {
  throw new Error(
    'make-icons: icon.svg needs its square as class="tile" and the square\'s edge as class="edge".',
  );
}

const viewBox = (svg) => {
  const box = svg
    .match(/viewBox="([^"]+)"/)?.[1]
    .split(/\s+/)
    .map(Number);
  if (box?.length !== 4) throw new Error("make-icons: an SVG has no viewBox.");
  return box;
};

// Android may cut a maskable icon to a circle, which keeps only the middle
// four fifths of it. The mark is drawn smaller in the middle of its square,
// so what's near its corners survives the cut.
const [x, y, width, height] = viewBox(fullBleed);
const tile = fullBleed.match(/<rect class="tile"[^>]*fill="([^"]+)"/)?.[1];
const inside = fullBleed
  .replace(/^[\s\S]*?<svg[^>]*>/, "")
  .replace(/<\/svg>\s*$/, "");
const maskable = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width * 1.25} ${height * 1.25}"><rect width="100%" height="100%" fill="${tile}"/><svg x="${width / 8}" y="${height / 8}" width="${width}" height="${height}" viewBox="${x} ${y} ${width} ${height}">${inside}</svg></svg>`;

// Drawn at the size it's wanted, from however wide the SVG says it is.
const png = (svg, size) =>
  sharp(Buffer.from(svg), { density: (72 * size) / viewBox(svg)[2] })
    .resize(size, size)
    .png({ compressionLevel: 9 })
    .toBuffer();

// An .ico file is a list of pictures, each of which can be a PNG as it is.
function ico(pictures) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(pictures.length, 4);

  let offset = header.length + 16 * pictures.length;
  const entries = pictures.map(({ size, data }) => {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size, 0);
    entry.writeUInt8(size, 1);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(data.length, 8);
    entry.writeUInt32LE(offset, 12);
    offset += data.length;
    return entry;
  });

  return Buffer.concat([
    header,
    ...entries,
    ...pictures.map(({ data }) => data),
  ]);
}

const written = [];
async function write(path, data) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, data);
  written.push(path.slice(root.length).replaceAll("\\", "/"));
}

const favicon = ico(
  await Promise.all(
    [16, 32, 48].map(async (size) => ({ size, data: await png(fixed, size) })),
  ),
);
const apple = await png(fullBleed, 180);

await write(join(website, "src", "app", "favicon.ico"), favicon);
await write(join(website, "src", "app", "apple-icon.png"), apple);
for (const size of [192, 512]) {
  await write(
    join(website, "public", "icons", `icon-${size}.png`),
    await png(fixed, size),
  );
}
await write(
  join(website, "public", "icons", "icon-maskable-512.png"),
  await png(maskable, 512),
);

await copyFile(
  join(website, "src", "app", "icon.svg"),
  join(docs, "app", "icon.svg"),
);
written.push("apps/docs/app/icon.svg");
await write(join(docs, "app", "favicon.ico"), favicon);
await write(join(docs, "app", "apple-icon.png"), apple);

console.log(`make-icons: wrote\n  ${written.join("\n  ")}`);
