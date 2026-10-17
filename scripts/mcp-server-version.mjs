// Gives the MCP server's listing in the MCP Registry, apps/mcp/server.json,
// the version of @nuvui/react, which is what the server says it is. It runs
// after `changeset version`, so the pull request that releases the library
// has the listing's new version in it too. The registry takes a version
// once, so a listing published again without a new one is refused.
//
//   node scripts/mcp-server-version.mjs
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = path.join(import.meta.dirname, "..");
const read = (file) => JSON.parse(readFileSync(path.join(root, file), "utf8"));

export const listingFile = "apps/mcp/server.json";

export function withVersion(listing, version) {
  return { ...listing, version };
}

if (import.meta.main) {
  const { version } = read("packages/ui/package.json");
  const listing = read(listingFile);
  if (listing.version !== version) {
    writeFileSync(
      path.join(root, listingFile),
      `${JSON.stringify(withVersion(listing, version), null, 2)}\n`,
    );
    console.log(`${listingFile}: ${listing.version} to ${version}`);
  }
}
