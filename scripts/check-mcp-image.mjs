// Checks a running container of the MCP server's image, the one
// apps/mcp/Dockerfile builds: that it answers a probe, speaks MCP at /mcp,
// has its data, and refuses a caller who asks too often. It uses nothing
// but Node, so it runs before anything is installed.
//
//   docker run --rm --publish 8080:8080 --env RATE_LIMIT_PER_MINUTE=30 nuvui-mcp
//   node scripts/check-mcp-image.mjs http://localhost:8080 30
const [base = "http://localhost:8080", limit = "30"] = process.argv.slice(2);

const failures = [];
let checked = 0;

function check(what, ok, got) {
  checked += 1;
  if (!ok) failures.push(`${what}: got ${got}`);
}

async function waitUntilUp() {
  const deadline = Date.now() + 30_000;
  for (;;) {
    try {
      if ((await fetch(new URL("/healthz", base))).ok) return;
    } catch {
      // Not listening yet.
    }
    if (Date.now() > deadline) {
      console.error(`check-mcp-image: nothing answered at ${base}/healthz`);
      process.exit(1);
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
}

// One JSON-RPC request. The answer comes as JSON or as one server-sent
// event, as the client's Accept allows.
let id = 0;
async function rpc(method, params = {}) {
  id += 1;
  const response = await fetch(new URL("/mcp", base), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
    },
    body: JSON.stringify({ jsonrpc: "2.0", id, method, params }),
  });
  const text = await response.text();
  const json = (response.headers.get("content-type") ?? "").includes(
    "text/event-stream",
  )
    ? text
        .split("\n")
        .filter((line) => line.startsWith("data:"))
        .map((line) => line.slice(5).trim())
        .join("")
    : text;
  return {
    status: response.status,
    headers: response.headers,
    body: json ? JSON.parse(json) : null,
  };
}

await waitUntilUp();

const health = await fetch(new URL("/healthz", base));
check("/healthz status", health.status === 200, health.status);
check("/healthz body", (await health.text()) === "ok", "another body");

const init = await rpc("initialize", {
  protocolVersion: "2025-06-18",
  capabilities: {},
  clientInfo: { name: "check-mcp-image", version: "0.0.0" },
});
check("initialize status", init.status === 200, init.status);
check(
  "the server's name",
  init.body?.result?.serverInfo?.name === "nuvui",
  init.body?.result?.serverInfo?.name,
);
check(
  "its instructions",
  (init.body?.result?.instructions ?? "").includes("get_rules"),
  "none",
);

const list = await rpc("tools/list");
const tools = (list.body?.result?.tools ?? []).map((tool) => tool.name);
check("eleven tools", tools.length === 11, tools.join(", "));
check(
  "every tool only reads",
  (list.body?.result?.tools ?? []).every(
    (tool) => tool.annotations?.readOnlyHint === true,
  ),
  "a tool that doesn't say so",
);

// The data is in the image: a page, a block and the tokens.
const page = await rpc("tools/call", {
  name: "get_page",
  arguments: { page: "compare", section: "Install" },
});
check(
  "a page",
  page.body?.result?.content?.[0]?.text?.includes("pnpm add @nuvui/react"),
  JSON.stringify(page.body).slice(0, 200),
);
const block = await rpc("tools/call", {
  name: "get_block",
  arguments: { name: "sign-in" },
});
check(
  "a block",
  block.body?.result?.content?.[0]?.text?.includes("/r/sign-in.json"),
  JSON.stringify(block.body).slice(0, 200),
);
const missing = await rpc("tools/call", {
  name: "get_page",
  arguments: { page: "nope" },
});
check(
  "a page that isn't there",
  missing.body?.result?.isError === true,
  JSON.stringify(missing.body).slice(0, 200),
);
// The docs of earlier releases are in the image too, beside the data.
const older = await rpc("tools/call", {
  name: "get_page",
  arguments: { page: "compare", version: "0.6.0" },
});
check(
  "an earlier release's docs",
  older.body?.result?.content?.[0]?.text?.includes("came after 0.6.0"),
  JSON.stringify(older.body).slice(0, 200),
);

const other = await fetch(new URL("/nope", base));
check("/nope status", other.status === 404, other.status);

// Last, since it uses up this caller's minute.
let refused;
for (let index = 0; index <= Number(limit) && !refused; index += 1) {
  const answer = await rpc("tools/list");
  if (answer.status === 429) refused = answer;
}
check("a caller over the limit is refused", refused?.status === 429, "no 429");
check(
  "and told when to come back",
  Number(refused?.headers.get("retry-after")) > 0,
  refused?.headers.get("retry-after"),
);

if (failures.length > 0) {
  console.error(`check-mcp-image: ${failures.length} of ${checked} failed`);
  for (const failure of failures) console.error(`  ${failure}`);
  process.exit(1);
}
console.log(`check-mcp-image: ${checked} checks passed against ${base}`);
