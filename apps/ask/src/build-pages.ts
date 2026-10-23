import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { readDocs } from "../../mcp/src/sources.ts";

// Run from dist/ by `pnpm build`, after tsdown: the repository is three
// folders up, and the pages go beside the server. They're read the way the
// MCP server reads them, by its own code, so the two answer from the same
// docs.
const root = fileURLToPath(new URL("../../../", import.meta.url));
const { version, pages } = readDocs(root);
const file = new URL("./pages.json", import.meta.url);
writeFileSync(file, JSON.stringify({ version, pages }));

console.log(
  `build-pages: ${pages.length} pages, for @nuvui/react ${version}, to ${fileURLToPath(file)}`,
);
