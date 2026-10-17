// Writes the docs as plain Markdown, for the agents people build with:
//
//   skills/nuvui/reference/   a file for each docs page, in the skill
//   skills/nuvui/reference.md the list of them
//   skills/nuvui/blocks.md    the website's blocks, and how to add one
//   skills/nuvui/tokens.md    the design tokens, as the library ships them
//   NuvUIAIAgent.md           the skill's first page, at the root
//   apps/showcase/public/llms.txt       the list, at the site's root
//   apps/docs/public/llms.txt, llms-full.txt and llms/  the same for the
//                             site, written when the docs are built
//
// The pages are the ones the docs site shows, and what the site reads out
// of the code, this reads too: props from the types, CSS variables and
// classes from the built stylesheets, examples from their files. So none
// of it is written twice, and none of it can fall behind.
//
//   node scripts/agent-skill.mjs          write what's kept in git
//   node scripts/agent-skill.mjs --check  fail if that's out of date
//   node scripts/agent-skill.mjs --site   write the site's files only
//
// It needs the packages built, for their stylesheets.
import { existsSync } from "node:fs";
import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { createGenerator } from "fumadocs-typescript";
import { writeOutLiterals } from "../lib/literal-union.ts";

const docsDir = path.join(import.meta.dirname, "..");
const repoDir = path.join(docsDir, "..", "..");
const contentDir = path.join(docsDir, "content", "docs");
const examplesDir = path.join(docsDir, "examples");
const skillDir = path.join(repoDir, "skills", "nuvui");
const blocksDir = path.join(repoDir, "apps", "showcase", "src", "blocks");

const siteUrl = "https://nuvui.nuvraxis.com";
const repoUrl = "https://github.com/Nuvraxis/nuvui";

// The same packages, by the same names, as lib/library.ts.
const core = "ui";
const addons = [
  "date-picker",
  "table",
  "charts",
  "barcodes",
  "chat",
  "kanban",
  "editor",
  "emoji",
  "map",
  "flow",
  "icons",
];
const packageDir = (addon) => path.join(repoDir, "packages", addon ?? core);
const packageName = (addon) => (addon ? `@nuvui/${addon}` : "@nuvui/react");

const read = (file) => readFile(file, "utf8");
const unix = (text) => text.replace(/\r\n/g, "\n");

// ---------------------------------------------------------------------
// The pages, in the order the site's menu has them.

function frontmatter(source) {
  const match = /^---\n([\s\S]*?)\n---\n?/.exec(source);
  if (!match) return { data: {}, body: source };
  const data = {};
  for (const line of match[1].split("\n")) {
    const at = line.indexOf(":");
    if (at === -1) continue;
    const value = line.slice(at + 1).trim();
    data[line.slice(0, at).trim()] = /^(["']).*\1$/.test(value)
      ? value.slice(1, -1)
      : value;
  }
  return { data, body: source.slice(match[0].length) };
}

async function pagesIn(dir, prefix) {
  const meta = JSON.parse(await read(path.join(dir, "meta.json")));
  const pages = [];
  for (const name of meta.pages) {
    const file = path.join(dir, `${name}.mdx`);
    if (existsSync(file)) {
      const { data, body } = frontmatter(unix(await read(file)));
      pages.push({
        slug: `${prefix}${name}`,
        section: prefix ? prefix.slice(0, -1) : "",
        title: data.title,
        description: data.description,
        body,
      });
    } else {
      pages.push(...(await pagesIn(path.join(dir, name), `${prefix}${name}/`)));
    }
  }
  return pages;
}

// A page's address on the site: /docs/map for map/index.
const urlOf = (slug) => {
  const at = slug === "index" ? "" : slug.replace(/\/index$/, "");
  return `${siteUrl}/docs${at ? `/${at}` : ""}`;
};

// ---------------------------------------------------------------------
// What the site's own components read, read the same way.

const generators = new Map();
function generatorFor(addon) {
  const tsconfigPath = path.join(packageDir(addon), "tsconfig.json");
  let generator = generators.get(tsconfigPath);
  if (!generator) {
    generator = createGenerator({ tsconfigPath });
    generators.set(tsconfigPath, generator);
  }
  return generator;
}

const cell = (text) =>
  String(text ?? "")
    .replace(/\s*\n\s*/g, " ")
    .replace(/\|/g, "\\|")
    .trim();
const code = (text) => (text ? `\`${cell(text).replace(/`/g, "'")}\`` : "");
const table = (head, rows) =>
  [
    `| ${head.join(" | ")} |`,
    `| ${head.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${row.join(" | ")} |`),
  ].join("\n");

