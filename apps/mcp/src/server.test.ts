import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { afterEach, describe, expect, test, vi } from "vitest";
import { createServer, type Outcome, tokensStartingWith } from "./server";
import { readSources } from "./sources";

const root = fileURLToPath(new URL("../../../", import.meta.url));
const data = readSources(root);

const clients: Client[] = [];
afterEach(async () => {
  await Promise.all(clients.splice(0).map((client) => client.close()));
});

// The server, and a client talking to it in the same process.
async function connect(record?: (tool: string, outcome: Outcome) => void) {
  const server = createServer(data, { record });
  const [clientTransport, serverTransport] =
    InMemoryTransport.createLinkedPair();
  const client = new Client({ name: "test", version: "0.0.0" });
  await Promise.all([
    server.connect(serverTransport),
    client.connect(clientTransport),
  ]);
  clients.push(client);
  return client;
}

async function call(
  client: Client,
  name: string,
  args: Record<string, unknown> = {},
) {
  const result = await client.callTool({ name, arguments: args });
  const content = result.content as { type: string; text: string }[];
  return {
    error: result.isError === true,
    text: content.map((part) => part.text).join(""),
  };
}

describe("the server", () => {
  test("says what it is and how to start", async () => {
    const client = await connect();

    expect(client.getServerVersion()).toMatchObject({
      name: "nuvui",
      version: data.version,
    });
    expect(client.getInstructions()).toContain("get_rules");
  });

  test("has ten tools, each one only reading", async () => {
    const { tools } = await (await connect()).listTools();

    expect(tools.map((tool) => tool.name).sort()).toEqual([
      "get_block",
      "get_chart",
      "get_page",
      "get_rules",
      "get_tokens",
      "list_blocks",
      "list_charts",
      "list_components",
      "list_guides",
      "search_docs",
    ]);
    for (const tool of tools) {
      expect(tool.description, tool.name).toMatch(/.{40,}/);
      expect(tool.annotations, tool.name).toMatchObject({
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: false,
      });
    }
  });

  // What an agent reads before it calls anything: each tool's name, title,
  // description and input schema. It builds its calls on what it last
  // read, so a change here changes every client, and nothing tells them.
  // tools.json is the list as it was last agreed. This fails until it's
  // written again on purpose, with `pnpm --filter @nuvui/mcp test -u`,
  // which puts the change in the pull request's diff. Some parameters
  // list the packages, rule topics, block categories and chart families,
  // so adding one of those changes it too.
  test("lists its tools exactly as tools.json has them", async () => {
    const { tools } = await (await connect()).listTools();
    const sorted = [...tools].sort((a, b) => a.name.localeCompare(b.name));

    await expect(`${JSON.stringify(sorted, null, 2)}\n`).toMatchFileSnapshot(
      "../tools.json",
    );
  });
});

describe("get_rules", () => {
  test("without a topic it's the skill's overview, and with one that rule", async () => {
    const client = await connect();

    expect((await call(client, "get_rules")).text).toBe(data.overview);
    expect((await call(client, "get_rules", { topic: "forms" })).text).toBe(
      data.rules.find((rule) => rule.topic === "forms")?.markdown,
    );
  });

  test("a topic that isn't one is refused before it's looked up", async () => {
    const client = await connect();

    await expect(call(client, "get_rules", { topic: "nope" })).rejects.toThrow(
      /topic/,
    );
  });
});

describe("get_page", () => {
  test("takes a page's id, a component's name, or its name in kebab case", async () => {
    const client = await connect();
    const page = data.pages.find((p) => p.id === "table/data-table");

    for (const query of [
      "table/data-table",
      "DataTable",
      "data-table",
      "data table",
    ]) {
      expect(
        (await call(client, "get_page", { page: query })).text,
        query,
      ).toBe(page?.markdown);
    }
  });

  test("a section gives that part of the page alone, whatever its case", async () => {
    const client = await connect();
    const { text } = await call(client, "get_page", {
      page: "compare",
      section: "props",
    });

    expect(text.startsWith("## Props")).toBe(true);
    expect(text).toContain("`beforeLabel`");
    expect(text).not.toContain("## CSS variables");
  });

  test("a page that isn't there is an error that says what might be meant", async () => {
    const client = await connect();
    const { error, text } = await call(client, "get_page", {
      page: "data tabel",
    });

    expect(error).toBe(true);
    expect(text).toContain('No page is called "data tabel"');
    expect(text).toContain("`table/data-table`");
  });

  test("a section that isn't there names the sections that are", async () => {
    const client = await connect();
    const { error, text } = await call(client, "get_page", {
      page: "compare",
      section: "Nope",
    });

    expect(error).toBe(true);
    expect(text).toContain("Props, ");
  });

  test("a path out of the reference is refused before it's looked up", async () => {
    const client = await connect();

    for (const page of [
      "../../etc/passwd",
      "..\\secrets",
      "",
      "a".repeat(101),
    ]) {
      await expect(call(client, "get_page", { page }), page).rejects.toThrow(
        /validation/,
      );
    }
  });
});

