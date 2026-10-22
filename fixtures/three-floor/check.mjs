// Opens the built app in Chromium, which draws WebGL headless, and prints
// what each model did as JSON, once every one of them has loaded or failed.
import { chromium } from "playwright";
import { preview } from "vite";

const expected = ["glb", "gltf", "stl", "meshopt"];
const server = await preview({ logLevel: "silent", preview: { port: 4317 } });
const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(server.resolvedUrls?.local[0] ?? "http://localhost:4317/");
  await page.waitForFunction(
    (names) => names.every((name) => name in (window.results ?? {})),
    expected,
    { timeout: 60_000 },
  );
  const results = await page.evaluate(() => window.results);
  process.stdout.write(`${JSON.stringify({ ...results, errors })}\n`);
} finally {
  await browser.close();
  await server.close();
}