async function propsTable(attrs, page) {
  const { component, package: addon, file = component, name, type } = attrs;
  // As lib/library.ts reads it.
  const source = file.startsWith("src/")
    ? path.join(packageDir(addon), file)
    : path.join(
        packageDir(addon),
        "src",
        "components",
        component,
        file.endsWith(".ts") ? file : `${file}.tsx`,
      );
  const docs = await generatorFor(addon).generateTypeTable(
    { path: source, name, type },
    { transform: writeOutLiterals },
  );
  const out = [];
  for (const doc of docs) {
    let entries = doc.entries;
    if (attrs.props) {
      entries = Object.entries(attrs.props).map(([prop, description]) => {
        const entry = doc.entries.find((item) => item.name === prop);
        if (!entry) {
          throw new Error(
            `${page.slug}: "${prop}" is documented for ${name}, but the type has no such prop.`,
          );
        }
        return { ...entry, description };
      });
    }
    if (entries.length === 0) continue;
    out.push(
      table(
        ["Prop", "Type", "Default", "What it's for"],
        entries.map((entry) => [
          `${code(entry.name)}${entry.required ? " (required)" : ""}`,
          code(entry.type.replace(/ \| undefined$/, "")),
          code(entry.tags.find((tag) => tag.name === "default")?.text),
          cell(entry.description),
        ]),
      ),
    );
  }
  return out.join("\n\n");
}

const cssOf = (addon, component) =>
  read(path.join(packageDir(addon), "dist", "css", `${component}.css`));

// The same walk as components/style-reference.tsx.
function findVariables(css, component) {
  const start = `var(--nuv-${component}-`;
  const variables = new Map();
  let from = css.indexOf(start);
  while (from !== -1) {
    let depth = 0;
    let end = from + 3;
    for (; end < css.length; end += 1) {
      if (css[end] === "(") depth += 1;
      if (css[end] === ")") depth -= 1;
      if (depth === 0) break;
    }
    const inside = css.slice(from + 4, end);
    const comma = inside.indexOf(",");
    const name = (comma === -1 ? inside : inside.slice(0, comma)).trim();
    const fallbacks = variables.get(name) ?? new Set();
    if (comma === -1) {
      for (const [, value] of css.matchAll(
        new RegExp(`${name}:\\s*([^;}]+)`, "g"),
      )) {
        if (value) fallbacks.add(value.trim().replace(/\s+/g, " "));
      }
    } else {
      fallbacks.add(
        inside
          .slice(comma + 1)
          .trim()
          .replace(/\s+/g, " "),
      );
    }
    variables.set(name, fallbacks);
    from = css.indexOf(start, from + start.length);
  }
  return variables;
}

async function cssVariables(attrs) {
  const { component, package: addon, descriptions, shared } = attrs;
  const css = shared
    ? await read(path.join(packageDir(addon), "dist", "styles.css"))
    : await cssOf(addon, component);
  const variables = findVariables(css, component);
  return table(
    ["Variable", "Default", "What it sets"],
    [...variables].map(([name, fallbacks]) => [
      code(name),
      [...fallbacks].map(code).join(", "),
      cell(descriptions[name]),
    ]),
  );
}

async function bemClasses(attrs) {
  const { component, package: addon, descriptions } = attrs;
  const css = await cssOf(addon, component);
  const pattern = new RegExp(`\\.(nuv-${component}[a-z0-9_-]*)`, "g");
  const classes = [
    ...new Set([...css.matchAll(pattern)].map(([, name]) => name)),
  ].sort();
  return table(
    ["Class", "What it's on"],
    classes.map((name) => [code(`.${name}`), cell(descriptions[name])]),
  );
}

