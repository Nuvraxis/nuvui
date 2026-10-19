import { createServer as createNetServer } from "node:net";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { createLimiter } from "./limit";
import { createServer } from "./server";
import { readSources } from "./sources";

const root = fileURLToPath(new URL("../../../", import.meta.url));

// A port nothing is listening on.
const freePort = () =>
  new Promise<number>((resolve, reject) => {
    const probe = createNetServer();
    probe.once("error", reject);
    probe.listen(0, () => {
      const address = probe.address();
      probe.close(() =>
        resolve(typeof address === "object" && address ? address.port : 0),
      );
    });
  });

let port = 0;
let server: ReturnType<typeof createServer>;

beforeAll(async () => {
  port = await freePort();
  server = createServer(readSources(root), {
    authenticate: createLimiter({ perMinute: 20, trustedProxies: 0 }),
  });
  await server.start({
    transportType: "httpStream",
    // An address and not "localhost", which can be the IPv6 one to the
    // server and the IPv4 one to fetch.
    httpStream: {
      port,
      host: "127.0.0.1",
      endpoint: "/mcp",
      stateless: true,
      cors: true,
    },
  });
});

afterAll(async () => {
  await server.stop();
});

const url = (path: string) => `http://127.0.0.1:${port}${path}`;

// The same request a client sends first, without a client.
const listTools = () =>
  fetch(url("/mcp"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
    },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list" }),
  });

describe("over HTTP", () => {
  test("a health check answers for a probe", async () => {
    const response = await fetch(url("/healthz"));

    expect(response.status).toBe(200);
    expect(await response.text()).toBe("ok");
  });

  test("a client connects at /mcp, lists the tools and calls one", async () => {
    const client = new Client({ name: "test", version: "0.0.0" });
    await client.connect(
      new StreamableHTTPClientTransport(new URL(url("/mcp"))),
    );

    const { tools } = await client.listTools();
    const result = await client.callTool({
      name: "get_page",
      arguments: { page: "compare", section: "Install" },
    });
    await client.close();

    expect(tools).toHaveLength(11);
    expect((result.content as { text: string }[])[0]?.text).toContain(
      "pnpm add @nuvui/react",
    );
  });

  test("a browser on another site may ask, since nothing it serves is private", async () => {
    const response = await fetch(url("/mcp"), {
      method: "OPTIONS",
      headers: {
        Origin: "https://example.com",
        "Access-Control-Request-Method": "POST",
      },
    });

    expect(response.status).toBe(204);
    expect(response.headers.get("access-control-allow-origin")).toBeTruthy();
  });

  // Last: it uses up this caller's minute.
  test("a caller who asks too often is refused with a 429 that says when to come back", async () => {
    const statuses: number[] = [];
    let refused: Response | undefined;
    for (let index = 0; index < 30; index += 1) {
      const response = await listTools();
      statuses.push(response.status);
      if (response.status === 429) refused ??= response;
      else await response.text();
    }

    expect(statuses).toContain(429);
    expect(
      statuses.slice(statuses.indexOf(429)).every((status) => status === 429),
    ).toBe(true);
    expect(Number(refused?.headers.get("retry-after"))).toBeGreaterThan(0);
  });
});
