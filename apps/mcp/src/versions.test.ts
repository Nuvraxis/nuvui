import { describe, expect, test } from "vitest";
import {
  changesOf,
  compareVersions,
  lineOf,
  parseVersion,
  pendingOf,
  type Version,
} from "./versions";

describe("parseVersion", () => {
  test("reads a version as a package.json writes it, a range as where it starts", () => {
    expect(parseVersion("0.6.2")).toEqual([0, 6, 2]);
    expect(parseVersion("^0.6.2")).toEqual([0, 6, 2]);
    expect(parseVersion("~0.6.0")).toEqual([0, 6, 0]);
    expect(parseVersion(">=0.6")).toEqual([0, 6, 0]);
    expect(parseVersion("0.6")).toEqual([0, 6, 0]);
    expect(parseVersion("0.6.x")).toEqual([0, 6, 0]);
    expect(parseVersion("v1")).toEqual([1, 0, 0]);
    expect(parseVersion("1.0.0-beta.2")).toEqual([1, 0, 0]);
  });

  test("isn't fooled by what isn't a version", () => {
    for (const text of ["latest", "workspace:*", "", "1.2.3.4", "^"]) {
      expect(parseVersion(text), text).toBeUndefined();
    }
  });

  test("compares by major, then minor, then patch, and a line is the first two", () => {
    const sorted = ["0.10.0", "0.6.2", "1.0.0", "0.6.10"]
      .map((v): Version => parseVersion(v) ?? [0, 0, 0])
      .sort(compareVersions)
      .map((v) => v.join("."));

    expect(sorted).toEqual(["0.6.2", "0.6.10", "0.10.0", "1.0.0"]);
    expect(lineOf([0, 6, 2])).toBe("0.6");
  });
});

describe("changesOf", () => {
  const changelog = [
    "# @nuvui/table",
    "",
    "## 0.2.0",
    "",
    "### Minor Changes",
    "",
    "- [#72](https://github.com/Nuvraxis/nuvui/pull/72) [`edff9a4`](https://github.com/Nuvraxis/nuvui/commit/edff9a4b8620d36176a4875fad6e00e6b53c121d) Thanks [@someone](https://github.com/someone)! - Rows can be pinned.",
    "  ",
    "  - With `pinned`, a row stays at the top.",
    "",
    "### Patch Changes",
    "",
    "- Updated dependencies [[`edff9a4`](https://github.com/Nuvraxis/nuvui/commit/edff9a4b8620d36176a4875fad6e00e6b53c121d)]:",
    "  - @nuvui/react@0.7.0",
    "",
    "## 0.1.1",
    "",
    "### Patch Changes",
    "",
    "- Updated dependencies [[`15bf3c3`](https://github.com/Nuvraxis/nuvui/commit/15bf3c3)]:",
    "  - @nuvui/react@0.6.0",
    "",
    "## 0.1.0",
    "",
    "### Minor Changes",
    "",
    "- 1a2b3c4: The first release.",
  ].join("\n");

  test("has each release, newest first, without who and which commit", () => {
    const changes = changesOf("@nuvui/table", changelog);

    expect(changes.map((c) => c.version)).toEqual(["0.2.0", "0.1.1", "0.1.0"]);
    expect(changes[0]?.package).toBe("@nuvui/table");
    expect(changes[0]?.markdown).toBe(
      "### Minor Changes\n\n- Rows can be pinned.\n\n  - With `pinned`, a row stays at the top.",
    );
    expect(changes[2]?.markdown).toBe(
      "### Minor Changes\n\n- The first release.",
    );
  });

  test("a release that only took new dependencies says so in words", () => {
    expect(changesOf("@nuvui/table", changelog)[1]?.markdown).toBe(
      "Only the packages it depends on changed.",
    );
  });

  test("reads the changelogs in the repository as they're written", async () => {
    const { readFileSync } = await import("node:fs");
    const ui = readFileSync(
      new URL("../../../packages/ui/CHANGELOG.md", import.meta.url),
      "utf8",
    );
    const changes = changesOf("@nuvui/react", ui);

    expect(changes.length).toBeGreaterThan(5);
    for (const change of changes) {
      expect(parseVersion(change.version), change.version).toBeDefined();
      expect(change.markdown, change.version).not.toContain("Thanks [@");
      expect(change.markdown, change.version).not.toMatch(/^- \[#\d+\]/m);
    }
  });
});

describe("pendingOf", () => {
  test("has each package a changeset names, with how it moves and the text", () => {
    const pending = pendingOf(
      "---\n\"@nuvui/media\": minor\n'@nuvui/react': patch\n---\n\nA new package.\r\n",
    );

    expect(pending).toEqual([
      { package: "@nuvui/media", bump: "minor", markdown: "A new package." },
      { package: "@nuvui/react", bump: "patch", markdown: "A new package." },
    ]);
  });

  test("a file that isn't a changeset has nothing", () => {
    expect(pendingOf("# Changesets\n\nHow to write one.")).toEqual([]);
  });
});
