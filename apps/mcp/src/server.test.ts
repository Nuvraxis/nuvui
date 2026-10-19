import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { afterEach, describe, expect, test, vi } from "vitest";
import type { Data, Docs, Snapshots } from "./data";
import { createServer, type Outcome, tokensStartingWith } from "./server";
import { readSources } from "./sources";

const root = fileURLToPath(new URL("../../../", import.meta.url));
const data = readSources(root);

// An older release for the tests, made from the docs as they are, without
// what came in the latest one. The real ones in versions/ are checked in
// data.test.ts.
const older: Docs = {
  version: "0.6.0",
  packages: { ...data.packages, "@nuvui/react": "0.6.0" },
  overview: data.overview,
  rules: data.rules,
  pages: data.pages.filter((page) => page.id !== "components/compare"),
  blocks: data.blocks.filter((block) => block.name !== "before-after"),
  tokens: data.tokens.replace(/^.*--color-primary.*$/gm, ""),
};
const snapshots: Snapshots = {
  lines: ["0.6"],
  load: (line) => (line === "0.6" ? older : undefined),
};

// What the server answers after the line that says which versions.
const body = (text: string) => text.replace(/^> .*\n\n/, "");
const first = (text: string) => text.split("\n")[0];

const clients: Client[] = [];
afterEach(async () => {
  await Promise.all(clients.splice(0).map((client) => client.close()));
});

