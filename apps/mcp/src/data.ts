import { existsSync, readdirSync, readFileSync } from "node:fs";
import type { Change, Pending } from "./versions";

/** One `##` part of a page, with the `###` parts under it. */
export interface Section {
  heading: string;
  markdown: string;
}

/** A page of the reference, as the skill has it. */
export interface Page {
  /** Its path under the skill's `reference/`, without `.md`. */
  id: string;
  title: string;
  description: string;
  /** The heading it's listed under in the skill's `reference.md`. */
  group: string;
  /** The package it belongs to, or none for a guide. */
  package: string | null;
  markdown: string;
  sections: Section[];
}

export interface BlockFile {
  name: string;
  content: string;
}

export interface Block {
  name: string;
  title: string;
  description: string;
  category: string;
  /** The packages its files import from. */
  install: string[];
  files: BlockFile[];
}

export interface Chart {
  /** The family's folder, such as `bar`. */
  family: string;
  /** The family's heading, such as `Bar charts`. */
  familyTitle: string;
  name: string;
  title: string;
  description: string;
  source: string;
}

export interface Rule {
  /** The file's name under the skill's `rules/`, without `.md`. */
  topic: string;
  markdown: string;
}

/**
 * The docs as they were at one release, or as they are now. The server
 * keeps one of these for each release line it can answer for exactly.
 */
export interface Docs {
  /** `@nuvui/react`'s version when the docs were written. */
  version: string;
  /** Every published `@nuvui/*` package, and its version at the time. */
  packages: Record<string, string>;
  /** The skill's `SKILL.md`: what to know before using the library. */
  overview: string;
  rules: Rule[];
  pages: Page[];
  blocks: Block[];
  /** Every design token, as `tokens.css` has them. */
  tokens: string;
}

/** Everything the server answers from, written once when it's built. */
export interface Data extends Docs {
  charts: Chart[];
  /** Every release of every package, from their changelogs. */
  changes: Change[];
  /** What's merged, and in these docs, but in no release yet. */
  pending: Pending[];
}

export const site = "https://nuvui.nuvraxis.com";

/** Where a block's registry item is, for shadcn's command line tool. */
export const registryUrl = (block: string) => `${site}/r/${block}.json`;

/** The data the build wrote next to the server. */
export function loadData(
  file: URL = new URL("./data.json", import.meta.url),
): Data {
  return JSON.parse(readFileSync(file, "utf8")) as Data;
}

/** The docs kept for earlier releases, one file for each line. */
export interface Snapshots {
  /** The release lines there are docs for, such as `0.6`, oldest first. */
  lines: string[];
  load: (line: string) => Docs | undefined;
}

/**
 * The docs in `folder`, written by `pnpm --filter @nuvui/mcp snapshot` as
 * `<line>.json`. Each is read the first time it's asked for and kept.
 */
export function loadSnapshots(
  folder: URL = new URL("../versions/", import.meta.url),
): Snapshots {
  const lines = existsSync(folder)
    ? readdirSync(folder)
        .filter((file) => /^\d+\.\d+\.json$/.test(file))
        .map((file) => file.replace(/\.json$/, ""))
        .sort((a, b) => {
          const [am = 0, an = 0] = a.split(".").map(Number);
          const [bm = 0, bn = 0] = b.split(".").map(Number);
          return am - bm || an - bn;
        })
    : [];
  const loaded = new Map<string, Docs>();
  return {
    lines,
    load: (line) => {
      if (!lines.includes(line)) return undefined;
      let docs = loaded.get(line);
      if (!docs) {
        docs = JSON.parse(
          readFileSync(new URL(`${line}.json`, folder), "utf8"),
        ) as Docs;
        loaded.set(line, docs);
      }
      return docs;
    },
  };
}