describe("the lists", () => {
  test("list_components has every component page, and a package's alone when asked", async () => {
    const client = await connect();
    const all = (await call(client, "list_components")).text;
    const table = (await call(client, "list_components", { package: "table" }))
      .text;

    expect(all).toContain("## @nuvui/react: components");
    expect(all).toContain("`components/compare`");
    expect(all).not.toContain("`theming`");
    expect(table).toBe(
      (await call(client, "list_components", { package: "@nuvui/table" })).text,
    );
    expect(table).toContain("`table/data-table`");
    expect(table).not.toContain("`components/compare`");
  });

  test("a package that isn't one is an error", async () => {
    const { error, text } = await call(await connect(), "list_components", {
      package: "tables",
    });

    expect(error).toBe(true);
    expect(text).toContain("@nuvui/table");
  });

  test("list_guides has the pages about no one component", async () => {
    const { text } = await call(await connect(), "list_guides");

    expect(text).toContain("`theming`");
    expect(text).toContain("`recipes`");
    expect(text).not.toContain("`components/");
  });

  test("search_docs names a page and a section for each result", async () => {
    const { text } = await call(await connect(), "search_docs", {
      query: "sortable table",
      limit: 2,
    });

    expect(text.match(/^### /gm)).toHaveLength(2);
    expect(text).toContain("get_page `table/sorting`");
  });

  test("search_docs with nothing to find says so", async () => {
    const { error, text } = await call(await connect(), "search_docs", {
      query: "zzzzqqqq",
    });

    expect(error).toBe(false);
    expect(text).toContain("Nothing in the docs matches");
  });
});

describe("blocks and charts", () => {
  test("list_blocks has every block, and a category's alone when asked", async () => {
    const client = await connect();
    const all = (await call(client, "list_blocks")).text;
    const marketing = (
      await call(client, "list_blocks", { category: "marketing" })
    ).text;

    for (const block of data.blocks) expect(all).toContain(`\`${block.name}\``);
    expect(marketing).toContain("`before-after`");
    expect(marketing).not.toContain("`sign-in`");
  });

  test("get_block has the command that adds it and every file in full", async () => {
    const { text } = await call(await connect(), "get_block", {
      name: "sign-in",
    });
    const block = data.blocks.find((b) => b.name === "sign-in");

    expect(text).toContain(
      "pnpm dlx shadcn@latest add https://nuvui.nuvraxis.com/r/sign-in.json",
    );
    for (const file of block?.files ?? []) {
      expect(text).toContain(`## ${file.name}`);
      expect(text).toContain(file.content.trim());
    }
  });

  test("a block that isn't there is an error", async () => {
    const { error } = await call(await connect(), "get_block", {
      name: "nope",
    });
    expect(error).toBe(true);
  });

  test("list_charts and get_chart give a chart's file by its id", async () => {
    const client = await connect();
    const bars = (await call(client, "list_charts", { family: "bar" })).text;
    const { text } = await call(client, "get_chart", { name: "bar/stacked" });
    const chart = data.charts.find(
      (c) => c.family === "bar" && c.name === "stacked",
    );

    expect(bars).toContain("`bar/stacked`");
    expect(bars).not.toContain("`line/");
    expect(text).toContain(chart?.source.trim());
  });
});

describe("get_tokens", () => {
  test("a prefix keeps those tokens, each under the rule it's set in", async () => {
    const { text } = await call(await connect(), "get_tokens", {
      prefix: "color-primary",
    });

    expect(text).toContain("--color-primary:");
    expect(text).toContain("[data-theme=dark]");
    expect(text).not.toContain("--color-background:");
  });

  test("rules left with nothing in them are taken out", () => {
    const css =
      "a {\n  --x-one: 1;\n}\nb {\n  --y: 2;\n}\n@media c {\n  d {\n    --y: 3;\n  }\n}";

    expect(tokensStartingWith(css, "--x")).toBe("a {\n  --x-one: 1;\n}");
  });

  test("a prefix nothing starts with is an error, and one with other characters is refused", async () => {
    const client = await connect();

    expect((await call(client, "get_tokens", { prefix: "nope-" })).error).toBe(
      true,
    );
    await expect(call(client, "get_tokens", { prefix: "}{" })).rejects.toThrow(
      /validation/,
    );
  });
});

describe("the counts", () => {
  test("each call is counted once, with how it ended", async () => {
    const record = vi.fn();
    const client = await connect(record);

    await call(client, "get_page", { page: "compare" });
    await call(client, "get_page", { page: "nope" });
    await call(client, "list_guides");

    expect(record.mock.calls).toEqual([
      ["get_page", "ok"],
      ["get_page", "not_found"],
      ["list_guides", "ok"],
    ]);
  });
});
