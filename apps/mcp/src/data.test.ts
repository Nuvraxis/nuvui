import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { describe, expect, test } from "vitest";
import { loadSnapshots } from "./data";
import { lineOf, parseVersion } from "./versions";

describe("the docs kept for earlier releases", () => {
  const snapshots = loadSnapshots(new URL("../versions/", import.meta.url));

  test("start at 0.6, when the skill was first written", () => {
    expect(snapshots.lines[0]).toBe("0.6");
  });

  test("each file is the docs of its own line, with what the server needs", () => {
    for (const line of snapshots.lines) {
      const docs = snapshots.load(line);
      const version = parseVersion(docs?.version ?? "");

      expect(version, line).toBeDefined();
      expect(lineOf(version ?? [0, 0, 0]), line).toBe(line);
      expect(docs?.packages["@nuvui/react"], line).toBe(docs?.version);
      expect(docs?.overview.startsWith("# nuvui"), line).toBe(true);
      expect(docs?.pages.length, line).toBeGreaterThan(100);
      expect(docs?.rules.length, line).toBeGreaterThan(0);
      expect(docs?.blocks.length, line).toBeGreaterThan(0);
      expect(docs?.tokens, line).toContain("--color-primary");
      // What's served for the latest release only isn't kept.
      expect(docs, line).not.toHaveProperty("charts");
      expect(docs, line).not.toHaveProperty("changes");
    }
  });

  test("a later release has what an earlier one didn't", () => {
    const has = (line: string, id: string) =>
      snapshots.load(line)?.pages.some((page) => page.id === id);

    expect(has("0.6", "components/compare")).toBe(false);
    expect(has("0.7", "components/compare")).toBe(true);
  });
});

describe("loadSnapshots", () => {
  test("lists the lines by number, reads a file once, and knows nothing of other files", () => {
    const dir = mkdtempSync(path.join(tmpdir(), "nuvui-versions-"));
    try {
      for (const name of ["0.10.json", "0.9.json", "1.0.json", "notes.txt"]) {
        writeFileSync(
          path.join(dir, name),
          JSON.stringify({ version: name.replace(".json", ".0") }),
        );
      }
      const snapshots = loadSnapshots(pathToFileURL(`${dir}${path.sep}`));

      expect(snapshots.lines).toEqual(["0.9", "0.10", "1.0"]);
      expect(snapshots.load("0.10")?.version).toBe("0.10.0");
      expect(snapshots.load("0.10")).toBe(snapshots.load("0.10"));
      expect(snapshots.load("0.8")).toBeUndefined();
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("a folder that isn't there has no lines", () => {
    const snapshots = loadSnapshots(
      pathToFileURL(path.join(tmpdir(), "nuvui-no-such-folder/")),
    );

    expect(snapshots.lines).toEqual([]);
  });
});
