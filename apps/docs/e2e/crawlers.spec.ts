import { expect, test } from "@playwright/test";
import { absoluteUrl } from "../lib/site";
import { docsPages } from "./helpers";

// The docs list their own pages. The website's sitemap index at /sitemap.xml
// points here, and robots.txt is the website's too: its tests have both.
test("the docs' sitemap lists every page and nothing internal", async ({
  request,
}) => {
  const response = await request.get("/docs/sitemap.xml");
  expect(response.ok()).toBe(true);
  const xml = await response.text();

  for (const path of docsPages) {
    expect(xml).toContain(`<loc>${absoluteUrl(path)}</loc>`);
  }
  expect(xml).not.toContain("rsc-smoke");
});
