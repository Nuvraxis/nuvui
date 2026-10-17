// Times @nuvui/flow on generated diagrams in Chromium: the first draw, and
// the frames of a pan, a zoom and a drag. Run by hand, not in CI, where
// shared runners make times mean little. Write down the machine with the
// numbers.
//
//   pnpm --filter @nuvui/flow bench
//   pnpm --filter @nuvui/flow bench 1000 10000 50000
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const require = createRequire(import.meta.url);
// Vite comes with Vitest, which the package already uses for its tests.
const vite = await import(
  pathToFileURL(
    createRequire(require.resolve("vitest/package.json")).resolve("vite"),
  ).href
);
const { chromium } = await import("playwright");

const counts = process.argv.slice(2).map(Number).filter(Boolean);
const sizes = counts.length ? counts : [1000, 10000, 50000];
const outDir = path.join(root, "node_modules/.cache/flow-bench");

await vite.build({
  root: path.join(root, "scripts/bench"),
  base: "./",
  logLevel: "warn",
  build: {
    outDir,
    emptyOutDir: true,
    rollupOptions: {
      // The page is one bundle for the browser, where "use client" means
      // nothing.
      onLog(level, log, handler) {
        if (log.code === "MODULE_LEVEL_DIRECTIVE") return;
        handler(level, log);
      },
    },
  },
});

// Served over HTTP: a browser won't run a module from a file:// address.
const types = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
};
const server = createServer(async (request, response) => {
  const name = new URL(request.url ?? "/", "http://localhost").pathname;
  const file = path.join(outDir, name === "/" ? "index.html" : name);
  if (!file.startsWith(outDir)) return response.writeHead(403).end();
  try {
    const body = await readFile(file);
    response
      .writeHead(200, { "content-type": types[path.extname(file)] ?? "" })
      .end(body);
  } catch {
    response.writeHead(404).end();
  }
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const address = server.address();

const summary = (frames) => {
  const sorted = [...frames].sort((a, b) => a - b);
  const at = (q) =>
    sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))];
  return {
    median: at(0.5).toFixed(1),
    p95: at(0.95).toFixed(1),
    max: sorted[sorted.length - 1].toFixed(1),
  };
};

// Runs in the page: sends pointer events to the diagram once a frame along
// a path, and returns how long each frame took.
function gesture({ from, to, frames }) {
  const canvas = document.querySelector(".nuv-flow__canvas");
  const send = (type, x, y) =>
    canvas.dispatchEvent(
      new PointerEvent(type, {
        bubbles: true,
        clientX: x,
        clientY: y,
        pointerId: 1,
        pointerType: "mouse",
        button: 0,
        buttons: type === "pointerup" ? 0 : 1,
      }),
    );
  return new Promise((resolve) => {
    const times = [];
    let last = performance.now();
    let i = 0;
    send("pointerdown", from.x, from.y);
    const step = () => {
      const now = performance.now();
      if (i > 0) times.push(now - last);
      last = now;
      i++;
      const t = i / frames;
      send(
        "pointermove",
        from.x + (to.x - from.x) * t,
        from.y + (to.y - from.y) * t,
      );
      if (i < frames) requestAnimationFrame(step);
      else {
        send("pointerup", to.x, to.y);
        resolve(times);
      }
    };
    requestAnimationFrame(step);
  });
}

// Runs in the page: zooms in and out once a frame.
function zooming({ frames }) {
  const { handle } = window.bench;
  return new Promise((resolve) => {
    const times = [];
    let last = performance.now();
    let i = 0;
    const step = () => {
      const now = performance.now();
      if (i > 0) times.push(now - last);
      last = now;
      if (Math.floor(i / 15) % 2 === 0) handle.current.zoomIn();
      else handle.current.zoomOut();
      i++;
      if (i < frames) requestAnimationFrame(step);
      else resolve(times);
    };
    requestAnimationFrame(step);
  });
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const url = `http://127.0.0.1:${address.port}/index.html`;

console.log(
  `${os.cpus()[0]?.model ?? "unknown CPU"}, ${os.cpus().length} threads, ${os.platform()} ${os.release()}, Chromium ${browser.version()}`,
);
for (const count of sizes) {
  await page.goto(`${url}?nodes=${count}`);
  await page.waitForFunction(() => typeof window.drawn === "number", null, {
    timeout: 120_000,
  });
  const drawn = await page.evaluate(() => window.drawn);
  const box = await page.locator(".nuv-flow__canvas").boundingBox();
  const middle = { x: box.x + box.width / 2, y: box.y + box.height / 2 };

  // Fitted, then a pan across.
  const panFar = await page.evaluate(gesture, {
    from: { x: middle.x - 200, y: middle.y },
    to: { x: middle.x + 200, y: middle.y + 100 },
    frames: 120,
  });
  const zoom = await page.evaluate(zooming, { frames: 120 });

  // Up close, where every node is drawn with its words: a pan, then a drag.
  await page.evaluate(() => {
    const { handle } = window.bench;
    handle.current.center("n0");
    for (let i = 0; i < 40; i++) handle.current.zoomIn();
    handle.current.center(`n${Math.floor(window.bench.count / 2)}`);
  });
  await page.waitForTimeout(300);
  const panNear = await page.evaluate(gesture, {
    from: { x: middle.x + 300, y: middle.y + 200 },
    to: { x: middle.x - 100, y: middle.y - 100 },
    frames: 120,
  });
  await page.waitForTimeout(300);
  const node = await page.evaluate(() => {
    const element = document.querySelector(".nuv-flow__node");
    const rect = element?.getBoundingClientRect();
    return rect
      ? { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 }
      : null;
  });
  const drag = node
    ? await page.evaluate(gesture, {
        from: node,
        to: { x: node.x + 150, y: node.y + 80 },
        frames: 120,
      })
    : [];
  const elements = await page.evaluate(
    () => document.querySelectorAll(".nuv-flow__svg *").length,
  );

  const line = (name, frames) => {
    const s = summary(frames);
    return `${name} frames ${s.median} / ${s.p95} / ${s.max} ms`;
  };
  console.log(`\n${count.toLocaleString("en")} nodes`);
  console.log(`  first draw ${drawn.toFixed(0)} ms`);
  console.log(`  ${line("pan, fitted:", panFar)}  (median / 95th / worst)`);
  console.log(`  ${line("zoom in and out:", zoom)}`);
  console.log(`  ${line("pan, up close:", panNear)}`);
  if (drag.length) console.log(`  ${line("drag a node:", drag)}`);
  console.log(`  elements in the drawing up close: ${elements}`);
}
await browser.close();
server.close();
