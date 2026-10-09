import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { getTableOfContents } from "fumadocs-core/content/toc";
import type { TOCItemType } from "fumadocs-core/toc";
import { cache } from "react";
import { addons, library } from "@/lib/library";
import { site } from "@/lib/site";

// Both sources are outside this app: the package's CHANGELOG.md and the
// .changeset folder at the root of the repository. turbo.json in this folder
// lists the second one as a build input, or a new changeset wouldn't be
// enough to make Turborepo rebuild the site.

export const bumps = ["major", "minor", "patch"] as const;
export type Bump = (typeof bumps)[number];

export const bumpHeadings: Record<Bump, string> = {
  major: "Major Changes",
  minor: "Minor Changes",
  patch: "Patch Changes",
};

export const unreleased = {
  id: "not-released-yet",
  heading: "Not released yet",
};

export interface PendingNote {
  file: string;
  bump: Bump;
  body: string;
}

async function readReleased(): Promise<string | undefined> {
  let text: string;
  try {
    text = await readFile(library.changelog, "utf8");
  } catch (error) {
    // No file means no release yet. Anything else is a real problem.
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return undefined;
    throw error;
  }

  // Changesets opens the file with the package name as a title. The page
  // already has its h1.
  const body = text.replace(/^#\s[^\n]*\n/, "").trim();
  return /^##\s/m.test(body) ? body : undefined;
}

async function readPending(): Promise<PendingNote[]> {
  const files = (await readdir(library.changesets))
    .filter((name) => name.endsWith(".md") && name !== "README.md")
    .sort();

  // A changeset names each package it's for, with a bump for each. A note
  // goes under the biggest bump it has for a package that's published.
  const published = [
    site.packageName,
    ...Object.values(addons).map((addon) => addon.name),
  ];
  const packageLine = new RegExp(
    `^["']?(${published.join("|")})["']?:\\s*(${bumps.join("|")})\\s*$`,
    "gm",
  );

  const notes = await Promise.all(
    files.map(async (file) => {
      const text = (
        await readFile(path.join(library.changesets, file), "utf8")
      ).replace(/\r\n/g, "\n");
      const [, header = "", body = ""] =
        /^---\n([\s\S]*?)\n---\n([\s\S]*)$/.exec(text) ?? [];
      const lines = [...header.matchAll(packageLine)];
      const bump = bumps.find((name) => lines.some((line) => line[2] === name));
      if (!bump || !body.trim()) return [];

      // A note for an add-on says which one. The page is the core's.
      const others = lines
        .map((line) => line[1])
        .filter((name) => name !== site.packageName);
      const prefix =
        others.length > 0
          ? `${others.map((name) => `\`${name}\``).join(", ")}: `
          : "";
      return { file, bump, body: prefix + body.trim() };
    }),
  );
  return notes.flat();
}

export const readChangelog = cache(async () => {
  const [released, pending] = await Promise.all([
    readReleased(),
    readPending(),
  ]);
  return { released, pending };
});

// The page's headings are rendered by a component, where Fumadocs can't see
// them, so the entries for its table of contents are put together here.
export async function changelogToc(): Promise<TOCItemType[]> {
  const { released, pending } = await readChangelog();
  const items: TOCItemType[] = [];

  if (pending.length > 0) {
    items.push({
      title: unreleased.heading,
      url: `#${unreleased.id}`,
      depth: 2,
    });
  }
  if (released) {
    // Versions only. Every one of them has a "Minor Changes" under it.
    items.push(
      ...getTableOfContents(released).filter((item) => item.depth === 2),
    );
  }
  return items;
}
