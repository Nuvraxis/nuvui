/** A version as its three numbers. */
export type Version = [major: number, minor: number, patch: number];

/**
 * A version as a project's package.json writes it: `0.6.2`, `^0.6.2`,
 * `~0.6.0`, `>=0.6`, `0.6` or `0.6.x`. A range is read as the version it
 * starts from, which is the least the project can have.
 */
export function parseVersion(text: string): Version | undefined {
  const match =
    /^\s*(?:\^|~|>=|=)?\s*v?(\d+)(?:\.(\d+|x|\*))?(?:\.(\d+|x|\*))?(?:-[0-9A-Za-z.-]+)?\s*$/.exec(
      text,
    );
  if (!match) return undefined;
  const number = (part: string | undefined) =>
    part === undefined || part === "x" || part === "*" ? 0 : Number(part);
  return [number(match[1]), number(match[2]), number(match[3])];
}

export function compareVersions(a: Version, b: Version) {
  return a[0] - b[0] || a[1] - b[1] || a[2] - b[2];
}

export const formatVersion = (version: Version) => version.join(".");

/**
 * The release line a version belongs to, such as `0.6`. The docs are kept
 * for each line: before 1.0 a minor release can change any prop, and after
 * it a minor still adds what an older one doesn't have.
 */
export const lineOf = (version: Version) => `${version[0]}.${version[1]}`;

/** What one release of a package changed, from its CHANGELOG.md. */
export interface Change {
  package: string;
  version: string;
  markdown: string;
}

/** A change that's merged, and in the docs, but in no release yet. */
export interface Pending {
  package: string;
  bump: "major" | "minor" | "patch";
  markdown: string;
}

// What @changesets/changelog-github puts before each change: its pull
// request, its commit and who wrote it. An agent needs none of it, and the
// default changelog's `abc1234: ` prefix is taken off too.
const credit =
  /^- (?:\[#\d+\]\([^)]*\) )?(?:\[`[0-9a-f]{7,}`\]\([^)]*\) )?(?:Thanks \[@[^\]]+\]\([^)]*\)! )?- |^- [0-9a-f]{7,}: /;

function cleanChange(body: string) {
  const kept: string[] = [];
  let skipping = false;
  for (const raw of body.split("\n")) {
    const line = raw.trimEnd();
    // A release of an add-on that only took a new @nuvui/react says so
    // with a list of commits, which says nothing about what changed.
    if (line.startsWith("- Updated dependencies")) {
      skipping = true;
      continue;
    }
    if (skipping && (line.startsWith(" ") || line === "")) continue;
    skipping = false;
    kept.push(line.replace(credit, "- "));
  }
  // Headings such as `### Patch Changes` with nothing left under them.
  const lines = kept.filter(
    (line, index) =>
      !line.startsWith("### ") ||
      kept
        .slice(index + 1)
        .find((next) => next !== "")
        ?.startsWith("- ") === true,
  );
  return lines
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Each release in a package's CHANGELOG.md, newest first, as it's written. */
export function changesOf(pkg: string, changelog: string): Change[] {
  const changes: Change[] = [];
  const parts = changelog.replaceAll("\r\n", "\n").split(/^## /m).slice(1);
  for (const part of parts) {
    const newline = part.indexOf("\n");
    const version = (newline === -1 ? part : part.slice(0, newline)).trim();
    if (!parseVersion(version)) continue;
    const markdown = cleanChange(newline === -1 ? "" : part.slice(newline));
    changes.push({
      package: pkg,
      version,
      markdown: markdown || "Only the packages it depends on changed.",
    });
  }
  return changes;
}

/** The packages a changeset file names, with how each moves, and its text. */
export function pendingOf(changeset: string): Pending[] {
  const match = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/.exec(
    changeset.replaceAll("\r\n", "\n"),
  );
  if (!match) return [];
  const markdown = (match[2] ?? "").trim();
  return [
    ...(match[1] ?? "").matchAll(
      /^["']?(@nuvui\/[a-z0-9-]+)["']?:\s*(major|minor|patch)\s*$/gm,
    ),
  ].map(([, pkg = "", bump]) => ({
    package: pkg,
    bump: bump as Pending["bump"],
    markdown,
  }));
}
