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

  await expect(
    page
      .getByRole("navigation", { name: "Server breadcrumb" })
      .getByRole("link", { name: "Docs" }),
  ).toHaveClass(/nuv-breadcrumb__link/);
  const pages = page.getByRole("navigation", { name: "Server pagination" });
  await expect(pages.getByRole("link")).toHaveText(["1", "5", "9"]);
  await expect(pages.getByRole("link", { name: "Page 5" })).toHaveAttribute(
    "aria-current",
    "page",
  );

  await page.getByRole("button", { name: "Open the alert" }).click();
  const alert = page.getByRole("alertdialog", {
    name: "Asked from a server component",
  });
  await expect(alert.getByRole("button", { name: "Back out" })).toBeFocused();
  await alert.getByRole("button", { name: "Go ahead" }).click();
  await expect(alert).toBeHidden();

  await expect(
    page.getByRole("heading", { name: "Card from the server" }),
  ).toHaveClass(/nuv-card__title/);
  await expect(page.getByText("Server badge")).toHaveClass(
    /nuv-badge--success/,
  );
  await expect(
    page.getByRole("alert").filter({ hasText: "Alert from the server" }),
  ).toHaveClass(/nuv-alert--warning/);
  await expect(
    page.getByRole("heading", { name: "Empty from the server" }),
  ).toBeVisible();
  const ratio = await page.getByTestId("server-ratio").boundingBox();
  expect(ratio?.width).toBe(120);
  expect(ratio?.height).toBe(60);
  await expect(
    page.getByRole("status").filter({ hasText: "Server spinner" }),
  ).toBeVisible();
  await expect(
    page.getByRole("progressbar", { name: "Server progress" }),
  ).toHaveAttribute("aria-valuenow", "30");

  const combobox = page.getByRole("combobox", { name: "Server combobox" });
  await expect(combobox).toHaveText("Server apple");
  await combobox.click();
  await page.getByRole("option", { name: "Server pear" }).click();
  await expect(combobox).toHaveText("Server pear");
  await expect(page.locator('input[name="server-fruit"]')).toHaveValue(
    "Server pear",
  );

  await page.getByRole("combobox", { name: "Server commands" }).fill("zzz");
  await expect(
    page.getByRole("option", { name: "Server command" }),
  ).toBeHidden();

  const date = page.getByRole("textbox", { name: "Server date" });
  await expect(date).toHaveValue("10/15/2026");
  await date.fill("10/20/2026");
  await expect(page.locator('input[name="server-date"]')).toHaveValue(
    "2026-10-20",
  );
  await page
    .getByRole("group", { name: "Server range" })
    .getByRole("textbox", { name: "Start date" })
    .fill("10/01/2026");
  await expect(page.locator('input[name="server-from"]')).toHaveValue(
    "2026-10-01",
  );
  // The calendar was in the server's HTML, and its days work.
  const grid = page.getByRole("grid", { name: "October 2026" });
  await grid.getByRole("button", { name: /October 15th/ }).click();
  await expect(
    grid.getByRole("button", { name: /October 15th, 2026, selected/ }),
  ).toBeVisible();

  // The table was in the server's HTML. Its box only takes focus once the
  // browser has measured it and found it too narrow for the table.
  const box = page.getByRole("region", { name: "Server table" });
  await expect(box).toHaveAttribute("tabindex", "0");
  await expect(box.getByRole("rowheader", { name: "Team" })).toHaveAttribute(
    "scope",
    "row",
  );

  // On a wide screen the sidebar is in the page and the button collapses
  // it. On a phone the button opens it as a panel. Either way the button's
  // state changes, which it only does once the provider has hydrated.
  // Found by its class, because an open panel hides the page behind it,
  // this button included, from everything that goes by role.
  const toggle = page.locator(".nuv-sidebar__trigger");
  const before = (await toggle.getAttribute("aria-expanded")) ?? "";
  await toggle.click();
  await expect(toggle).not.toHaveAttribute("aria-expanded", before);
  const panel = page.getByRole("dialog", { name: "Server sidebar" });
  if (await panel.isVisible()) {
    await expect(
      panel.getByRole("link", { name: "Server page" }),
    ).toHaveAttribute("aria-current", "page");
    await page.keyboard.press("Escape");
    await expect(panel).toBeHidden();
  } else {
    await expect(
      page
        .getByRole("navigation", { name: "Server sidebar" })
        .getByRole("link", { name: "Server page" }),
    ).toHaveAttribute("aria-current", "page");
  }

  // The provider was rendered on the server, and the tabs inside it take
  // their direction from it: the left arrow goes forward.
  await page.getByRole("tab", { name: "One" }).focus();
  await page.keyboard.press("ArrowLeft", { delay: 30 });
  await expect(page.getByRole("tab", { name: "Two" })).toBeFocused();

  expect(problems).toEqual([]);
});

test("the check page is kept out of search engines", async ({ page }) => {
  await page.goto("/rsc-smoke");

  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    /noindex/,
  );
});
