// Every add-on asks for the core as a peer, by a range. When the core moves
// to a new minor version, a range written before it can leave it out: for a
// 0.x version, ^0.4.0 means 0.4 only. Changesets doesn't move the range of
// a package that hasn't been released yet, and @nuvui/emoji 0.1.0 went out
// asking for ^0.4.0 beside a core at 0.5.0, which npm refuses to install.
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";

const packagesDir = path.join(import.meta.dirname, "..", "packages");

const manifests = readdirSync(packagesDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) =>
    JSON.parse(
      readFileSync(path.join(packagesDir, entry.name, "package.json"), "utf8"),
    ),
  );

const core = manifests.find((manifest) => manifest.name === "@nuvui/react");

const parse = (version) => version.split(".").map(Number);

// Whether a caret range takes the version. Only the forms this repository
// writes: `^1.2.3`, and `^0.4.0`, where the first number that isn't nought
// is the one that has to stay the same.
function caretTakes(range, version) {
  const match = /^\^(\d+\.\d+\.\d+)$/.exec(range);
  if (!match?.[1]) return false;
  const [major, minor, patch] = parse(match[1]);
  const [vMajor, vMinor, vPatch] = parse(version);
  if (major > 0) {
    return (
      vMajor === major &&
      (vMinor > minor || (vMinor === minor && vPatch >= patch))
    );
  }
  if (minor > 0) return vMajor === 0 && vMinor === minor && vPatch >= patch;
  return vMajor === 0 && vMinor === 0 && vPatch === patch;
}

test("the core is found", () => {
  assert.ok(core, "packages/ui is @nuvui/react");
});

test("every add-on's range for the core takes the core's version", () => {
  const addons = manifests.filter(
    (manifest) =>
      !manifest.private && manifest.peerDependencies?.["@nuvui/react"],
  );
  assert.ok(addons.length > 0, "there are add-ons to check");
  for (const manifest of addons) {
    const range = manifest.peerDependencies["@nuvui/react"].replace(
      /^workspace:/,
      "",
    );
    assert.ok(
      caretTakes(range, core.version),
      `${manifest.name} asks for @nuvui/react ${range}, which leaves out ${core.version}`,
    );
  }
});

test("the range check reads a 0.x range as one minor version", () => {
  assert.equal(caretTakes("^0.4.0", "0.5.0"), false);
  assert.equal(caretTakes("^0.5.0", "0.5.3"), true);
  assert.equal(caretTakes("^0.5.2", "0.5.1"), false);
  assert.equal(caretTakes("^1.2.0", "1.9.0"), true);
  assert.equal(caretTakes("^1.2.0", "2.0.0"), false);
  assert.equal(caretTakes("^0.0.3", "0.0.4"), false);
});
