import { expect, type Page, test } from "@playwright/test";
import { open, rootStyle } from "./helpers";

function previewButtonColor(page: Page) {
  return page
    .locator('[data-preview="button/basic"] .nuv-button')
    .evaluate((element) => getComputedStyle(element).backgroundColor);
}

test("the site follows the visitor's system theme", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await open(page, "/docs/components/button");

  const html = page.locator("html");
  await expect(html).toHaveAttribute("data-theme", "dark");
  await expect(html).toHaveClass(/dark/);
  expect(await rootStyle(page, "--color-background")).toBe(
    await rootStyle(page, "--color-gray-950"),
  );
});

test("the theme toggle switches the page and the components together", async ({
  page,
  isMobile,
}) => {
  await page.emulateMedia({ colorScheme: "light" });
  await open(page, "/docs/components/button");

  const html = page.locator("html");
  await expect(html).toHaveAttribute("data-theme", "light");
  const lightButton = await previewButtonColor(page);

  // On a phone the toggle is inside the navigation drawer.
  if (isMobile) {
    await page.getByRole("button", { name: "Open Sidebar" }).first().click();
  }
  await page.getByRole("button", { name: "Toggle Theme" }).first().click();

  // Fumadocs styles itself off the class. The library reads data-theme.
  await expect(html).toHaveClass(/dark/);
  await expect(html).toHaveAttribute("data-theme", "dark");
  expect(await previewButtonColor(page)).not.toBe(lightButton);
});
