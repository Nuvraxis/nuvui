import { expect, test } from "@playwright/test";
import { rootStyle } from "./helpers";

// The docs app is the first real consumer of the package. This checks that
// the CSS export resolves in a Next.js build with no loader config, and that
// the tokens survive Next's CSS processing.
//
// Tokens are compared with each other rather than with literal values,
// because Next minifies the CSS and rewrites values along the way.
test("the package stylesheet loads", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/");

  const white = await rootStyle(page, "--color-white");
  expect(white).not.toBe("");
  expect(await rootStyle(page, "--color-background")).toBe(white);
  expect(await rootStyle(page, "--color-primary")).toBe(
    await rootStyle(page, "--color-blue-600"),
  );
});
