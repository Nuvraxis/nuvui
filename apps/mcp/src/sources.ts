import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { families } from "../../showcase/src/lib/charts";
import type { Block, Chart, Data, Page, Rule, Section } from "./data";

// The skill is written from the docs by apps/docs/scripts/agent-skill.mjs,
// and `pnpm check:skill` holds it to them. Reading it here, and not the
// docs, keeps one way of turning a docs page into text.
const skillDir = (root: string) => path.join(root, "skills", "nuvui");

const read = (file: string) =>
  readFileSync(file, "utf8").replaceAll("\r\n", "\n");

// What the skill's script puts at the top of each file it writes, and the
// header an agent reads to decide when to load SKILL.md.
const unmarked = (markdown: string) =>
  markdown
    .replace(/^<!--[\s\S]*?-->\n+/, "")
    .replace(/^---\n[\s\S]*?\n---\n+/, "")
    .trim();

// A link in the skill is a path from one file to another. Here there are no
// files, so each becomes what to ask for instead.
function relink(markdown: string, from: string) {
  return markdown.replace(
    /\]\((?!https?:)([^)\s#]+\.md)(#[^)\s]*)?\)/g,
    (link, target: string, anchor = "") => {
      const to = path.posix
        .normalize(path.posix.join(path.posix.dirname(from), target))
        .replace(/\.md$/, "");
      if (to.startsWith("reference/")) {
        return `](page:${to.slice("reference/".length)}${anchor})`;
      }
      if (to.startsWith("rules/"))
        return `](rule:${to.slice("rules/".length)})`;
      if (to === "recipes") return "](page:recipes)";
      if (to === "reference") return "](tool:list_components)";
      if (to === "blocks") return "](tool:list_blocks)";
      if (to === "tokens") return "](tool:get_tokens)";
      if (to === "SKILL") return "](tool:get_rules)";
      return link;
    },
  );
}

// Split at each `##` heading, leaving alone what's inside a code fence,
// where a line can start with the same characters.
export function sectionsOf(markdown: string): Section[] {
  const sections: Section[] = [];
  let fenced = false;
  let current: { heading: string; lines: string[] } | null = null;
  for (const line of markdown.split("\n")) {
    if (/^\s*(```|~~~)/.test(line)) fenced = !fenced;
    if (!fenced && line.startsWith("## ")) {
      if (current) {
        sections.push({
          heading: current.heading,
          markdown: current.lines.join("\n").trim(),
        });
      }
      current = { heading: line.slice(3).trim(), lines: [line] };
    } else {
      current?.lines.push(line);
    }
  }
  if (current) {
    sections.push({
      heading: current.heading,
      markdown: current.lines.join("\n").trim(),
    });
  }
  return sections;
}

function readPages(root: string): Page[] {
  const dir = skillDir(root);
  const pages: Page[] = [];
  let group = "";
  for (const line of read(path.join(dir, "reference.md")).split("\n")) {
    const heading = /^## (.+)$/.exec(line);
    if (heading?.[1]) {
      group = heading[1].trim();
      continue;
    }
    const entry = /^- \[([^\]]+)\]\(reference\/([^)]+)\.md\): (.*)$/.exec(line);
    if (!entry) continue;
    const [, title = "", id = "", description = ""] = entry;
    const file = `reference/${id}.md`;
    const markdown = relink(unmarked(read(path.join(dir, file))), file);
    pages.push({
      id,
      title,
      description,
      group,
      package: group.startsWith("@nuvui/")
        ? (group.split(":")[0] ?? null)
        : null,
      markdown,
      sections: sectionsOf(markdown),
    });
  }

  // Recipes are in the skill beside the reference rather than in it: whole
  // screens built from several components.
  const recipes = relink(
    unmarked(read(path.join(dir, "recipes.md"))),
    "recipes.md",
  );
  pages.push({
    id: "recipes",
    title: "Recipes",
    description:
      "The screens people ask for most, such as a sign-in screen, a form, a table, a dashboard or a chat, and what to build each from.",
    group: "Guides",
    package: null,
    markdown: recipes,
    sections: sectionsOf(recipes),
  });
  return pages;
}

function readRules(root: string): Rule[] {
  const dir = path.join(skillDir(root), "rules");
  return readdirSync(dir)
    .filter((file) => file.endsWith(".md"))
    .sort()
    .map((file) => ({
      topic: file.replace(/\.md$/, ""),
      markdown: relink(unmarked(read(path.join(dir, file))), `rules/${file}`),
    }));
}

interface BlockManifest {
  name: string;
  title: string;
  description: string;
  category: string;
  files: string[];
  install: string[];
}

function readBlocks(root: string): Block[] {
  const dir = path.join(root, "apps", "showcase", "src", "blocks");
  return readdirSync(dir)
    .filter((name) => existsSync(path.join(dir, name, "block.json")))
    .map((name) => {
      const manifest = JSON.parse(
        read(path.join(dir, name, "block.json")),
      ) as BlockManifest;
      return {
        name: manifest.name,
        title: manifest.title,
        description: manifest.description,
        category: manifest.category,
        install: manifest.install,
        files: manifest.files.map((file) => ({
          name: file,
          content: read(path.join(dir, name, file)),
        })),
      };
    })
    .sort(
      (a, b) =>
        a.category.localeCompare(b.category) || a.name.localeCompare(b.name),
    );
}

function readCharts(root: string): Chart[] {
  const dir = path.join(root, "apps", "showcase", "src", "charts");
  return families.flatMap((family) =>
    family.charts.map((chart) => ({
      family: family.slug,
      familyTitle: family.title,
      name: chart.name,
      title: chart.title,
      description: chart.description,
      source: read(path.join(dir, family.slug, `${chart.name}.tsx`)),
    })),
  );
}

function readTokens(root: string): string {
  const markdown = read(path.join(skillDir(root), "tokens.md"));
  const css = /```css\n([\s\S]*?)\n```/.exec(markdown)?.[1];
  if (!css) throw new Error("skills/nuvui/tokens.md has no CSS block");
  return css;
}

/** The server's data, read from the repository at `root`. */
export function readSources(root: string): Data {
  const ui = JSON.parse(
    read(path.join(root, "packages", "ui", "package.json")),
  );
  return {
    version: ui.version,
    overview: relink(
      unmarked(read(path.join(skillDir(root), "SKILL.md"))),
      "SKILL.md",
    ),
    rules: readRules(root),
    pages: readPages(root),
    blocks: readBlocks(root),
    charts: readCharts(root),
    tokens: readTokens(root),
  };
}
