import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";
import { families } from "../../showcase/src/lib/charts";
import { registryUrl, site } from "./data";
import { readSources, sectionsOf } from "./sources";

const root = fileURLToPath(new URL("../../../", import.meta.url));
const data = readSources(root);
const everything = [
  data.overview,
  ...data.rules.map((rule) => rule.markdown),
  ...data.pages.map((page) => page.markdown),
].join("\n");

describe("the pages", () => {
  test("every page the skill lists is here, under its heading", () => {
    const listed = [
      ...readFileSync(
        path.join(root, "skills/nuvui/reference.md"),
        "utf8",
      ).matchAll(/\]\(reference\/([^)]+)\.md\)/g),
    ].map((match) => match[1]);

    expect(listed.length).toBeGreaterThan(100);
    expect(data.pages.map((page) => page.id)).toEqual([...listed, "recipes"]);
    for (const page of data.pages) {
      expect(page.title, page.id).not.toBe("");
      expect(page.description, page.id).not.toBe("");
      expect(page.sections.length, page.id).toBeGreaterThan(0);
    }
  });

  test("a component's page belongs to its package, and a guide to none", () => {
    const byId = (id: string) => data.pages.find((page) => page.id === id);

    expect(byId("components/compare")?.package).toBe("@nuvui/react");
    expect(byId("table/data-table")?.package).toBe("@nuvui/table");
    expect(byId("theming")?.package).toBeNull();
    expect(byId("recipes")?.package).toBeNull();
  });

  test("no page keeps the mark the skill's script writes at its top", () => {
    for (const page of data.pages) {
      expect(page.markdown.startsWith("<!--"), page.id).toBe(false);
    }
    expect(data.overview.startsWith("---")).toBe(false);
    expect(data.overview.startsWith("# nuvui")).toBe(true);
  });

  test("every link between files names a page, a rule or a tool, and each is there", () => {
    const ids = new Set(data.pages.map((page) => page.id));
    const topics = new Set(data.rules.map((rule) => rule.topic));
    const tools = new Set([
      "get_rules",
      "list_components",
      "list_blocks",
      "get_tokens",
    ]);

    expect(everything).not.toMatch(/\]\((?!https?:)[^)\s]*\.md[)#]/);
    const pages = [...everything.matchAll(/\]\(page:([^)#\s]+)/g)].map(
      (m) => m[1],
    );
    expect(pages.length).toBeGreaterThan(100);
    expect(pages.filter((id) => !ids.has(id ?? ""))).toEqual([]);
    const rules = [...everything.matchAll(/\]\(rule:([^)\s]+)\)/g)].map(
      (m) => m[1],
    );
    expect(rules.filter((topic) => !topics.has(topic ?? ""))).toEqual([]);
    const named = [...everything.matchAll(/\]\(tool:([^)\s]+)\)/g)].map(
      (m) => m[1],
    );
    expect(named.filter((tool) => !tools.has(tool ?? ""))).toEqual([]);
  });
});

describe("sections", () => {
  test("a page is cut at each ## heading, with the ### headings under it", () => {
    const sections = sectionsOf(
      "# Title\n\nIntro\n\n## One\n\nText\n\n### Inner\n\nMore\n\n## Two\n\nLast",
    );

    expect(sections.map((section) => section.heading)).toEqual(["One", "Two"]);
    expect(sections[0]?.markdown).toBe("## One\n\nText\n\n### Inner\n\nMore");
  });

  test("a line inside a code fence is never a heading", () => {
    const sections = sectionsOf(
      "## Real\n\n```md\n## Not a heading\n```\n\n~~~\n## Nor this\n~~~",
    );

    expect(sections.map((section) => section.heading)).toEqual(["Real"]);
  });
});

describe("the rest", () => {
  test("the rules are the skill's rule files, one each", () => {
    const files = readdirSync(path.join(root, "skills/nuvui/rules")).filter(
      (file) => file.endsWith(".md"),
    );

    expect(data.rules.map((rule) => `${rule.topic}.md`)).toEqual(files.sort());
    expect(
      data.rules.find((rule) => rule.topic === "styling")?.markdown,
    ).toMatch(/^# Styling/);
  });

  test("every block is here with its files, as the website has them", () => {
    const folders = readdirSync(path.join(root, "apps/showcase/src/blocks"));

    expect(data.blocks.map((block) => block.name).sort()).toEqual(
      folders.sort(),
    );
    for (const block of data.blocks) {
      expect(block.files.length, block.name).toBeGreaterThan(0);
      for (const file of block.files) {
        expect(file.content, `${block.name}/${file.name}`).toBe(
          readFileSync(
            path.join(root, "apps/showcase/src/blocks", block.name, file.name),
            "utf8",
          ).replaceAll("\r\n", "\n"),
        );
      }
    }
  });

  test("the address the blocks are added from is the one the skill gives", () => {
    const blocks = readFileSync(
      path.join(root, "skills/nuvui/blocks.md"),
      "utf8",
    );

    expect(blocks).toContain(`${site}/r/<name>.json`);
    expect(registryUrl("sign-in")).toBe(`${site}/r/sign-in.json`);
  });

  test("every chart on the charts pages is here, with its file", () => {
    const listed = families.flatMap((family) =>
      family.charts.map((chart) => `${family.slug}/${chart.name}`),
    );

    expect(data.charts.map((chart) => `${chart.family}/${chart.name}`)).toEqual(
      listed,
    );
    for (const chart of data.charts) {
      expect(chart.source, chart.name).toContain("@nuvui/charts");
    }
  });

  test("the tokens are the CSS the skill has, and the version is the core's", () => {
    const ui = JSON.parse(
      readFileSync(path.join(root, "packages/ui/package.json"), "utf8"),
    );

    expect(data.tokens).toContain("--color-primary:");
    expect(data.tokens).not.toContain("```");
    expect(data.version).toBe(ui.version);
  });
});
