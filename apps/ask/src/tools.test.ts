import assert from "node:assert/strict";
import { describe, test } from "node:test";
import type { Data, Page } from "./pages.ts";
import { createToolbox } from "./tools.ts";

const page = (id: string, title: string, text: string): Page => ({
  id,
  title,
  description: `${title}, described.`,
  group: "Components",
  package: "@nuvui/react",
  markdown: `# ${title}\n\n## About\n\n${text}`,
  sections: [{ heading: "About", markdown: `## About\n\n${text}` }],
});

const data: Data = {
  version: "0.6.0",
  packages: { "@nuvui/react": "0.6.0" },
  overview: "What to know first.",
  rules: [{ topic: "styling", markdown: "Style with tokens." }],
  pages: [
    page("components/button", "Button", "Solid, outline and ghost variants."),
    page("components/dialog", "Dialog", "A dialog opens from a trigger."),
  ],
  blocks: [],
  tokens: ":root {\n  --color-primary: blue;\n}",
  charts: [],
  changes: [],
  pending: [],
};

describe("the toolbox", () => {
  const toolbox = createToolbox(data);

  test("offers the MCP server's tools, without the version a visitor doesn't have", () => {
    const names = toolbox.specs.map((spec) => spec.function.name);
    assert.ok(names.includes("search_docs"));
    assert.ok(names.includes("get_page"));
    for (const spec of toolbox.specs) {
      const { parameters } = spec.function;
      assert.equal(parameters.type, "object");
      assert.equal(parameters.$schema, undefined);
      assert.ok(
        !("version" in (parameters.properties as object)),
        spec.function.name,
      );
    }
    const search = toolbox.specs.find((s) => s.function.name === "search_docs");
    // A default leaves an argument out of what has to be given.
    assert.deepEqual(search?.function.parameters.required, ["query"]);
  });

  test("runs a tool, and names the page it read for the links", () => {
    const result = toolbox.run("get_page", '{"page":"Button"}');
    assert.equal(result.outcome, "ok");
    assert.match(result.text, /Solid, outline and ghost/);
    assert.deepEqual(result.source, {
      title: "Button",
      url: "https://nuvui.nuvraxis.com/docs/components/button",
    });

    const found = toolbox.run("search_docs", '{"query":"dialog trigger"}');
    assert.equal(found.outcome, "ok");
    assert.match(found.text, /get_page `components\/dialog`/);
    assert.equal(found.source, undefined);
  });

  test("tells the model what was wrong, for it to try again", () => {
    assert.equal(
      toolbox.run("get_page", '{"page":"carousel"}').outcome,
      "not_found",
    );
    assert.equal(toolbox.run("get_page", "{}").outcome, "invalid");
    assert.equal(toolbox.run("get_page", "not json").outcome, "invalid");
    assert.equal(toolbox.run("delete_everything", "{}").outcome, "invalid");
  });

  test("leaves out the end of a result that's too long", () => {
    const long = createToolbox({
      ...data,
      pages: [page("components/table", "Table", "word ".repeat(10_000))],
    });
    const { text } = long.run("get_page", '{"page":"table"}');
    assert.ok(text.length < 17_000);
    assert.match(text, /The rest is left out/);
  });

  test("says what it's doing, for the panel", () => {
    assert.equal(
      toolbox.describe("search_docs", '{"query":"dark mode"}'),
      'Searching the docs for "dark mode"',
    );
    assert.equal(
      toolbox.describe("get_page", '{"page":"components/dialog"}'),
      "Reading Dialog",
    );
    assert.equal(toolbox.describe("get_page", "not json"), "Reading a page");
  });
});
