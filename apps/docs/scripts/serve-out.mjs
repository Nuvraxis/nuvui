// Serves the exported site in `out` the way a static host would: addresses
// without `.html`, and 404.html for anything that isn't there. The e2e tests
// run against it, and `pnpm start` uses it to look at a build.
//
// It replaces the `serve` package. That one keeps a file open for every
// request whose visitor leaves before the response is finished, and a test
// closes its page with files still on their way. On Windows a process can
// hold about eight thousand files, and the server stopped answering some
// three thousand tests into a run. This one reads a file whole and has
// closed it before the first byte is sent, so there's nothing to leave open.
import { readFile, stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, join, normalize, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../out", import.meta.url));
const port = Number(process.argv[2] ?? process.env.PORT ?? 3000);

const types = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".woff2": "font/woff2",
  ".xml": "application/xml",
};

const isFile = async (path) => {
  try {
    return (await stat(path)).isFile();
  } catch {
    return false;
  }
};

// The file an address stands for, or undefined. `/docs/forms` is
// `docs/forms.html`, with or without a slash at the end, and `/` is
// `index.html`.
async function resolve(pathname) {
  const path = normalize(join(root, pathname));
  // Nothing outside `out`, however the address is written.
  if (path !== root && !path.startsWith(root + sep)) return undefined;

  const bare = pathname.endsWith("/") ? path.replace(/[\\/]+$/, "") : path;
  const candidates = [
    ...(pathname.endsWith("/") ? [] : [path]),
    `${bare}.html`,
    join(bare, "index.html"),
  ];
  for (const candidate of candidates) {
    if (await isFile(candidate)) return candidate;
  }
  return undefined;
}

const server = createServer(async (request, response) => {
  try {
    if (request.method !== "GET" && request.method !== "HEAD") {
      response.writeHead(405, { allow: "GET, HEAD" }).end();
      return;
    }

    let pathname;
    try {
      pathname = decodeURIComponent(
        new URL(request.url ?? "/", "http://localhost").pathname,
      );
    } catch {
      response.writeHead(400).end();
      return;
    }

    // One address per page: the `.html` name goes to the one without it.
    if (pathname.endsWith(".html") && (await resolve(pathname))) {
      const clean = pathname.replace(/(?:\/index)?\.html$/, "") || "/";
      response.writeHead(301, { location: clean }).end();
      return;
    }

    const found = await resolve(pathname);
    const file = found ?? join(root, "404.html");
    const body = await readFile(file);
    response.writeHead(found ? 200 : 404, {
      "content-type": types[extname(file)] ?? "application/octet-stream",
      "content-length": body.length,
      // A build's file names change when their contents do. Nothing else
      // here should outlive a rebuild.
      "cache-control": "no-cache",
    });
    response.end(request.method === "HEAD" ? undefined : body);
  } catch (error) {
    if (!response.headersSent) response.writeHead(500);
    response.end();
    console.error(`serve-out: ${request.url}: ${error.message}`);
  }
});

server.on("error", (error) => {
  console.error(
    error.code === "EADDRINUSE"
      ? `serve-out: port ${port} is in use. Pass another: node scripts/serve-out.mjs 3001`
      : `serve-out: ${error.message}`,
  );
  process.exit(1);
});

if (!(await isFile(join(root, "index.html")))) {
  console.error("serve-out: there's no build in out. Run pnpm build first.");
  process.exit(1);
}

server.listen(port, () => {
  console.log(`serve-out: http://localhost:${port}`);
});
