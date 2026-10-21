import type { IncomingMessage } from "node:http";
import { FastMCP, UserError } from "fastmcp";
import { z } from "zod";
import {
  type Data,
  type Docs,
  type Page,
  registryUrl,
  type Snapshots,
  site,
} from "./data";
import { search, stemOf, termsOf } from "./search";
import {
  compareVersions,
  formatVersion,
  lineOf,
  parseVersion,
  type Version,
} from "./versions";

/** How a call ended, for the counts. */
export type Outcome = "ok" | "not_found" | "error";

export interface ServerOptions {
  /** Called once for every tool call, with how it ended. */
  record?: (tool: string, outcome: Outcome) => void;
  /** Runs before each HTTP request, and throws a `Response` to refuse it. */
  authenticate?: (request: IncomingMessage) => Promise<Record<string, unknown>>;
  /** The docs kept for earlier releases, for an agent that asks for one. */
  snapshots?: Snapshots;
}

// To standard error, since over stdio standard output is the protocol's.
// FastMCP's debug lines, one for each request, are left out.
const logger = {
  debug: () => {},
  error: console.error,
  info: console.error,
  log: console.error,
  warn: console.error,
};

// Every tool only reads, the same data each time.
const readOnly = {
  readOnlyHint: true,
  idempotentHint: true,
  openWorldHint: false,
} as const;

// A name as a person or a model writes it: `DataTable`, `data table` or
// `data-table` are the same page.
const kebab = (name: string) =>
  name
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/[\s_]+/g, "-")
    .toLowerCase();

const name = z
  .string()
  .trim()
  .min(1)
  .max(100)
  .regex(
    /^[A-Za-z0-9][A-Za-z0-9 /_-]*$/,
    "Letters, digits, spaces, - and / only",
  );

// A version as a package.json writes it, which is what an agent has to
// hand. A range is read as the version it starts from.
const versionText = z
  .string()
  .trim()
  .min(1)
  .max(40)
  .regex(
    /^(?:\^|~|>=|=)?v?\d+(?:\.(?:\d+|x|\*)){0,2}(?:-[0-9A-Za-z.-]+)?$/,
    "A version such as 0.6.2, ^0.6.0 or ~0.6.0",
  );

const version = versionText
  .optional()
  .describe(
    "The @nuvui/react version in the project's package.json, such as 0.6.2 or ^0.6.0, for the docs of that release. Leave it out for the latest release.",
  );

const listLine = (id: string, title: string, description: string) =>
  `- \`${id}\` ${title}: ${description}`;

function closest<T>(
  items: readonly T[],
  query: string,
  key: (item: T) => string,
) {
  // By the start of each word, as search finds them, so "tables" suggests
  // "@nuvui/table".
  const stems = termsOf(query.replaceAll("/", " ")).map(stemOf);
  return items
    .filter((item) =>
      stems.some((stem) => key(item).toLowerCase().includes(stem)),
    )
    .slice(0, 5)
    .map(key);
}

