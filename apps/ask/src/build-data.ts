import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Page } from "../../mcp/src/data.ts";
import { readSources, sectionsOf } from "../../mcp/src/sources.ts";

// Run from dist/ by `pnpm build`, after tsdown: the repository is three
// folders up, and the data goes beside the server. It's read the way the
// MCP server reads it, by its own code, so the model's tools answer from
// the same docs as the MCP server's.
const root = fileURLToPath(new URL("../../../", import.meta.url));
const data = readSources(root);

// The skill leaves out its own page and the MCP server's, since an agent
// using them needn't be told how to set them up. A visitor asks about
// both. They're plain Markdown under a header.
function guide(id: string): Page {
  const file = path.join(root, "apps", "docs", "content", "docs", `${id}.mdx`);
  const text = readFileSync(file, "utf8").replaceAll("\r\n", "\n");
  const header = /^---\n([\s\S]*?)\n---\n+/.exec(text);
  const field = (name: string) =>
    new RegExp(`^${name}:\\s*(.+)$`, "m")
      .exec(header?.[1] ?? "")?.[1]
      ?.trim()
      .replace(/^"(.*)"$/, "$1") ?? "";
  const title = field("title");
  const description = field("description");
  const markdown = `# ${title}\n\n${description}\n\n${text.slice(header?.[0].length ?? 0).trim()}`;
  return {
    id,
    title,
    description,
    group: "Guides",
    package: null,
    markdown,
    sections: sectionsOf(markdown),
  };
}

data.pages.push(guide("agents"), guide("mcp"));

const file = new URL("./data.json", import.meta.url);
writeFileSync(file, JSON.stringify(data));

console.log(
  `build-data: ${data.pages.length} pages, ${data.blocks.length} blocks and ${data.charts.length} charts, for @nuvui/react ${data.version}, to ${fileURLToPath(file)}`,
);
