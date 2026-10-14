// Writes src/data/en.ts from emojibase-data: the emoji the picker lists,
// in Unicode's own order, each with its name, the words it's found by, its
// group, the version of Emoji it came in, and its five skin tones where it
// has them. The file is kept in the repository, so a build doesn't depend
// on this having been run. Run it again when emojibase-data is updated:
//
//   pnpm --filter @nuvui/emoji generate
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const read = (file) =>
  JSON.parse(readFileSync(require.resolve(`emojibase-data/${file}`), "utf8"));

const all = read("en/data.json");
const { version } = read("package.json");

// emojibase's number for each group, and the place in the picker's list
// of groups. Its group 2 is the parts emoji are made of, a skin tone or a
// hair style by itself, which nobody picks.
const groups = new Map([
  [0, 0],
  [1, 1],
  [3, 2],
  [4, 3],
  [5, 4],
  [6, 5],
  [7, 6],
  [8, 7],
  [9, 8],
]);

const rows = all
  .filter((emoji) => groups.has(emoji.group) && emoji.order !== undefined)
  .sort((a, b) => a.order - b.order)
  .map((emoji) => {
    // One tone for the whole emoji. Two people with a tone each are left
    // as they are without one: the picker has one tone to give.
    const tones = [1, 2, 3, 4, 5].map(
      (tone) => emoji.skins?.find((skin) => skin.tone === tone)?.emoji,
    );
    // The name's own words are searched too, so they aren't said twice.
    const named = new Set(emoji.label.toLowerCase().split(/[^a-z0-9]+/));
    const tags = (emoji.tags ?? []).filter((tag) => !named.has(tag));
    const row = [
      emoji.emoji,
      emoji.label,
      tags.join(" "),
      groups.get(emoji.group),
      emoji.version,
    ];
    if (tones.every(Boolean)) row.push(tones);
    return row;
  });

const file = fileURLToPath(new URL("../src/data/en.ts", import.meta.url));
writeFileSync(
  file,
  `// Written by scripts/generate-data.mjs from emojibase-data ${version},
// which is MIT and takes its names from Unicode's CLDR. Don't edit it.
import type { EmojiRow } from "./rows";

export const rows: EmojiRow[] = ${JSON.stringify(rows)};
`,
);
console.log(`generate-data: wrote ${rows.length} emoji to src/data/en.ts`);
