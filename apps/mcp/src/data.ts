import { readFileSync } from "node:fs";

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

/** Everything the server answers from, written once when it's built. */
export interface Data {
  /** `@nuvui/react`'s version when the data was written. */
  version: string;
  /** The skill's `SKILL.md`: what to know before using the library. */
  overview: string;
  rules: Rule[];
  pages: Page[];
  blocks: Block[];
  charts: Chart[];
  /** Every design token, as `tokens.css` has them. */
  tokens: string;
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
