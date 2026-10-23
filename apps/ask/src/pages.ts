import { readFileSync } from "node:fs";
import type { Data, Page } from "../../mcp/src/data.ts";

export type { Data, Page };

/** A page an answer was written from, to link to under it. */
export interface Source {
  title: string;
  url: string;
}

/**
 * The data the build wrote next to the server: what the MCP server answers
 * from, with the pages about using nuvui with agents added.
 */
export function loadData(
  file: URL = new URL("./data.json", import.meta.url),
): Data {
  return JSON.parse(readFileSync(file, "utf8")) as Data;
}

const site = "https://nuvui.nuvraxis.com";

/**
 * A page's address on the site. A page's id is its path under the docs,
 * and a folder's own page is its index: `kanban/index` is `/docs/kanban`.
 */
export function urlOf(id: string) {
  const path = id === "index" ? "" : `/${id.replace(/\/index$/, "")}`;
  return `${site}/docs${path}`;
}
