// Serves an exported site the way a static host would: addresses without
// `.html`, and 404.html for anything that isn't there. The e2e tests of both
// apps run against it, and `pnpm start` uses it to look at a build.
//
//   node scripts/serve-static.mjs <port> <folder>
//   node scripts/serve-static.mjs <port> <folder> --under /docs
//
// With --under, the folder is served below that path and nowhere else. The
// docs app is built to live under /docs, and this is how it's looked at
// without the website around it.
//
// It replaces the `serve` package. That one keeps a file open for every
// request whose visitor leaves before the response is finished, and a test
// closes its page with files still on their way. On Windows a process can
// hold about eight thousand files, and the server stopped answering some
// three thousand tests into a run. This one reads a file whole and has
// closed it before the first byte is sent, so there's nothing to leave open.
import { readFile, stat } from "node:fs/promises";
import { createServer } from "node:http";
import {
  extname,
  join,
  normalize,
  resolve as resolvePath,
  sep,
} from "node:path";

const [portArg, folder, flag, under = ""] = process.argv.slice(2);
const port = Number(portArg);
const base = flag === "--under" ? under.replace(/\/+$/, "") : "";

if (!Number.isInteger(port) || !folder || (flag && flag !== "--under")) {
  console.error(
    "serve-static: usage: node scripts/serve-static.mjs <port> <folder> [--under /path]",
  );
  process.exit(1);
}

const root = resolvePath(folder);

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
  // Nothing outside the folder, however the address is written.
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

// The address inside the folder, or undefined for one that isn't under the
// base.
function inside(pathname) {
  if (!base) return pathname;
  if (pathname === base) return "/";
  return pathname.startsWith(`${base}/`)
    ? pathname.slice(base.length)
    : undefined;
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

    const local = inside(pathname);

    // One address per page: the `.html` name goes to the one without it.
    if (local?.endsWith(".html") && (await resolve(local))) {
      const clean = pathname.replace(/(?:\/index)?\.html$/, "") || "/";
      response.writeHead(301, { location: clean }).end();
      return;
    }

    const found = local === undefined ? undefined : await resolve(local);
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
    console.error(`serve-static: ${request.url}: ${error.message}`);
  }
});

server.on("error", (error) => {
  console.error(
    error.code === "EADDRINUSE"
      ? `serve-static: port ${port} is in use. Pass another.`
      : `serve-static: ${error.message}`,
  );
  process.exit(1);
});

if (!(await isFile(join(root, "index.html")))) {
  console.error(
    `serve-static: there's no build in ${folder}. Run pnpm build first.`,
  );
  process.exit(1);
}

server.listen(port, () => {
  console.log(`serve-static: http://localhost:${port}${base}`);
});