// The server, and a client talking to it in the same process.
async function connect(
  record?: (tool: string, outcome: Outcome) => void,
  served: Data = data,
) {
  const server = createServer(served, { record, snapshots });
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

  test("has eleven tools, each one only reading", async () => {
    const { tools } = await (await connect()).listTools();

    expect(tools.map((tool) => tool.name).sort()).toEqual([
      "get_block",
      "get_changes",
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

    const overview = (await call(client, "get_rules")).text;
    expect(overview.endsWith(data.overview)).toBe(true);
    expect(
      body((await call(client, "get_rules", { topic: "forms" })).text),
    ).toBe(data.rules.find((rule) => rule.topic === "forms")?.markdown);
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
        body((await call(client, "get_page", { page: query })).text),
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

    expect(body(text).startsWith("## Props")).toBe(true);
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

describe("versions", () => {
  const react = `@nuvui/react ${data.version}`;

  test("every answer starts with the versions it describes", async () => {
    const client = await connect();
    const answers = [
      await call(client, "get_rules"),
      await call(client, "get_rules", { topic: "forms" }),
      await call(client, "list_components"),
      await call(client, "list_guides"),
      await call(client, "get_page", { page: "compare" }),
      await call(client, "search_docs", { query: "sortable table" }),
      await call(client, "list_blocks"),
      await call(client, "get_block", { name: "sign-in" }),
      await call(client, "get_tokens", { prefix: "radius-" }),
      await call(client, "list_charts"),
      await call(client, "get_chart", { name: "bar/stacked" }),
    ];

    for (const { text } of answers) {
      expect(text.startsWith("> ")).toBe(true);
      expect(first(text)).toContain(react);
    }
  });

  test("an add-on's page names the add-on's version too", async () => {
    const { text } = await call(await connect(), "get_page", {
      page: "table/data-table",
    });

    expect(first(text)).toContain(
      `@nuvui/table ${data.packages["@nuvui/table"]} and ${react}`,
    );
  });

  test("get_rules lists every package's version before the overview", async () => {
    const { text } = await call(await connect(), "get_rules");

    expect(body(text).startsWith("## Versions")).toBe(true);
    for (const [pkg, version] of Object.entries(data.packages)) {
      expect(text).toContain(
        version === "0.0.0"
          ? `- ${pkg}: not released yet`
          : `- ${pkg} ${version}`,
      );
    }
  });

  test("a package that isn't on npm yet, or has changes waiting, says so", async () => {
    const served: Data = {
      ...data,
      packages: { ...data.packages, "@nuvui/table": "0.0.0" },
      pending: [
        {
          package: "@nuvui/react",
          bump: "minor",
          markdown: "- Something new.",
        },
      ],
    };
    const client = await connect(undefined, served);
    const table = await call(client, "get_page", { page: "table/data-table" });
    const compare = await call(client, "get_page", { page: "compare" });

    expect(first(table.text)).toContain("@nuvui/table isn't on npm yet");
    expect(first(compare.text)).toContain(
      "Some of what's here is in no release yet",
    );
  });

  test("a version that's kept is answered from its own docs", async () => {
    const client = await connect();

    for (const version of ["0.6.0", "^0.6.2", "~0.6", "0.6"]) {
      const { text } = await call(client, "list_components", { version });
      expect(first(text), version).toContain(
        "@nuvui/react 0.6.0, the release asked for",
      );
      expect(text, version).not.toContain("`components/compare`");
    }
  });

  test("a page or a block that came later says so, and isn't answered from the latest", async () => {
    const client = await connect();
    const page = await call(client, "get_page", {
      page: "compare",
      version: "0.6.0",
    });
    const block = await call(client, "get_block", {
      name: "before-after",
      version: "0.6.0",
    });

    expect(page.error).toBe(true);
    expect(page.text).toContain("`components/compare` is in the latest docs");
    expect(page.text).toContain("came after 0.6.0");
    expect(block.error).toBe(true);
    expect(block.text).toContain("`before-after` is in the latest docs");
  });

  test("an older release's block says to copy its files, since the registry has the latest", async () => {
    const { text } = await call(await connect(), "get_block", {
      name: "sign-in",
      version: "0.6.0",
    });

    expect(text).toContain("Copy the files below");
  });

  test("a token that came later says so", async () => {
    const { error, text } = await call(await connect(), "get_tokens", {
      prefix: "color-primary",
      version: "0.6.0",
    });

    expect(error).toBe(true);
    expect(text).toContain("they came after 0.6.0");
  });

  test("a version older than any kept is answered from the latest, with a warning first", async () => {
    const { error, text } = await call(await connect(), "get_page", {
      page: "compare",
      version: "0.4.1",
    });

    expect(error).toBe(false);
    expect(first(text)).toContain(
      "There are no docs here for @nuvui/react 0.4: the oldest kept is 0.6.",
    );
    expect(first(text)).toContain("get_changes");
    expect(body(text)).toBe(
      data.pages.find((page) => page.id === "components/compare")?.markdown,
    );
  });

  test("a version newer than the latest says the docs may be behind", async () => {
    const { text } = await call(await connect(), "get_page", {
      page: "compare",
      version: "99.0.0",
    });

    expect(first(text)).toContain(
      "There are no docs here for @nuvui/react 99.0 yet",
    );
  });

  test("the latest release's own line is the latest docs when it isn't kept", async () => {
    const [major, minor] = data.version.split(".");
    const { text } = await call(await connect(), "get_page", {
      page: "compare",
      version: `^${major}.${minor}.0`,
    });

    expect(first(text)).toContain("the latest release");
  });

  test("a version that isn't one is refused before it's looked up", async () => {
    const client = await connect();

    for (const version of [
      "latest",
      "workspace:*",
      "1.2.3.4",
      "a".repeat(41),
    ]) {
      await expect(
        call(client, "get_page", { page: "compare", version }),
        version,
      ).rejects.toThrow(/validation/);
    }
  });
});

describe("get_changes", () => {
  const served: Data = {
    ...data,
    version: "0.7.0",
    packages: {
      ...data.packages,
      "@nuvui/react": "0.7.0",
      "@nuvui/table": "0.1.7",
      "@nuvui/media": "0.0.0",
    },
    changes: [
      {
        package: "@nuvui/react",
        version: "0.7.0",
        markdown: "### Minor Changes\n\n- Seven.",
      },
      {
        package: "@nuvui/react",
        version: "0.6.1",
        markdown: "- Six and a bit.",
      },
      { package: "@nuvui/react", version: "0.6.0", markdown: "- Six." },
      { package: "@nuvui/table", version: "0.1.7", markdown: "- Table seven." },
    ],
    pending: [
      { package: "@nuvui/media", bump: "minor", markdown: "- A new package." },
    ],
  };

  test("without versions it lists the latest of each, and what isn't released", async () => {
    const { text } = await call(
      await connect(undefined, served),
      "get_changes",
    );

    expect(text).toContain("- @nuvui/react 0.7.0");
    expect(text).toContain("- @nuvui/media: not released yet");
    expect(text).toContain("Pass `installed`");
    expect(text).toContain("### @nuvui/media, in its next minor release");
  });

  test("with a project's versions it gives what came after each, newest first", async () => {
    const { text } = await call(
      await connect(undefined, served),
      "get_changes",
      { installed: { "@nuvui/react": "^0.6.0", "@nuvui/table": "0.1.7" } },
    );

    expect(text).toContain("## @nuvui/react: 0.6.0 to 0.7.0");
    expect(text.indexOf("### 0.7.0")).toBeLessThan(text.indexOf("### 0.6.1"));
    expect(text).not.toContain("- Six.\n");
    expect(text).toContain("#### Minor Changes");
    expect(text).toContain("0.1.7 is the latest release");
    expect(text).not.toContain("Table seven");
  });

  test("a version newer than the docs know, and a package not on npm, are said plainly", async () => {
    const { text } = await call(
      await connect(undefined, served),
      "get_changes",
      { installed: { "@nuvui/react": "0.9.0", "@nuvui/media": "0.1.0" } },
    );

    expect(text).toContain("newer than 0.7.0");
    expect(text).toContain("## @nuvui/media\n\nIt isn't released yet");
  });

  test("a version that isn't one is refused", async () => {
    await expect(
      call(await connect(), "get_changes", {
        installed: { "@nuvui/react": "latest" },
      }),
    ).rejects.toThrow(/validation/);
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
