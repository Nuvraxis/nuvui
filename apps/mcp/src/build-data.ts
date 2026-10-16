import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { readSources } from "./sources";

// Run from dist/ by `pnpm build`, after tsdown: the repository is three
// folders up, and the data goes beside the server.
const root = fileURLToPath(new URL("../../../", import.meta.url));
const data = readSources(root);
const file = new URL("./data.json", import.meta.url);
writeFileSync(file, JSON.stringify(data));

console.log(
  `build-data: ${data.pages.length} pages, ${data.rules.length} rules, ${data.blocks.length} blocks and ${data.charts.length} charts, for @nuvui/react ${data.version}, to ${fileURLToPath(file)}`,
);
