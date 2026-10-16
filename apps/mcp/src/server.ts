import type { IncomingMessage } from "node:http";
import { FastMCP, UserError } from "fastmcp";
import { z } from "zod";
import { type Data, type Page, registryUrl, site } from "./data";
import { search, termsOf } from "./search";

/** How a call ended, for the counts. */
export type Outcome = "ok" | "not_found" | "error";

export interface ServerOptions {
  /** Called once for every tool call, with how it ended. */
  record?: (tool: string, outcome: Outcome) => void;
  /** Runs before each HTTP request, and throws a `Response` to refuse it. */
  authenticate?: (request: IncomingMessage) => Promise<Record<string, unknown>>;
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

const listLine = (id: string, title: string, description: string) =>
  `- \`${id}\` ${title}: ${description}`;

function closest<T>(
  items: readonly T[],
  query: string,
  key: (item: T) => string,
) {
  const terms = termsOf(query.replaceAll("/", " "));
  return items
    .filter((item) =>
      terms.some((term) => key(item).toLowerCase().includes(term)),
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

const instructions = `This server answers questions about nuvui, an open source React component library for business software (@nuvui/react and nine add-on packages). Everything here is read-only and public.

Before writing code with nuvui, call get_rules: it says what's different about the library and the rules that are easy to get wrong. Then find what you need with search_docs or list_components, and read its page with get_page before using it. A page has the component's parts, props, an example of each thing it does, its CSS variables and classes, and what it leaves to you for accessibility.

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
      "Start here. Without a topic: what to know before writing code with nuvui, the packages, the rules in a line each, and which component meets which need. With a topic: that rule in full, with wrong and right code.",
    parameters: z.object({
      topic: z
        .enum(ruleTopics as [string, ...string[]])
        .optional()
        .describe(`One of: ${ruleTopics.join(", ")}.`),
    }),
    run: ({ topic }) =>
      topic === undefined
        ? data.overview
        : (data.rules.find((rule) => rule.topic === topic)?.markdown ?? ""),
  });

  const packages = [
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
          `A package, such as @nuvui/table or table. One of: ${packages.join(", ")}.`,
        ),
    }),
    run: ({ package: wanted }) => {
      const full =
        wanted === undefined || wanted === ""
          ? undefined
          : wanted.startsWith("@nuvui/")
            ? wanted
            : `@nuvui/${wanted}`;
      if (full !== undefined && !packages.includes(full)) {
        notFound(
          "package",
          wanted ?? "",
          closest(packages, wanted ?? "", (p) => p),
          "list_components without a package",
        );
      }
      const groups = new Map<string, Page[]>();
      for (const page of data.pages) {
        if (page.package === null || (full && page.package !== full)) continue;
        groups.set(page.group, [...(groups.get(page.group) ?? []), page]);
      }
      return [...groups]
        .map(
          ([group, pages]) =>
            `## ${group}\n\n${pages.map((page) => listLine(page.id, page.title, page.description)).join("\n")}`,
        )
        .join("\n\n");
    },
  });

  tool({
    name: "list_guides",
    title: "List the guides",
    description:
      "The pages that aren't about one component: getting started, theming, Tailwind, SCSS, forms, right to left, translation, the Content Security Policy, support, and recipes for whole screens.",
    parameters: z.object({}),
    run: () =>
      data.pages
        .filter((page) => page.package === null)
        .map((page) => listLine(page.id, page.title, page.description))
        .join("\n"),
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
    }),
    run: ({ page: query, section }) => {
      const page = findPage(data.pages, query);
      if (!page) {
        notFound(
          "page",
          query,
          closest(data.pages, query, (p) => p.id),
          "list_components or list_guides",
        );
      }
      if (section === undefined || section === "") return page.markdown;
      const wanted = section.toLowerCase();
      const found = page.sections.find(
        (s) => s.heading.toLowerCase() === wanted,
      );
      if (!found) {
        throw new UserError(
          `"${page.title}" has no section called "${section}". Its sections: ${page.sections.map((s) => s.heading).join(", ")}.`,
        );
      }
      return found.markdown;
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
    }),
    run: ({ query, limit }) => {
      const hits = search(data.pages, query, limit);
      if (hits.length === 0) {
        return `Nothing in the docs matches "${query}". Try other words, or list_components.`;
      }
      return hits
        .map(
          (hit) =>
            `### ${hit.title}: ${hit.section}\n\nget_page \`${hit.page}\`, section \`${hit.section}\`\n\n${hit.snippet}`,
        )
        .join("\n\n");
    },
  });

  const categories = [...new Set(data.blocks.map((block) => block.category))];
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
        .describe(`One of: ${categories.join(", ")}.`),
    }),
    run: ({ category }) => {
      if (category && !categories.includes(category)) {
        notFound(
          "category",
          category,
          closest(categories, category, (c) => c),
          "list_blocks without a category",
        );
      }
      return categories
        .filter((c) => !category || c === category)
        .map(
          (c) =>
            `## ${c}\n\n${data.blocks
              .filter((block) => block.category === c)
              .map((block) =>
                listLine(block.name, block.title, block.description),
              )
              .join("\n")}`,
        )
        .join("\n\n");
    },
  });

  tool({
    name: "get_block",
    title: "Read a block",
    description:
      "A block's files in full, the packages they need, and the command that adds it to a project.",
    parameters: z.object({
      name: name.describe("A block's name from list_blocks, such as sign-in."),
    }),
    run: ({ name: query }) => {
      const wanted = kebab(query);
      const block = data.blocks.find((b) => b.name === wanted);
      if (!block) {
        notFound(
          "block",
          query,
          closest(data.blocks, query, (b) => b.name),
          "list_blocks",
        );
      }
      const fence = (file: string) => (file.endsWith(".scss") ? "scss" : "tsx");
      return [
        `# ${block.title}`,
        block.description,
        `To add it, with the packages it needs, from the project's root:\n\n\`\`\`sh\npnpm dlx shadcn@latest add ${registryUrl(block.name)}\n\`\`\``,
        `It needs: ${block.install.join(", ")}. It's a starting point: take its structure, and leave out what wasn't asked for.`,
        ...block.files.map(
          (file) =>
            `## ${file.name}\n\n\`\`\`${fence(file.name)}\n${file.content.trim()}\n\`\`\``,
        ),
      ].join("\n\n");
    },
  });

  const families = [...new Set(data.charts.map((chart) => chart.family))];
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
      return data.charts
        .filter((chart) => !family || chart.family === family)
        .map((chart) =>
          listLine(
            `${chart.family}/${chart.name}`,
            chart.title,
            chart.description,
          ),
        )
        .join("\n");
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
      return `# ${chart.familyTitle}: ${chart.title}\n\n${chart.description}\n\n\`\`\`tsx\n${chart.source.trim()}\n\`\`\``;
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
    }),
    run: ({ prefix }) => {
      if (!prefix) return `\`\`\`css\n${data.tokens}\n\`\`\``;
      const wanted = prefix.startsWith("--") ? prefix : `--${prefix}`;
      const kept = tokensStartingWith(data.tokens, wanted);
      if (kept === "") {
        throw new UserError(
          `No token starts with ${wanted}. Leave the prefix out to see them all.`,
        );
      }
      return `\`\`\`css\n${kept}\n\`\`\``;
    },
  });

  return server;
}
