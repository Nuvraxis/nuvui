// Two scripts keep a list of the published packages by hand: the license
// check, which holds what they depend on to the short list, and the
// consumer test, which installs each one. A package missing from either is
// never checked, and nothing says so. The license check had four of ten
// when this test was written.
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";

const root = path.join(import.meta.dirname, "..");
const packagesDir = path.join(root, "packages");

// Every package that isn't private, by its folder.
const published = readdirSync(packagesDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => ({
    folder: entry.name,
    manifest: JSON.parse(
      readFileSync(path.join(packagesDir, entry.name, "package.json"), "utf8"),
    ),
  }))
  .filter(({ manifest }) => !manifest.private);

// The scripts run when they're imported, so their lists are read as text.
const source = (file) => readFileSync(path.join(root, "scripts", file), "utf8");
function listIn(text, name) {
  const match = new RegExp(`const ${name} = ([\\[{][\\s\\S]*?[\\]}]);`).exec(
    text,
  );
  assert.ok(match?.[1], `no list named ${name}`);
  return match[1];
}

test("there are published packages to look for", () => {
  assert.ok(published.length >= 10);
});

test("the license check reads every published package", () => {
  const list = listIn(source("check-licenses.mjs"), "published");
  for (const { folder } of published) {
    assert.ok(
      list.includes(`"${folder}"`),
      `scripts/check-licenses.mjs doesn't check packages/${folder}`,
    );
  }
});

test("the consumer test installs every published package", () => {
  const list = listIn(source("test-consumers.mjs"), "published");
  for (const { folder, manifest } of published) {
    assert.ok(
      list.includes(`"${manifest.name}": "${folder}"`),
      `scripts/test-consumers.mjs doesn't install ${manifest.name}`,
    );
  }
});
