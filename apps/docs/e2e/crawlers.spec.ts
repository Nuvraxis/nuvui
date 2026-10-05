import { expect, test } from "@playwright/test";
import { absoluteUrl } from "../lib/site";
import { docsPages } from "./helpers";

test("sitemap.xml lists every page and nothing internal", async ({
  request,
}) => {
  const response = await request.get("/sitemap.xml");
  expect(response.ok()).toBe(true);
  const xml = await response.text();

  for (const path of ["/", ...docsPages]) {
    expect(xml).toContain(`<loc>${absoluteUrl(path)}</loc>`);
  }
  expect(xml).not.toContain("rsc-smoke");
});

test("robots.txt allows crawling and points at the sitemap", async ({
  request,
}) => {
  const response = await request.get("/robots.txt");
  expect(response.ok()).toBe(true);
  const text = await response.text();

  expect(text).toContain("Allow: /");
  expect(text).toContain(`Sitemap: ${absoluteUrl("/sitemap.xml")}`);
});