function notFound(
  what: string,
  query: string,
  suggestions: string[],
  list: string,
): never {
  throw new UserError(
    [
      `No ${what} is called "${query}".`,
      suggestions.length > 0
        ? `Did you mean: ${suggestions.map((s) => `\`${s}\``).join(", ")}?`
        : "",
      `${list} lists them all.`,
    ]
      .filter(Boolean)
      .join(" "),
  );
}

// The same token is set again for the dark theme and for each preset, so
// the rules around a line are kept with it, and the rules left with nothing
// in them taken out.
export function tokensStartingWith(css: string, prefix: string) {
  let lines = css
    .split("\n")
    .filter(
      (line) =>
        line.trim().startsWith(prefix) ||
        line.trimEnd().endsWith("{") ||
        line.trim() === "}",
    );
  for (;;) {
    const at = lines.findIndex(
      (line, index) =>
        line.trimEnd().endsWith("{") && lines[index + 1]?.trim() === "}",
    );
    if (at === -1) break;
    lines = [...lines.slice(0, at), ...lines.slice(at + 2)];
  }
  return lines.join("\n").trim();
}

function findPage(pages: readonly Page[], query: string) {
  const wanted = kebab(query);
  return (
    pages.find((page) => page.id === wanted) ??
    // A component's name alone, such as `compare` for `components/compare`.
    pages.find((page) => page.id.endsWith(`/${wanted}`)) ??
    pages.find((page) => kebab(page.title) === wanted)
  );
}

// A changelog's headings, one level down, to sit under a heading of ours.
const demoted = (markdown: string) => markdown.replace(/^(#+) /gm, "#$1 ");

const unreleased = (packageVersion: string | undefined) =>
  packageVersion === undefined || packageVersion === "0.0.0";

const instructions = `This server answers questions about nuvui, an open source React component library for business software (@nuvui/react and its add-on packages). Everything here is read-only and public.

Before writing code with nuvui, call get_rules: it says what's different about the library and the rules that are easy to get wrong. Then find what you need with search_docs or list_components, and read its page with get_page before using it. A page has the component's parts, props, an example of each thing it does, its CSS variables and classes, and what it leaves to you for accessibility.

Every answer starts with the versions it describes, which are the latest releases unless you ask for another. Read the project's package.json first: if its @nuvui/react is older, pass that version to the tools that take one, and call get_changes with its @nuvui/* packages to see what came after them. Don't use a prop, part or token the project's version doesn't have.

In what comes back, a link to page:<id> is another page, for get_page. rule:<topic> is for get_rules, and tool:<name> is another tool here.

Before building a screen from nothing, look at list_blocks: a block is a screen built from the components, to copy and change.`;

/** The server, with its tools, answering from `data`. */
export function createServer(data: Data, options: ServerOptions = {}) {
  const server = new FastMCP({
    name: "nuvui",
    title: "nuvui",
    version: data.version as `${number}.${number}.${number}`,
    instructions,
    websiteUrl: site,
    health: { path: "/healthz", message: "ok" },
    logger,
    ...(options.authenticate ? { authenticate: options.authenticate } : {}),
  });

  const latest = parseVersion(data.version) ?? ([0, 0, 0] as Version);
  const pendingPackages = new Set(data.pending.map((p) => p.package));

  // The docs for the version an agent asked for, and what to say about
  // them. Asked with no version, or for one that isn't kept, it's the
  // latest, and the answer says which.
  interface Answer {
    docs: Docs;
    /** Whether these are the latest docs, which may be ahead of npm. */
    current: boolean;
    /** Said first when the docs aren't for the version asked for. */
    warning?: string;
  }

  function docsFor(asked: string | undefined): Answer {
    if (asked === undefined) return { docs: data, current: true };
    const wanted = parseVersion(asked);
    if (!wanted) throw new UserError(`"${asked}" isn't a version.`);
    const line = lineOf(wanted);
    const kept = options.snapshots?.load(line);
    if (kept) return { docs: kept, current: false };
    if (line === lineOf(latest)) return { docs: data, current: true };
    const oldest = options.snapshots?.lines[0];
    return {
      docs: data,
      current: true,
      warning:
        compareVersions(wanted, latest) > 0
          ? `There are no docs here for @nuvui/react ${line} yet. What follows is for ${data.version}, the latest these docs have, and the project may have more than they describe.`
          : `There are no docs here for @nuvui/react ${line}${oldest ? `: the oldest kept is ${oldest}` : ""}. What follows is for ${data.version}, the latest release, and may have props, parts and tokens that ${line} doesn't. Call get_changes with the project's @nuvui/* versions before using any of it.`,
    };
  }

  // The line every answer starts with, so an agent never has to guess
  // which release it's reading about.
  function about(answer: Answer, pkg: string | null = null) {
    const { docs, current, warning } = answer;
    if (warning) return `> ${warning}`;
    const react = `@nuvui/react ${docs.version}`;
    const addOn = pkg && pkg !== "@nuvui/react" ? pkg : null;
    if (!current) {
      const withAddOn =
        addOn && docs.packages[addOn]
          ? `${addOn} ${docs.packages[addOn]} and `
          : "";
      return `> These docs are for ${withAddOn}${react}, the release asked for.`;
    }
    const lines: string[] = [];
    if (addOn && unreleased(docs.packages[addOn])) {
      lines.push(
        `${addOn} isn't on npm yet: what's here is coming in its first release. The rest is for ${react}, the latest release.`,
      );
    } else {
      lines.push(
        addOn
          ? `These docs are for ${addOn} ${docs.packages[addOn]} and ${react}, the latest releases.`
          : `These docs are for ${react}, the latest release.`,
      );
      if (pkg && pendingPackages.has(pkg)) {
        lines.push(
          "Some of what's here is in no release yet: get_changes lists it.",
        );
      }
    }
    lines.push(
      "If the project's package.json has an older @nuvui/react, pass it as `version`, and call get_changes with its @nuvui/* versions.",
    );
    return `> ${lines.join(" ")}`;
  }

  const withAbout = (answer: Answer, text: string, pkg: string | null = null) =>
    `${about(answer, pkg)}\n\n${text}`;

  // When an older release hasn't something, says whether the latest has,
  // which is the difference between a typo and a thing that came later.
  // `released` says whether a release's docs have it: a package with a
  // change still to come can have this one out already.
  function laterThan(
    answer: Answer,
    what: string,
    latestPackage: string | undefined,
    released: (docs: Docs) => boolean,
  ) {
    if (answer.current) return "";
    if (latestPackage === undefined) {
      return ` It isn't in the docs for @nuvui/react ${answer.docs.version}.`;
    }
    const inRelease =
      !unreleased(data.packages[latestPackage]) &&
      (!pendingPackages.has(latestPackage) || isReleased(released));
    return inRelease
      ? ` ${what} is in the latest docs, for @nuvui/react ${data.version}: it came after ${answer.docs.version}, so the project doesn't have it until it updates.`
      : ` ${what} is in the latest docs, but in no release yet.`;
  }

  // Whether the latest release has it, by that release's own docs. They're
  // kept once it's out, as the newest line.
  function isReleased(released: (docs: Docs) => boolean) {
    const docs = options.snapshots?.load(lineOf(latest));
    return docs !== undefined && released(docs);
  }

  const tool = <P extends z.ZodType>(definition: {
    name: string;
    title: string;
    description: string;
    parameters: P;
    run: (args: z.infer<P>) => string;
  }) =>
    server.addTool({
      name: definition.name,
      description: definition.description,
      parameters: definition.parameters,
      annotations: { title: definition.title, ...readOnly },
      execute: async (args) => {
        try {
          const text = definition.run(args as z.infer<P>);
          options.record?.(definition.name, "ok");
          return text;
        } catch (error) {
          options.record?.(
            definition.name,
            error instanceof UserError ? "not_found" : "error",
          );
          throw error;
        }
      },
    });

  const ruleTopics = data.rules.map((rule) => rule.topic);
  tool({
    name: "get_rules",
    title: "Rules for using nuvui",
    description:
      "Start here. Without a topic: the versions these docs describe, what to know before writing code with nuvui, the packages, the rules in a line each, and which component meets which need. With a topic: that rule in full, with wrong and right code.",
    parameters: z.object({
      topic: z
        .enum(ruleTopics as [string, ...string[]])
        .optional()
        .describe(`One of: ${ruleTopics.join(", ")}.`),
      version,
    }),
    run: ({ topic, version: asked }) => {
      const answer = docsFor(asked);
      const { docs } = answer;
      if (topic !== undefined) {
        const rule = docs.rules.find((r) => r.topic === topic);
        if (!rule) {
          throw new UserError(
            `The docs for @nuvui/react ${docs.version} have no rule called "${topic}". Theirs: ${docs.rules.map((r) => r.topic).join(", ")}.`,
          );
        }
        return withAbout(answer, rule.markdown);
      }
      const versions = Object.entries(docs.packages)
        .map(([pkg, v]) =>
          answer.current && unreleased(v)
            ? `- ${pkg}: not released yet`
            : `- ${pkg} ${v}`,
        )
        .join("\n");
      return withAbout(
        answer,
        `## Versions\n\nThese docs describe these releases. Compare them with the project's package.json: a package it has at an older version may not have everything described here.\n\n${versions}\n\n${docs.overview}`,
      );
    },
  });

  const latestPackages = [
    ...new Set(data.pages.flatMap((page) => page.package ?? [])),
  ];
  tool({
    name: "list_components",
    title: "List the components",
    description:
      "Every component page, by package, with what each is for in a line. Pass a package to see only its pages.",
    parameters: z.object({
      package: z
        .string()
        .trim()
        .max(40)
        .optional()
        .describe(
          `A package, such as @nuvui/table or table. One of: ${latestPackages.join(", ")}.`,
        ),
      version,
    }),
    run: ({ package: wanted, version: asked }) => {
      const answer = docsFor(asked);
      const { docs } = answer;
      const packages = [
        ...new Set(docs.pages.flatMap((page) => page.package ?? [])),
      ];
      const full =
        wanted === undefined || wanted === ""
          ? undefined
          : wanted.startsWith("@nuvui/")
            ? wanted
            : `@nuvui/${wanted}`;
      if (full !== undefined && !packages.includes(full)) {
        if (!answer.current && latestPackages.includes(full)) {
          throw new UserError(
            `No package is called "${wanted}" in the docs for @nuvui/react ${docs.version}.${laterThan(answer, full, full, (kept) => full in kept.packages)}`,
          );
        }
        notFound(
          "package",
          wanted ?? "",
          closest(packages, wanted ?? "", (p) => p),
          "list_components without a package",
        );
      }
      const groups = new Map<string, Page[]>();
      for (const page of docs.pages) {
        if (page.package === null || (full && page.package !== full)) continue;
        groups.set(page.group, [...(groups.get(page.group) ?? []), page]);
      }
      return withAbout(
        answer,
        [...groups]
          .map(
            ([group, pages]) =>
              `## ${group}\n\n${pages.map((page) => listLine(page.id, page.title, page.description)).join("\n")}`,
          )
          .join("\n\n"),
        full ?? null,
      );
    },
  });

  tool({
    name: "list_guides",
    title: "List the guides",
    description:
      "The pages that aren't about one component: getting started, theming, Tailwind, SCSS, forms, right to left, translation, the Content Security Policy, support, and recipes for whole screens.",
    parameters: z.object({ version }),
    run: ({ version: asked }) => {
      const answer = docsFor(asked);
      return withAbout(
        answer,
        answer.docs.pages
          .filter((page) => page.package === null)
          .map((page) => listLine(page.id, page.title, page.description))
          .join("\n"),
      );
    },
  });

  tool({
    name: "get_page",
    title: "Read a page of the docs",
    description:
      "One page of the reference, as Markdown: a component's parts, props, examples, CSS variables, classes and accessibility, or a guide. Takes a page's id from list_components, list_guides or search_docs, or a component's name, such as Compare or DataTable. A section gives only that part of the page, such as Props or CSS variables.",
    parameters: z.object({
      page: name.describe(
        "A page's id, such as components/compare, or a component's name.",
      ),
      section: z
        .string()
        .trim()
        .max(100)
        .optional()
        .describe(
          "A `##` heading on the page, such as Props, Accessibility or CSS variables.",
        ),
      version,
    }),
    run: ({ page: query, section, version: asked }) => {
      const answer = docsFor(asked);
      const page = findPage(answer.docs.pages, query);
      if (!page) {
        const later = answer.current ? undefined : findPage(data.pages, query);
        if (later) {
          throw new UserError(
            `No page is called "${query}" in the docs for @nuvui/react ${answer.docs.version}.${laterThan(answer, `\`${later.id}\``, later.package ?? "@nuvui/react", (kept) => kept.pages.some((p) => p.id === later.id))}`,
          );
        }
        notFound(
          "page",
          query,
          closest(answer.docs.pages, query, (p) => p.id),
          "list_components or list_guides",
        );
      }
      if (section === undefined || section === "") {
        return withAbout(answer, page.markdown, page.package);
      }
      const wanted = section.toLowerCase();
      const found = page.sections.find(
        (s) => s.heading.toLowerCase() === wanted,
      );
      if (!found) {
        throw new UserError(
          `"${page.title}" has no section called "${section}". Its sections: ${page.sections.map((s) => s.heading).join(", ")}.`,
        );
      }
      return withAbout(answer, found.markdown, page.package);
    },
  });

  tool({
    name: "search_docs",
    title: "Search the docs",
    description:
      "Finds the sections of the reference that best answer a question or a few words, such as 'sortable table', 'dark mode' or 'error message on a field'. Each result names its page and section, for get_page.",
    parameters: z.object({
      query: z.string().trim().min(1).max(200),
      limit: z.number().int().min(1).max(20).default(8),
      version,
    }),
    run: ({ query, limit, version: asked }) => {
      const answer = docsFor(asked);
      const hits = search(answer.docs.pages, query, limit);
      if (hits.length === 0) {
        return withAbout(
          answer,
          `Nothing in the docs matches "${query}". Try other words, or list_components.`,
        );
      }
      return withAbout(
        answer,
        hits
          .map(
            (hit) =>
              `### ${hit.title}: ${hit.section}\n\nget_page \`${hit.page}\`, section \`${hit.section}\`\n\n${hit.snippet}`,
          )
          .join("\n\n"),
      );
    },
  });

  const latestCategories = [
    ...new Set(data.blocks.map((block) => block.category)),
  ];
  tool({
    name: "list_blocks",
    title: "List the blocks",
    description:
      "Blocks are screens and parts of apps built from the components, such as a sign-in screen, a dashboard or a pricing table, each a TSX file and an SCSS file to copy and change. Look here before building a screen from nothing.",
    parameters: z.object({
      category: z
        .string()
        .trim()
        .max(40)
        .optional()
        .describe(`One of: ${latestCategories.join(", ")}.`),
      version,
    }),
    run: ({ category, version: asked }) => {
      const answer = docsFor(asked);
      const { blocks } = answer.docs;
      const categories = [...new Set(blocks.map((block) => block.category))];
      if (category && !categories.includes(category)) {
        notFound(
          "category",
          category,
          closest(categories, category, (c) => c),
          "list_blocks without a category",
        );
      }
      return withAbout(
        answer,
        categories
          .filter((c) => !category || c === category)
          .map(
            (c) =>
              `## ${c}\n\n${blocks
                .filter((block) => block.category === c)
                .map((block) =>
                  listLine(block.name, block.title, block.description),
                )
                .join("\n")}`,
          )
          .join("\n\n"),
      );
    },
  });

  tool({
    name: "get_block",
    title: "Read a block",
    description:
      "A block's files in full, the packages they need, and the command that adds it to a project.",
    parameters: z.object({
      name: name.describe("A block's name from list_blocks, such as sign-in."),
      version,
    }),
    run: ({ name: query, version: asked }) => {
      const answer = docsFor(asked);
      const wanted = kebab(query);
      const block = answer.docs.blocks.find((b) => b.name === wanted);
      if (!block) {
        const later = answer.current
          ? undefined
          : data.blocks.find((b) => b.name === wanted);
        if (later) {
          throw new UserError(
            `No block is called "${query}" in the docs for @nuvui/react ${answer.docs.version}.${laterThan(answer, `\`${later.name}\``, later.install.find((p) => p !== "@nuvui/react") ?? "@nuvui/react", (kept) => kept.blocks.some((b) => b.name === later.name))}`,
          );
        }
        notFound(
          "block",
          query,
          closest(answer.docs.blocks, query, (b) => b.name),
          "list_blocks",
        );
      }
      const fence = (file: string) => (file.endsWith(".scss") ? "scss" : "tsx");
      return withAbout(
        answer,
        [
          `# ${block.title}`,
          block.description,
          // The registry serves the latest block. For an older release the
          // files below are the ones to copy.
          answer.current
            ? `To add it, with the packages it needs, from the project's root:\n\n\`\`\`sh\npnpm dlx shadcn@latest add ${registryUrl(block.name)}\n\`\`\``
            : `Copy the files below. The command that adds a block, \`pnpm dlx shadcn@latest add ${registryUrl(block.name)}\`, adds the latest one, which may use what ${answer.docs.version} doesn't have.`,
          `It needs: ${block.install.join(", ")}. It's a starting point: take its structure, and leave out what wasn't asked for.`,
          ...block.files.map(
            (file) =>
              `## ${file.name}\n\n\`\`\`${fence(file.name)}\n${file.content.trim()}\n\`\`\``,
          ),
        ].join("\n\n"),
        block.install.find((p) => p !== "@nuvui/react") ?? null,
      );
    },
  });

  // The charts are kept for the latest release only: each is one file of
  // Recharts and a few parts, and an agent can see from get_changes what
  // @nuvui/charts gained since the project's version.
  const families = [...new Set(data.charts.map((chart) => chart.family))];
  const latestAnswer: Answer = { docs: data, current: true };
  tool({
    name: "list_charts",
    title: "List the charts",
    description:
      "Charts built with @nuvui/charts on Recharts, each one file to copy: area, bar, line, pie, radar, radial, scatter and more.",
    parameters: z.object({
      family: z
        .string()
        .trim()
        .max(40)
        .optional()
        .describe(`One of: ${families.join(", ")}.`),
    }),
    run: ({ family }) => {
      if (family && !families.includes(family)) {
        notFound(
          "chart family",
          family,
          closest(families, family, (f) => f),
          "list_charts without a family",
        );
      }
      return withAbout(
        latestAnswer,
        data.charts
          .filter((chart) => !family || chart.family === family)
          .map((chart) =>
            listLine(
              `${chart.family}/${chart.name}`,
              chart.title,
              chart.description,
            ),
          )
          .join("\n"),
        "@nuvui/charts",
      );
    },
  });

  tool({
    name: "get_chart",
    title: "Read a chart",
    description:
      "A chart's file in full, such as bar/stacked, from list_charts.",
    parameters: z.object({
      name: name.describe(
        "A chart's id from list_charts, such as bar/stacked.",
      ),
    }),
    run: ({ name: query }) => {
      const chart = data.charts.find(
        (c) => `${c.family}/${c.name}` === query.trim().toLowerCase(),
      );
      if (!chart) {
        notFound(
          "chart",
          query,
          closest(data.charts, query, (c) => `${c.family}/${c.name}`),
          "list_charts",
        );
      }
      return withAbout(
        latestAnswer,
        `# ${chart.familyTitle}: ${chart.title}\n\n${chart.description}\n\n\`\`\`tsx\n${chart.source.trim()}\n\`\`\``,
        "@nuvui/charts",
      );
    },
  });

  tool({
    name: "get_tokens",
    title: "Read the design tokens",
    description:
      "The design tokens as CSS custom properties, for your own CSS: var(--color-primary), never a color written out. A prefix gives only those, such as --color-, --radius- or --text-.",
    parameters: z.object({
      prefix: z
        .string()
        .trim()
        .max(60)
        .regex(/^[a-z0-9-]*$/, "Lowercase letters, digits and - only")
        .optional(),
      version,
    }),
    run: ({ prefix, version: asked }) => {
      const answer = docsFor(asked);
      const { tokens } = answer.docs;
      if (!prefix) return withAbout(answer, `\`\`\`css\n${tokens}\n\`\`\``);
      const wanted = prefix.startsWith("--") ? prefix : `--${prefix}`;
      const kept = tokensStartingWith(tokens, wanted);
      if (kept === "") {
        throw new UserError(
          `No token starts with ${wanted}${answer.current ? "" : ` in @nuvui/react ${answer.docs.version}`}.${!answer.current && tokensStartingWith(data.tokens, wanted) !== "" ? ` The latest release, ${data.version}, has some: they came after ${answer.docs.version}.` : ""} Leave the prefix out to see them all.`,
        );
      }
      return withAbout(answer, `\`\`\`css\n${kept}\n\`\`\``);
    },
  });

  const packageNames = Object.keys(data.packages);
  tool({
    name: "get_changes",
    title: "What changed since a version",
    description:
      "What each @nuvui/* package added and changed after the versions a project has, from the packages' changelogs, newest first, and what's in the docs but in no release yet. Pass the @nuvui/* entries of the project's package.json. Without them: the latest version of each package.",
    parameters: z.object({
      installed: z
        .object(
          Object.fromEntries(
            packageNames.map((pkg) => [pkg, versionText.optional()]),
          ),
        )
        .optional()
        .describe(
          'The @nuvui/* packages in the project\'s package.json, with their versions as written there, such as { "@nuvui/react": "^0.6.0", "@nuvui/table": "0.1.6" }.',
        ),
    }),
    run: ({ installed }) => {
      const parts: string[] = ["# What changed in nuvui"];
      const asked = Object.entries(installed ?? {}).filter(
        (entry): entry is [string, string] => entry[1] !== undefined,
      );
      if (asked.length === 0) {
        parts.push(
          `The latest release of each package:\n\n${Object.entries(
            data.packages,
          )
            .map(([pkg, v]) =>
              unreleased(v) ? `- ${pkg}: not released yet` : `- ${pkg} ${v}`,
            )
            .join(
              "\n",
            )}\n\nPass \`installed\`, with the @nuvui/* versions in the project's package.json, to see what came after them.`,
        );
      }
      for (const [pkg, text] of asked) {
        const have = parseVersion(text) as Version;
        const newest = data.packages[pkg];
        const newestVersion = newest ? parseVersion(newest) : undefined;
        if (!newestVersion || unreleased(newest)) {
          parts.push(
            `## ${pkg}\n\nIt isn't released yet, so the project can't have it from npm.`,
          );
          continue;
        }
        if (compareVersions(have, newestVersion) > 0) {
          parts.push(
            `## ${pkg}\n\nThe project has ${formatVersion(have)}, newer than ${newest}, the latest these docs know of. What they say may be out of date for it.`,
          );
          continue;
        }
        const after = data.changes.filter((change) => {
          const v = parseVersion(change.version);
          return change.package === pkg && v && compareVersions(v, have) > 0;
        });
        if (after.length === 0) {
          parts.push(
            `## ${pkg}\n\n${formatVersion(have)} is the latest release: the docs describe what the project has.`,
          );
          continue;
        }
        parts.push(
          `## ${pkg}: ${formatVersion(have)} to ${newest}\n\nWhat came after the project's version, newest first. What's added here isn't in the project's version, and what's changed works the old way there, until it updates.\n\n${after
            .map(
              (change) =>
                `### ${change.version}\n\n${demoted(change.markdown)}`,
            )
            .join("\n\n")}`,
        );
      }
      if (data.pending.length > 0) {
        parts.push(
          `## Not released yet\n\nThese are in the latest docs, but in no version on npm, so no project has them yet.\n\n${data.pending
            .map(
              (p) =>
                `### ${p.package}, in its next ${p.bump} release\n\n${demoted(p.markdown)}`,
            )
            .join("\n\n")}`,
        );
      }
      return parts.join("\n\n");
    },
  });

  return server;
}
