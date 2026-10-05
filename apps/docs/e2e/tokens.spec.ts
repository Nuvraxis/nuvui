import { expect, type Page, test } from "@playwright/test";

// The docs app is the first real consumer of the package. These check that
// the CSS export resolves in a Next.js build with no loader config, and that
// what arrives in the browser still behaves after Next has processed it.
//
// Tokens are compared with each other rather than with literal values,
// because Next minifies the CSS and rewrites values along the way.

function rootStyle(page: Page, property: string) {
  return page.evaluate(
    (name) =>
      getComputedStyle(document.documentElement).getPropertyValue(name).trim(),
    property,
  );
}

test("the package stylesheet loads", async ({ page }) => {
  await page.goto("/");

  const white = await rootStyle(page, "--color-white");
  expect(white).not.toBe("");
  expect(await rootStyle(page, "--color-background")).toBe(white);
});

test("dark is opt-in, and data-theme=system follows the OS", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/");

  const white = await rootStyle(page, "--color-white");
  const gray = await rootStyle(page, "--color-gray-950");
  expect(gray).not.toBe("");

  // A dark OS on its own doesn't change anything.
  expect(await rootStyle(page, "--color-background")).toBe(white);

  await page.evaluate(() => {
    document.documentElement.dataset.theme = "system";
  });
  expect(await rootStyle(page, "--color-background")).toBe(gray);

  await page.emulateMedia({ colorScheme: "light" });
  expect(await rootStyle(page, "--color-background")).toBe(white);
});