async function preview(attrs) {
  const out = [];
  if (attrs.stylesheet) {
    const file = path.join(
      examplesDir,
      path.dirname(attrs.name),
      attrs.stylesheet,
    );
    const lang = path.extname(attrs.stylesheet).slice(1);
    out.push(
      `\`\`\`${lang} title="${attrs.stylesheet}"\n${unix(await read(file)).trim()}\n\`\`\``,
    );
  }
  const source = unix(await read(path.join(examplesDir, `${attrs.name}.tsx`)));
  out.push(`\`\`\`tsx\n${source.trim()}\n\`\`\``);
  return out.join("\n\n");
}

// ---------------------------------------------------------------------
// A page's MDX, as Markdown.

// What's in an attribute's braces: a string, a number, true or false, or
// a list or an object of those. It's read and never run.
function literal(source) {
  let at = 0;
  const space = () => {
    while (/\s/.test(source[at] ?? "")) at += 1;
  };
  const fail = () => {
    throw new Error(
      `Can't read an attribute near: ${source.slice(at, at + 40)}`,
    );
  };
  const string = () => {
    const quote = source[at];
    let out = "";
    at += 1;
    while (source[at] !== quote) {
      if (at >= source.length) fail();
      if (source[at] === "\\") {
        at += 1;
        const escapes = { n: "\n", t: "\t" };
        out += escapes[source[at]] ?? source[at];
      } else out += source[at];
      at += 1;
    }
    at += 1;
    return out;
  };
  const value = () => {
    space();
    const char = source[at];
    if (char === '"' || char === "'" || char === "`") return string();
    if (char === "{") {
      const out = {};
      at += 1;
      for (;;) {
        space();
        if (source[at] === "}") break;
        const key =
          source[at] === '"' || source[at] === "'"
            ? string()
            : (/^[\w$]+/.exec(source.slice(at))?.[0] ?? fail());
        if (source[at] !== ":" && key === source.slice(at, at + key.length)) {
          at += key.length;
        }
        space();
        if (source[at] !== ":") fail();
        at += 1;
        out[key] = value();
        space();
        if (source[at] === ",") at += 1;
      }
      at += 1;
      return out;
    }
    if (char === "[") {
      const out = [];
      at += 1;
      for (;;) {
        space();
        if (source[at] === "]") break;
        out.push(value());
        space();
        if (source[at] === ",") at += 1;
      }
      at += 1;
      return out;
    }
    const word = /^(true|false|-?\d+(\.\d+)?)/.exec(source.slice(at))?.[0];
    if (!word) fail();
    at += word.length;
    return word === "true" ? true : word === "false" ? false : Number(word);
  };
  const out = value();
  space();
  if (at !== source.length) fail();
  return out;
}

// Reads a tag that begins a line: its name, its attributes, and what's
// between it and its closing tag if it has one.
function readTag(text, from) {
  const name = /^<([A-Z]\w*)/.exec(text.slice(from))?.[1];
  let at = from + 1 + name.length;
  const attrs = {};
  const space = () => {
    while (/\s/.test(text[at])) at += 1;
  };
  for (;;) {
    space();
    if (text.startsWith("/>", at)) return { name, attrs, end: at + 2 };
    if (text[at] === ">") break;
    const key = /^[\w-]+/.exec(text.slice(at))?.[0];
    if (!key)
      throw new Error(`Can't read <${name}> near: ${text.slice(at, at + 40)}`);
    at += key.length;
    if (text[at] !== "=") {
      attrs[key] = true;
      continue;
    }
    at += 1;
    if (text[at] === '"' || text[at] === "'") {
      const close = text.indexOf(text[at], at + 1);
      attrs[key] = text.slice(at + 1, close);
      at = close + 1;
      continue;
    }
    // Braces, to the one that closes the first.
    let depth = 0;
    let quote = "";
    let end = at;
    for (; end < text.length; end += 1) {
      const char = text[end];
      if (quote) {
        if (char === "\\") end += 1;
        else if (char === quote) quote = "";
      } else if (char === '"' || char === "'" || char === "`") quote = char;
      else if (char === "{") depth += 1;
      else if (char === "}") {
        depth -= 1;
        if (depth === 0) break;
      }
    }
    attrs[key] = literal(text.slice(at + 1, end));
    at = end + 1;
  }
  const closing = `</${name}>`;
  const close = text.indexOf(closing, at);
  return {
    name,
    attrs,
    children: text.slice(at + 1, close).trim(),
    end: close + closing.length,
  };
}

