import { readdirSync } from "node:fs";
import path from "node:path";
import type { Page } from "@playwright/test";

// The pages are static HTML, so they're visible before React has attached
// its handlers. Tests that press keys or click straight away wait for the
// scripts to finish loading first.
export async function open(page: Page, url: string) {
  await page.goto(url, { waitUntil: "networkidle" });
}

export function rootStyle(page: Page, property: string) {
  return page.evaluate(
    (name) =>
      getComputedStyle(document.documentElement).getPropertyValue(name).trim(),
    property,
  );
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
