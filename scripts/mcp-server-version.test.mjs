import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { listingFile, withVersion } from "./mcp-server-version.mjs";

const root = path.join(import.meta.dirname, "..");
const read = (file) => JSON.parse(readFileSync(path.join(root, file), "utf8"));
const listing = read(listingFile);

test("the listing has the version the server says it is", () => {
  assert.equal(listing.version, read("packages/ui/package.json").version);
});

test("only the version changes, and the fields stay in their order", () => {
  const changed = withVersion(listing, "9.9.9");

  assert.equal(changed.version, "9.9.9");
  assert.deepEqual(Object.keys(changed), Object.keys(listing));
  assert.deepEqual({ ...changed, version: listing.version }, listing);
});

// Both read the versions changeset version has just written: the listing
// takes @nuvui/react's, and the MCP server keeps the release's docs under
// its line.
test("version-packages writes it, and the release's docs, after changeset version", () => {
  const { scripts } = read("package.json");

  assert.match(
    scripts["version-packages"],
    /^changeset version && node scripts\/mcp-server-version\.mjs && pnpm --filter @nuvui\/mcp snapshot$/,
  );
});

// What the registry checks, and what has to agree with the docs.
test("the listing is one the registry takes, at the address the docs give", () => {
  assert.equal(listing.name, "io.github.Nuvraxis/nuvui");
  assert.ok(listing.description.length <= 100);
  assert.deepEqual(listing.remotes, [
    { type: "streamable-http", url: "https://nuvui.nuvraxis.com/mcp" },
  ]);
  assert.match(
    readFileSync(path.join(root, "apps/docs/content/docs/mcp.mdx"), "utf8"),
    /https:\/\/nuvui\.nuvraxis\.com\/mcp/,
  );
});