async function render(page, profile, slugs) {
  const body = page.body;
  const out = [];
  let at = 0;
  let fence = "";
  let lineStart = true;

  // Line by line, so a tag is only read where one can begin: at the start
  // of a line, outside a code block.
  while (at < body.length) {
    const newline = body.indexOf("\n", at);
    const lineEnd = newline === -1 ? body.length : newline + 1;
    const line = body.slice(at, lineEnd);
    const mark = /^\s*(`{3,}|~{3,})/.exec(line)?.[1];
    if (mark) {
      if (!fence) fence = mark;
      else if (mark.startsWith(fence)) fence = "";
      out.push(line);
      at = lineEnd;
      continue;
    }
    if (fence || !lineStart || !/^<[A-Z]/.test(line)) {
      out.push(fence ? line : links(line, page, profile, slugs));
      at = lineEnd;
      continue;
    }
    const tag = readTag(body, at);
    out.push(await renderTag(tag, page, profile, slugs));
    at = tag.end;
    lineStart = false;
    // What's left of the line the tag ended on, which is its newline.
    const rest = body.indexOf("\n", at);
    if (rest !== -1 && body.slice(at, rest).trim() === "") {
      out.push("\n");
      at = rest + 1;
    }
    lineStart = true;
  }

  const text = out
    .join("")
    .replace(/\n{3,}/g, "\n\n")
    // A heading that only had something to try under it has nothing now.
    .replace(
      /^(#{2,6}) [^\n]+\n\n(?=#{2,6} )/gm,
      (heading, marks, offset, whole) => {
        const next =
          /^#+/.exec(whole.slice(offset + heading.length))?.[0] ?? "";
        return next.length <= marks.length ? "" : heading;
      },
    )
    .trim();
  return `# ${page.title}\n\n${page.description}\n\n${text}\n`;
}

async function renderTag(tag, page, profile, slugs) {
  const { name, attrs } = tag;
  switch (name) {
    case "Preview":
      return preview(attrs);
    case "PropsTable":
      return propsTable(attrs, page);
    case "CssVariables":
      return cssVariables(attrs);
    case "BemClasses":
      return bemClasses(attrs);
    case "Callout": {
      const text = links(tag.children ?? "", page, profile, slugs)
        .split("\n")
        .map((line) => `> ${line.trim()}`)
        .join("\n");
      return attrs.title ? `> **${attrs.title}**\n>\n${text}` : text;
    }
    case "NotPublished": {
      // Said on the site, where it goes away by itself on the day of the
      // release. A file kept in git would have to be written again then.
      if (profile !== "site") return "";
      const manifest = JSON.parse(
        await read(path.join(packageDir(attrs.package), "package.json")),
      );
      return manifest.version === "0.0.0"
        ? `> **Not published yet**\n>\n> \`${packageName(attrs.package)}\` isn't on the registry yet, so the install command below won't find it.`
        : "";
    }
    case "PresetList": {
      const dir = path.join(packageDir(), "dist", "themes");
      const names = (await readdir(dir))
        .filter((file) => file.endsWith(".css"))
        .map((file) => file.slice(0, -4))
        .sort();
      return names
        .map(
          (preset) =>
            `- \`${preset}\`, loaded with \`import "@nuvui/react/themes/${preset}.css"\``,
        )
        .join("\n");
    }
    case "TailwindTheme": {
      const css = unix(
        await read(path.join(docsDir, "app", "semantic-colors.css")),
      );
      const block = /@theme inline reference \{[\s\S]*?\n\}/.exec(css)?.[0];
      if (!block) {
        throw new Error("No @theme block found in app/semantic-colors.css.");
      }
      return `\`\`\`css title="app/globals.css"\n${block}\n\`\`\``;
    }
    case "ScssBreakpoints": {
      const scss = unix(
        await read(
          path.join(packageDir(), "dist", "scss", "styles", "_mixins.scss"),
        ),
      );
      const map = /^\$breakpoints:[\s\S]*?!default;/m.exec(scss)?.[0];
      if (!map) throw new Error("No $breakpoints map found in the mixins.");
      return `\`\`\`scss\n${map}\n\`\`\``;
    }
    case "IconGrid": {
      // The grid is for finding an icon by eye. An agent needs the names,
      // and one that guesses a name gets an import that doesn't exist.
      const manifest = JSON.parse(
        await read(path.join(packageDir("icons"), "manifest.json")),
      );
      const categories = new Map();
      for (const icon of manifest.icons) {
        categories.set(icon.category, [
          ...(categories.get(icon.category) ?? []),
          code(icon.component),
        ]);
      }
      return table(
        ["Category", "Icons"],
        [...categories].map(([category, icons]) => [
          cell(category),
          icons.join(", "),
        ]),
      );
    }
    default:
      // Something to try in a browser, which has nothing to say here.
      if (name.endsWith("Playground") || name === "TokenEditor") return "";
      // A table the site draws from the library. Where the page gives a
      // description for each row, those are the table.
      if (attrs.descriptions) {
        return table(
          ["Name", "What it's for"],
          Object.entries(attrs.descriptions).map(([key, text]) => [
            code(key),
            cell(text),
          ]),
        );
      }
      return `_The docs page shows this as a table: ${urlOf(page.slug)}${
        name.startsWith("Token") ||
        name.endsWith("Colors") ||
        name === "ColorScales"
          ? profile === "skill"
            ? ". The tokens themselves are in tokens.md, beside SKILL.md."
            : `. The tokens themselves are in ${siteUrl}/docs/llms/tokens.md.`
          : ""
      }_`;
  }
}

// A link to another docs page goes to that page's file, in the skill, and
// to the page's address anywhere else.
function links(text, page, profile, slugs) {
  return text.replace(
    /\]\(\/docs(\/[^)#\s]*)?(#[^)\s]*)?\)/g,
    (_, target = "", hash = "") => {
      const slug = target.slice(1);
      const found = slugs.has(slug)
        ? slug
        : slugs.has(`${slug}/index`)
          ? `${slug}/index`
          : slug === ""
            ? "index"
            : undefined;
      if (profile !== "skill" || !found) {
        return `](${siteUrl}/docs${target}${hash})`;
      }
      const from = path.posix.dirname(page.slug);
      return `](${path.posix.relative(from, found) || path.posix.basename(found)}.md${hash})`;
    },
  );
}

// ---------------------------------------------------------------------
// The lists.

const sectionTitles = {
  "": "Guides",
  components: "@nuvui/react: components",
  "date-picker": "@nuvui/date-picker",
  table: "@nuvui/table",
  charts: "@nuvui/charts",
  barcodes: "@nuvui/barcodes",
  chat: "@nuvui/chat",
  kanban: "@nuvui/kanban",
  editor: "@nuvui/editor",
  emoji: "@nuvui/emoji",
  map: "@nuvui/map",
  icons: "@nuvui/icons",
};

function listing(pages, href) {
  const out = [];
  let section;
  for (const page of pages) {
    if (page.section !== section) {
      section = page.section;
      out.push(`\n## ${sectionTitles[section] ?? section}\n`);
    }
    out.push(`- [${page.title}](${href(page)}): ${page.description}`);
  }
  return out.join("\n").trim();
}

const generated = (from) =>
  `<!-- Written by apps/docs/scripts/agent-skill.mjs from ${from}. Don't edit it here: run \`pnpm skill\`. -->`;

async function blocksPage() {
  const names = (await readdir(blocksDir, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
  const blocks = [];
  for (const name of names) {
    const file = path.join(blocksDir, name, "block.json");
    if (existsSync(file)) blocks.push(JSON.parse(await read(file)));
  }
  const categories = [...new Set(blocks.map((block) => block.category))].sort();
  const out = [
    generated("the website's blocks"),
    "",
    "# Blocks",
    "",
    `A block is a part of an app, such as a sign-in screen or a table with a toolbar, built from the library's components: one TSX file and one SCSS file, to copy into an app and change. There are ${blocks.length}. Each is shown at ${siteUrl}/blocks.`,
    "",
    "Before building a screen from nothing, look here for one that's close. To add one, with the packages it needs:",
    "",
    "```sh",
    `pnpm dlx shadcn@latest add ${siteUrl}/r/<name>.json`,
    "```",
    "",
    "That's shadcn's command line tool, reading this site's registry. It copies the block's files and installs what it lists. It doesn't need the project to use shadcn's components.",
    "",
    "A block's files aren't in this skill. To read one without adding it, fetch them:",
    "",
    `- ${repoUrl.replace("github.com", "raw.githubusercontent.com")}/main/apps/showcase/src/blocks/<name>/<name>.tsx`,
    `- ${repoUrl.replace("github.com", "raw.githubusercontent.com")}/main/apps/showcase/src/blocks/<name>/<name>.scss`,
    "",
    "A block is a starting point and does more than most requests ask for. Take its structure, and leave out what wasn't asked for. Where it can't be fetched, build from the reference files: they have everything a block uses.",
    "",
    "A block's SCSS uses the library's mixins, `@use \"@nuvui/react/scss/mixins\"`, so the app needs Sass. In an app without it, write the same rules as plain CSS: rules/styling.md says what each mixin stands for. Its classes begin with the block's own name, and its colors are the theme's tokens.",
  ];
  for (const category of categories) {
    out.push("", `## ${category[0].toUpperCase()}${category.slice(1)}`, "");
    for (const block of blocks.filter((one) => one.category === category)) {
      out.push(
        `- **${block.title}** (\`${block.name}\`): ${block.description} Needs ${block.install.map((one) => `\`${one}\``).join(", ")}.`,
      );
    }
  }
  return `${out.join("\n")}\n`;
}

async function tokensPage() {
  const css = unix(
    await read(path.join(packageDir(), "dist", "tokens.css")),
  ).trim();
  return [
    generated("packages/ui/dist/tokens.css"),
    "",
    "# Design tokens",
    "",
    "Every token the library ships, as `@nuvui/react/tokens.css` has them, which `@nuvui/react/styles.css` includes. Use these in your own CSS, as `var(--color-primary)`, and never a color written out. To change a theme, set them again on `:root`, in a rule that isn't in a layer. [reference/theming.md](reference/theming.md) says what each group is for.",
    "",
    "```css",
    css,
    "```",
    "",
  ].join("\n");
}

// The skill's first page under the name the repository gives it, with its
// links made to work from the root.
async function agentFile() {
  const skill = unix(await read(path.join(skillDir, "SKILL.md")));
  const { body } = frontmatter(skill);
  const moved = body.replace(
    /\]\((?!https?:|#)([^)]+)\)/g,
    (_, target) => `](skills/nuvui/${target})`,
  );
  return `${generated("skills/nuvui/SKILL.md")}\n\n${moved.trim()}\n`;
}

// ---------------------------------------------------------------------
// Every component in every package has to be on a page.

async function checkCoverage(pages) {
  const documented = new Set();
  for (const page of pages) {
    for (const [, attrs] of page.body.matchAll(
      /<(?:PropsTable|CssVariables|BemClasses)\b([^>]*?)\/>/gs,
    )) {
      const component = /component="([^"]+)"/.exec(attrs)?.[1];
      const addon = /package="([^"]+)"/.exec(attrs)?.[1];
      if (component) documented.add(`${addon ?? core}/${component}`);
    }
  }
  const missing = [];
  for (const folder of [core, ...addons]) {
    const dir = path.join(repoDir, "packages", folder, "src", "components");
    // The icons are generated, one per file, and have no folders of their own.
    if (!existsSync(dir)) continue;
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      if (!documented.has(`${folder}/${entry.name}`)) {
        missing.push(`packages/${folder}/src/components/${entry.name}`);
      }
    }
  }
  if (missing.length > 0) {
    throw new Error(
      `These components are on no docs page, so no agent would learn of them:\n  ${missing.join("\n  ")}`,
    );
  }
}

// ---------------------------------------------------------------------

async function build() {
  const pages = (await pagesIn(contentDir, "")).filter(
    // The changelog is what's changed, which the packages carry themselves.
    (page) => page.slug !== "changelog",
  );
  const slugs = new Set(pages.map((page) => page.slug));
  // The skill's page and the MCP server's: how a person sets an agent up.
  const aboutTheSkill = (page) => page.slug === "agents" || page.slug === "mcp";
  const inSkill = new Set(
    pages.filter((page) => !aboutTheSkill(page)).map((page) => page.slug),
  );
  await checkCoverage(pages);

  const kept = new Map();
  const site = new Map();
  const full = [];
  for (const page of pages) {
    // The page about the skill is for people, and the skill doesn't need
    // telling about itself.
    if (!aboutTheSkill(page)) {
      const skill = await render(page, "skill", inSkill);
      kept.set(
        path.join(skillDir, "reference", `${page.slug}.md`),
        `${generated(`apps/docs/content/docs/${page.slug}.mdx`)}\n\n${skill}`,
      );
    }
    const web = await render(page, "site", slugs);
    site.set(path.join(docsDir, "public", "llms", `${page.slug}.md`), web);
    full.push(web);
  }

  kept.set(
    path.join(skillDir, "reference.md"),
    [
      generated("the docs' pages"),
      "",
      "# Reference",
      "",
      "A file for each page of the docs. Read the one for a component before using it: its parts, its props, a working example of each thing it does, what it handles for accessibility and what it leaves to you.",
      "",
      listing(
        pages.filter((page) => !aboutTheSkill(page)),
        (page) => `reference/${page.slug}.md`,
      ),
      "",
    ].join("\n"),
  );
  kept.set(path.join(skillDir, "blocks.md"), await blocksPage());
  const tokens = await tokensPage();
  kept.set(path.join(skillDir, "tokens.md"), tokens);
  site.set(
    path.join(docsDir, "public", "llms", "tokens.md"),
    tokens.replace(
      "[reference/theming.md](reference/theming.md)",
      `${siteUrl}/docs/llms/theming.md`,
    ),
  );
  kept.set(path.join(repoDir, "NuvUIAIAgent.md"), await agentFile());

  const index = [
    "# nuvui",
    "",
    "> An open source React library for business software: data tables, forms, charts and dashboards, tested for accessibility and themed with CSS variables. Ten packages, MIT licensed. Styling is SCSS with BEM classes and CSS variables, in cascade layers, and needs no Tailwind.",
    "",
    `Each page below is plain Markdown. All of them in one file: ${siteUrl}/docs/llms-full.txt. A skill for coding agents, with the rules that are easy to get wrong: ${repoUrl}/tree/main/skills/nuvui, installed with \`pnpm dlx skills add Nuvraxis/nuvui\`.`,
    "",
    listing(pages, (page) => `${siteUrl}/docs/llms/${page.slug}.md`),
    "",
    "## Optional",
    "",
    `- [Design tokens](${siteUrl}/docs/llms/tokens.md): Every token the library ships.`,
    `- [Blocks](${siteUrl}/blocks): Parts of an app built from the components, to copy.`,
    `- [Changelog](${siteUrl}/docs/changelog): What changed in each release.`,
    "",
  ].join("\n");
  kept.set(path.join(repoDir, "apps", "showcase", "public", "llms.txt"), index);
  site.set(path.join(docsDir, "public", "llms.txt"), index);
  site.set(
    path.join(docsDir, "public", "llms-full.txt"),
    `${full.join("\n---\n\n")}`,
  );

  return { kept, site };
}

async function write(files) {
  for (const [file, text] of files) {
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, text);
  }
}

