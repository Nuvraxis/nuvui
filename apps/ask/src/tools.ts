import { z } from "zod";
import {
  createTools,
  findPage,
  type Tool,
  ToolError,
} from "../../mcp/src/tools.ts";
import type { ToolSpec } from "./azure.ts";
import { type Data, type Source, urlOf } from "./pages.ts";

/** What a tool call came to. */
export interface ToolResult {
  /** What the model is given back. */
  text: string;
  outcome: "ok" | "not_found" | "invalid" | "error";
  /** The page it read, to link to under the answer. */
  source?: Source;
}

/** The MCP server's tools, for a model answering a visitor. */
export interface Toolbox {
  specs: ToolSpec[];
  /** What the panel says while a tool runs, such as "Reading Theming and tokens". */
  describe(name: string, args: string): string;
  run(name: string, args: string): ToolResult;
}

// A component's whole page can be 30,000 characters. Past this the model
// is told to ask for one section.
const maxChars = 16_000;

// The tools take the version in a project's package.json, which a coding
// agent has and a visitor doesn't. Left out, they answer for the latest.
function specOf(tool: Tool): ToolSpec {
  const {
    $schema: _,
    properties = {},
    required = [],
    ...rest
  } = z.toJSONSchema(tool.parameters, { io: "input" }) as {
    $schema?: string;
    properties?: Record<string, unknown>;
    required?: string[];
  };
  const { version: __, ...kept } = properties;
  return {
    type: "function",
    function: {
      name: tool.name,
      description: tool.description,
      parameters: {
        ...rest,
        properties: kept,
        required: required.filter((key) => key !== "version"),
      },
    },
  };
}

function argsOf(args: string): Record<string, unknown> | undefined {
  try {
    const value: unknown = JSON.parse(args || "{}");
    return typeof value === "object" && value !== null && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : undefined;
  } catch {
    return undefined;
  }
}

export function createToolbox(data: Data): Toolbox {
  const tools = createTools(data);
  const byName = new Map(tools.map((tool) => [tool.name, tool]));
  const pageFor = (query: unknown) =>
    typeof query === "string" && query.trim() !== ""
      ? findPage(data.pages, query)
      : undefined;

  return {
    specs: tools.map(specOf),

    describe(name, args) {
      const given = argsOf(args) ?? {};
      const said = (key: string) =>
        typeof given[key] === "string" ? given[key].slice(0, 80) : undefined;
      switch (name) {
        case "search_docs": {
          const query = said("query");
          return query
            ? `Searching the docs for "${query}"`
            : "Searching the docs";
        }
        case "get_page": {
          const page = pageFor(given.page);
          return page ? `Reading ${page.title}` : "Reading a page";
        }
        case "list_components":
          return "Looking through the components";
        case "list_guides":
          return "Looking through the guides";
        case "get_rules":
          return "Reading the rules for using nuvui";
        case "list_blocks":
          return "Looking through the blocks";
        case "get_block": {
          const block = said("name");
          return block ? `Reading the ${block} block` : "Reading a block";
        }
        case "list_charts":
          return "Looking through the charts";
        case "get_chart":
          return "Reading a chart";
        case "get_tokens":
          return "Reading the design tokens";
        case "get_changes":
          return "Reading what changed in each release";
        default:
          return "Looking it up";
      }
    },

    run(name, args) {
      const tool = byName.get(name);
      if (!tool) {
        return { text: `There's no tool called ${name}.`, outcome: "invalid" };
      }
      const given = argsOf(args);
      if (!given) {
        return {
          text: "The arguments weren't a JSON object.",
          outcome: "invalid",
        };
      }
      const parsed = tool.parameters.safeParse(given);
      if (!parsed.success) {
        return { text: z.prettifyError(parsed.error), outcome: "invalid" };
      }
      try {
        const whole = tool.run(parsed.data);
        const text =
          whole.length > maxChars
            ? `${whole.slice(0, maxChars)}\n\n[The rest is left out. Ask get_page for one section of the page.]`
            : whole;
        const page = name === "get_page" ? pageFor(given.page) : undefined;
        return {
          text,
          outcome: "ok",
          ...(page
            ? { source: { title: page.title, url: urlOf(page.id) } }
            : {}),
        };
      } catch (error) {
        if (error instanceof ToolError) {
          return { text: error.message, outcome: "not_found" };
        }
        return { text: "That tool failed. Try another.", outcome: "error" };
      }
    },
  };
}
