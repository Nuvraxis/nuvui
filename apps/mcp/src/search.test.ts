import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";
import { search, stemOf, termsOf } from "./search";
import { readSources } from "./sources";

const root = fileURLToPath(new URL("../../../", import.meta.url));
const { pages } = readSources(root);

describe("the words of a query", () => {
  test("are lowercase, each once, without the words that say nothing", () => {
    expect(termsOf("How do I sort a Table, a TABLE?")).toEqual([
      "sort",
      "table",
    ]);
    expect(termsOf("data-table")).toEqual(["data-table"]);
    expect(termsOf("a an the")).toEqual([]);
  });

  test("lose an ending only when enough is left to mean something", () => {
    expect(stemOf("sortable")).toBe("sort");
    expect(stemOf("sorting")).toBe("sort");
    expect(stemOf("dialogs")).toBe("dialog");
    expect(stemOf("table")).toBe("table");
    expect(stemOf("css")).toBe("css");
  });
});

describe("search", () => {
  test("finds the page that's about the question first", () => {
    expect(search(pages, "sortable table", 3)[0]?.page).toBe("table/sorting");
    expect(search(pages, "dark mode", 3)[0]?.page).toBe("index");
    expect(search(pages, "error message on a field", 3)[0]?.page).toBe(
      "components/field",
    );
    expect(search(pages, "before and after image", 3)[0]?.page).toBe(
      "components/compare",
    );
  });

  test("matches whole words from their start, so table isn't found in sortable", () => {
    const hits = search(pages, "table", 20);

    expect(hits.length).toBe(20);
    expect(hits.every((hit) => hit.page !== "kanban/index")).toBe(true);
  });

  test("names the page and the section, for get_page", () => {
    const [hit] = search(pages, "dark mode", 1);

    expect(hit).toEqual({
      page: "index",
      title: "Getting started",
      section: "Dark mode",
      snippet: expect.any(String),
    });
  });

  test("a snippet is one line of text, without the marks of headings and tables", () => {
    for (const hit of search(pages, "keyboard", 20)) {
      expect(hit.snippet, hit.page).not.toMatch(/\n|(^|\s)#{2,6}\s|\|\s*---/);
      expect(hit.snippet.length, hit.page).toBeLessThanOrEqual(242);
    }
  });

  test("gives no more than the limit, and nothing for nothing", () => {
    expect(search(pages, "button", 2)).toHaveLength(2);
    expect(search(pages, "the and of", 5)).toEqual([]);
    expect(search(pages, "zzzzqqqq", 5)).toEqual([]);
  });
});