// The files under a folder, however deep.
async function filesIn(dir) {
  if (!existsSync(dir)) return [];
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const at = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await filesIn(at)));
    else out.push(at);
  }
  return out;
}

const mode = process.argv[2];
const { kept, site } = await build();
const referenceDir = path.join(skillDir, "reference");
const stale = (await filesIn(referenceDir)).filter((file) => !kept.has(file));
const show = (file) => path.relative(repoDir, file).split(path.sep).join("/");

if (mode === "--check") {
  const behind = [];
  for (const [file, text] of kept) {
    if (!existsSync(file) || unix(await read(file)) !== text) {
      behind.push(show(file));
    }
  }
  behind.push(...stale.map((file) => `${show(file)} (its page is gone)`));
  if (behind.length > 0) {
    console.error(
      `The agent skill is behind the docs. Run \`pnpm skill\` and keep what it writes:\n  ${behind.join("\n  ")}`,
    );
    process.exit(1);
  }
  console.log(`agent-skill: ${kept.size} files match the docs`);
} else if (mode === "--site") {
  await write(site);
  console.log(`agent-skill: ${site.size} files for the site`);
} else {
  await write(kept);
  // A page that's gone takes its file with it.
  for (const file of stale) await rm(file);
  console.log(`agent-skill: ${kept.size} files written`);
}
