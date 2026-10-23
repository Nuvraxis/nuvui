import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { contextFor, type Page, urlOf } from "./pages.ts";

const page = (
  id: string,
  title: string,
  sections: [heading: string, text: string][],
): Page => ({
  id,
  title,
  description: `${title}, described.`,
  group: "Components",
  package: "@nuvui/react",
  markdown: sections
    .map(([heading, text]) => `## ${heading}\n\n${text}`)
    .join("\n\n"),
  sections: sections.map(([heading, text]) => ({
    heading,
    markdown: `## ${heading}\n\n${text}`,
  })),
});

const pages = [
  page("components/button", "Button", [
    ["Variants", "A button comes in solid, outline and ghost variants."],
    ["Sizes", "Small, medium and large."],
  ]),
  page("components/dialog", "Dialog", [
    ["Opening", "A dialog opens from a trigger button."],
    ["Closing", "Escape closes it."],
  ]),
  page("kanban/index", "Kanban", [
    ["Columns", "A board has columns of cards."],
  ]),
];

describe("urlOf", () => {
  test("a page is at its path under /docs, and a folder's index at the folder", () => {
    assert.equal(urlOf("index"), "https://nuvui.nuvraxis.com/docs");
    assert.equal(
      urlOf("components/button"),
      "https://nuvui.nuvraxis.com/docs/components/button",
    );
    assert.equal(
      urlOf("kanban/index"),
      "https://nuvui.nuvraxis.com/docs/kanban",
    );
  });
});

describe("contextFor", () => {
  test("sends the sections that match, with each page's address, and lists the pages", () => {
    // Not "button": a word in a page's title matches every section of it.
    const { sources, text } = contextFor(pages, "ghost variants");
    assert.deepEqual(sources[0], {
      title: "Button",
      url: "https://nuvui.nuvraxis.com/docs/components/button",
    });
    assert.match(
      text,
      /<page title="Button" url="https:\/\/nuvui\.nuvraxis\.com\/docs\/components\/button">/,
    );
    assert.match(text, /solid, outline and ghost/);
    // A section that didn't match isn't sent.
    assert.doesNotMatch(text, /Small, medium and large/);
  });

  test("finds nothing for a question about nothing in the docs", () => {
    assert.deepEqual(contextFor(pages, "quantum espresso"), {
      sources: [],
      text: "",
    });
  });

  test("keeps to the most pages it's given", () => {
    const { sources } = contextFor(pages, "button dialog columns", {
      maxPages: 2,
    });
    assert.equal(sources.length, 2);
  });

  test("leaves out a page that would go over the characters it's given, whole", () => {
    const { sources, text } = contextFor(pages, "button variants", {
      maxChars: 20,
    });
    assert.deepEqual(sources, []);
    assert.equal(text, "");
  });

  test("a quote in a title doesn't end the tag", () => {
    const quoted = [
      page("guide", 'The "best" guide', [["Tips", "button tips"]]),
    ];
    assert.match(contextFor(quoted, "button").text, /title="The 'best' guide"/);
  });
});
