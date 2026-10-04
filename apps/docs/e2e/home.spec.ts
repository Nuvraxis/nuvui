import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("home page has a title and exactly one h1", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle(/nuvui/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
});

test("home page has no axe violations", async ({ page }) => {
  await page.goto("/");

  const results = await new AxeBuilder({ page }).analyze();

  expect(results.violations).toEqual([]);
});
