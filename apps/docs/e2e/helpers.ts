import { readdirSync } from "node:fs";
import path from "node:path";
import type { Page } from "@playwright/test";

// The pages are static HTML, so they're visible before React has attached
// its handlers. Tests that press keys or click straight away wait for that.
// The attribute is set by an effect in components/provider.tsx. A quiet
// network isn't enough to go on: WebKit goes quiet before it has finished
// running the scripts, and a value typed into a field then is thrown away
// when React takes the field over.
export async function open(page: Page, url: string) {
  await page.goto(url, { waitUntil: "networkidle" });
  await page.locator("html[data-hydrated]").waitFor();
}

export function rootStyle(page: Page, property: string) {
  return page.evaluate(
    (name) =>
      getComputedStyle(document.documentElement).getPropertyValue(name).trim(),
    property,
  );
}

// The red, green and blue a browser paints for a color, whatever notation
// it's written in. Next's CSS minifier rewrites the library's oklch() colors
// as lab(), so a computed style and a value from the theme generator can be
// the same color and still not the same text.
export function painted(page: Page, color: string) {
  return page.evaluate((value) => {
    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("2D canvas isn't available");
    context.fillStyle = value;
    context.fillRect(0, 0, 1, 1);
    return [...context.getImageData(0, 0, 1, 1).data].slice(0, 3);
  }, color);
}

// Whether two colors paint the same. A channel may round one step apart
// when the two were written in different notations.
export async function sameColor(page: Page, first: string, second: string) {
  const [a, b] = await Promise.all([
    painted(page, first),
    painted(page, second),
  ]);
  return a.every((channel, index) => Math.abs(channel - (b[index] ?? -9)) <= 1);
}

// Read from the content folder, so a new page is covered by the checks in
// pages.spec.ts without anyone remembering to list it.
function findDocsPages(dir: string, base: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (entry.isDirectory()) {
      return findDocsPages(path.join(dir, entry.name), `${base}/${entry.name}`);
    }
    if (!entry.name.endsWith(".mdx")) return [];
    const slug = entry.name.replace(/\.mdx$/, "");
    return [slug === "index" ? base : `${base}/${slug}`];
  });
}

export const docsPages = findDocsPages(
  path.join(import.meta.dirname, "..", "content", "docs"),
  "/docs",
).sort();
