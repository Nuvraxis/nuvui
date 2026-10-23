import type { IncomingMessage } from "node:http";
import { FastMCP, UserError } from "fastmcp";
import { type Data, type Snapshots, site } from "./data";
import { createTools, ToolError } from "./tools";

export { tokensStartingWith } from "./tools";

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

  // A ToolError is the caller's to fix, and FastMCP sends a UserError's
  // words back as they are.
  for (const definition of createTools(data, options)) {
    server.addTool({
      name: definition.name,
      description: definition.description,
      parameters: definition.parameters,
      annotations: { title: definition.title, ...readOnly },
      execute: async (args) => {
        try {
          const text = definition.run(args);
          options.record?.(definition.name, "ok");
          return text;
        } catch (error) {
          if (error instanceof ToolError) {
            options.record?.(definition.name, "not_found");
            throw new UserError(error.message);
          }
          options.record?.(definition.name, "error");
          throw error;
        }
      },
    });
  }

  return server;
}
