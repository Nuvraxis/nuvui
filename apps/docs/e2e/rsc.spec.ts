import { expect, test } from "@playwright/test";
import { open } from "./helpers";

// app/rsc-smoke/page.tsx is a server component that uses the library
// directly. Building it at all is most of the test. This checks the result
// also hydrates and works.
test("components used from a server component hydrate and work", async ({
  page,
}) => {
  const problems: string[] = [];
  page.on("pageerror", (error) => problems.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") problems.push(message.text());
  });

  await open(page, "/rsc-smoke");

  await expect(
    page.getByRole("button", { name: "Rendered on the server" }),
  ).toHaveClass(/nuv-button--primary/);
  await expect(
    page.getByRole("link", { name: "A link rendered on the server" }),
  ).toHaveClass(/nuv-button--secondary/);
  await expect(
    page.getByRole("button", { name: "From the per-component entry" }),
  ).toHaveClass(/nuv-button--ghost/);

  await page.getByRole("button", { name: "Open the dialog" }).click();
  const dialog = page.getByRole("dialog", {
    name: "Opened from a server component",
  });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Close it" }).click();
  await expect(dialog).toBeHidden();

  const email = page.getByRole("textbox", { name: "Server email" });
  await expect(email).toHaveAttribute("required", "");
  await expect(email).toHaveAccessibleDescription("Described after hydration.");
  await page.getByLabel("Server select").selectOption("Two");
  await expect(page.getByLabel("Server select")).toHaveValue("Two");
  await expect(
    page.getByRole("group", { name: "Server group" }).getByRole("button"),
  ).toHaveCount(2);

  expect(problems).toEqual([]);
});

test("the check page is kept out of search engines", async ({ page }) => {
  await page.goto("/rsc-smoke");

  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    /noindex/,
  );
});
