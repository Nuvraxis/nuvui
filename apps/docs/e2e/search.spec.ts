import { expect, test } from "@playwright/test";
import { open } from "./helpers";

test("Ctrl or Cmd+K opens search, and a result leads to its page", async ({
  page,
}) => {
  await open(page, "/docs");

  await page.keyboard.press("ControlOrMeta+k");
  const input = page.getByPlaceholder("Search");
  await expect(input).toBeFocused();

  await input.fill("Dialog");
  await page
    .getByRole("option", { name: /Dialog/ })
    .first()
    .click();

  await expect(page).toHaveURL(/\/docs\/components\/dialog/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Dialog");
});

test("search finds text inside a page, not only titles", async ({ page }) => {
  await open(page, "/docs");

  await page.keyboard.press("ControlOrMeta+k");
  await page.getByPlaceholder("Search").fill("data-theme");

  await expect(page.getByRole("option").first()).toBeVisible();
});

test("the search index is a file, not a server", async ({ request }) => {
  const response = await request.get("/docs/api/search");

  expect(response.ok()).toBe(true);
  // It parses as JSON, and it's big enough to hold real content.
  expect(JSON.stringify(await response.json()).length).toBeGreaterThan(1000);
});
