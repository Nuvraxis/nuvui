import { readFileSync } from "node:fs";
import type { Page } from "../../mcp/src/data.ts";
import { search } from "../../mcp/src/search.ts";

export type { Page };

/** A page an answer was written from, to link to under it. */
export interface Source {
  title: string;
  url: string;
}

/** The pages the build wrote next to the server, as the MCP server has them. */
export interface Pages {
  /** `@nuvui/react`'s version when the docs were read. */
  version: string;
  pages: Page[];
}

export function loadPages(
  file: URL = new URL("./pages.json", import.meta.url),
): Pages {
  return JSON.parse(readFileSync(file, "utf8")) as Pages;
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

export interface ContextOptions {
  /** The most pages an answer is written from. */
  maxPages?: number;
  /** The most characters of the docs sent with a question. */
  maxChars?: number;
}

/**
 * The parts of the docs that best answer `question`, as text for the
 * model, and the pages they're from. The sections the search found are
 * sent, in the order the page has them, and not whole pages: a component's
 * page can be 30,000 characters, most of it about something else.
 */
export function contextFor(
  pages: readonly Page[],
  question: string,
  { maxPages = 3, maxChars = 24_000 }: ContextOptions = {},
): { sources: Source[]; text: string } {
  const hits = search(pages, question, 12);
  const chosen: { page: Page; headings: Set<string> }[] = [];
  for (const hit of hits) {
    let entry = chosen.find((item) => item.page.id === hit.page);
    if (!entry) {
      if (chosen.length >= maxPages) continue;
      const page = pages.find((item) => item.id === hit.page);
      if (!page) continue;
      entry = { page, headings: new Set() };
      chosen.push(entry);
    }
    entry.headings.add(hit.section);
  }

  const sources: Source[] = [];
  let text = "";
  for (const { page, headings } of chosen) {
    const url = urlOf(page.id);
    const sections = page.sections
      .filter((section) => headings.has(section.heading))
      .map((section) => section.markdown.trim());
    const part = [
      `<page title="${page.title.replace(/"/g, "'")}" url="${url}">`,
      page.description,
      ...sections,
      "</page>",
    ].join("\n\n");
    // A page that would go over is left out whole, and so are the ones
    // after it: half a section can say the opposite of the whole one.
    if (text.length + part.length > maxChars) break;
    text += `${part}\n\n`;
    sources.push({ title: page.title, url });
  }
  return { sources, text: text.trim() };
}
