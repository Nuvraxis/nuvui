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

  await open(page, "/docs/rsc-smoke");

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
  // A number, a trend and a timeline have no directive, and are written
  // on the server with a region and a direction of their own.
  await expect(page.getByTestId("server-number")).toHaveText(/^1\.234,50\s€$/);
  await expect(page.getByTestId("server-trend")).toHaveText("Down 25%");
  await expect(page.getByTestId("server-trend")).toHaveClass(/nuv-trend--good/);
  await expect(page.getByTestId("server-stat")).toHaveClass(/nuv-stat--card/);
  await expect(
    page
      .getByRole("list", { name: "Timeline from the server" })
      .getByRole("listitem"),
  ).toHaveText(/Rendered on the server/);
  // An item is a client component, and still knows it's in a list.
  await expect(
    page
      .getByRole("list", { name: "Items from the server" })
      .getByRole("listitem"),
  ).toHaveText("Row from the server");

  // Four client components, rendered from the server with plain props.
  const seats = page.getByRole("spinbutton", { name: "Seats from the server" });
  await expect(seats).toHaveValue("1.234,5");
  await seats.focus();
  await page.keyboard.press("ArrowUp");
  await expect(seats).toHaveValue("1.235,5");
  await expect(page.getByRole("img", { name: "2.5 out of 5" })).toBeVisible();
  const steps = page
    .getByRole("list", { name: "Steps from the server" })
    .getByRole("listitem");
  await expect(steps.nth(0)).toHaveText("First Completed");
  await expect(steps.nth(1)).toHaveAttribute("aria-current", "step");
  await expect(
    page.getByRole("checkbox", { name: "Card from the server" }),
  ).toBeChecked();

  await expect(page.getByTestId("server-holo")).toHaveText(
    "Card face from the server",
  );
  await expect(
    page.getByTestId("server-holo").locator(".nuv-holo-card__shine"),
  ).toHaveCount(1);

  // One with no "use client", and one given plain objects from the server.
  await expect(page.getByTestId("server-shimmer")).toHaveText(
    "Shimmer from the server",
  );
  await expect(page.getByTestId("server-shimmer")).toHaveClass(
    /nuv-text-shimmer--active/,
  );
  await expect(page.getByTestId("server-animated-number")).toHaveText(
    "1,234.5",
  );
  await expect(page.getByTestId("server-animated-number")).toHaveAttribute(
    "value",
    "1234.5",
  );
  await expect(page.getByTestId("server-reveal")).toHaveText(
    "Rises from the server",
  );
  const compare = page.getByTestId("server-compare");
  await expect(compare).toContainText("Before from the server");
  await expect(compare).toContainText("After from the server");
  await expect(
    compare.getByRole("slider", { name: "Before and after" }),
  ).toHaveAttribute("aria-valuenow", "30");
  const contents = page.getByRole("navigation", {
    name: "Contents from the server",
  });
  await expect(contents.getByRole("link")).toHaveText([
    "First heading",
    "Second heading",
  ]);
  await expect(
    contents.getByRole("link", { name: "Second heading" }),
  ).toHaveAttribute("href", "#server-second");

  const serverTree = page.getByRole("tree", { name: "Tree from the server" });
  await expect(
    serverTree.getByRole("treeitem", { name: "File from the server" }),
  ).toBeVisible();
  await expect(
    serverTree.getByRole("treeitem", { name: "Folder from the server" }),
  ).toHaveAttribute("aria-expanded", "true");

  const serverColor = page.getByRole("button", {
    name: "Color from the server",
  });
  await expect(serverColor).toHaveAccessibleDescription("#2563eb");
  await expect(page.locator('input[name="server-color"]')).toHaveValue(
    "#2563eb",
  );
  await serverColor.click();
  await page.getByRole("textbox", { name: "Hex color" }).fill("#16a34a");
  await page.keyboard.press("Enter");
  await expect(page.locator('input[name="server-color"]')).toHaveValue(
    "#16a34a",
  );
  await page.keyboard.press("Escape");

  const serverLog = page.getByRole("log", {
    name: "Conversation from the server",
  });
  await expect(serverLog).toContainText("You: Question from the server");
  await expect(serverLog).toContainText("Loader from the server");
  await expect(serverLog.locator('[aria-busy="true"]')).toHaveCount(1);
  const serverPrompt = page.getByRole("textbox", {
    name: "Prompt from the server",
  });
  await expect(serverPrompt).toHaveValue("Draft from the server");
  // It works once the page has taken over: with no handler, sending
  // empties the box and loads nothing.
  await serverPrompt.focus();
  await serverPrompt.fill("Typed in the browser");
  await page
    .locator("form")
    .filter({ has: serverPrompt })
    .getByRole("button", { name: "Send" })
    .click();
  await expect(serverPrompt).toHaveValue("");
  await expect(
    page
      .getByRole("group", { name: "Suggestions from the server" })
      .getByRole("button", { name: "Suggestion from the server" }),
  ).toBeVisible();

  // The later chat parts: what's drawn on the server is there, and what
  // opens does once the page has taken over.
  await expect(
    page
      .getByRole("list", { name: "Files from the server" })
      .getByRole("link", { name: "file-from-the-server.pdf" }),
  ).toBeVisible();
  const serverSources = page.getByRole("button", {
    name: "Sources from the server",
  });
  await expect(serverSources).toHaveAttribute("aria-expanded", "false");
  await serverSources.click();
  await expect(
    page.getByRole("link", { name: /Source from the server/ }),
  ).toContainText("example.com");
  const serverTool = page.getByRole("button", {
    name: "Tool from the server Done",
  });
  await serverTool.click();
  await expect(page.getByRole("group", { name: "Result" })).toHaveText(
    "Answered on the server",
  );
  await expect(
    page.getByRole("button", { name: "Reasoning from the server" }),
  ).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByText("Step from the server")).toBeVisible();
  // Markdown that was read on the server, and its block of code.
  await expect(
    page.locator(".nuv-markdown strong").filter({ hasText: "server" }),
  ).toBeVisible();
  const fenced = page
    .locator(".nuv-markdown .nuv-code-block")
    .filter({ hasText: 'const fenced = "on the server";' });
  await expect(fenced).toHaveAttribute("data-language", "ts");
  await expect(fenced.getByRole("button", { name: "Copy code" })).toBeVisible();
  await expect(page.getByRole("group", { name: "Code alone" })).toHaveText(
    "const alone = 1;",
  );

  const serverThreads = page.getByRole("grid", {
    name: "Threads from the server",
  });
  await expect(serverThreads.locator('[aria-selected="true"]')).toHaveText(
    "Thread from the server",
  );
  await serverThreads
    .getByRole("row", { name: "Another from the server" })
    .click();
  await expect(serverThreads.locator('[aria-selected="true"]')).toHaveText(
    "Another from the server",
  );

  // Neither of these two has any script of its own: what's checked is
  // that the server drew them whole.
  const serverBarcode = page.getByRole("img", {
    name: "Barcode from the server",
  });
  await expect(serverBarcode).toHaveAttribute("data-type", "ean13");
  await expect(serverBarcode.locator(".nuv-barcode__text")).toHaveText([
    "5",
    "901234",
    "123457",
  ]);
  const serverCode = page.getByRole("img", { name: "QR code from the server" });
  await expect(serverCode).toHaveAttribute("data-error-correction", "H");
  await expect(serverCode.locator(".nuv-qrcode__squares")).toHaveAttribute(
    "d",
    /^M4 4h7v1h-7z/,
  );
  await expect(serverCode.locator(".nuv-qrcode__cross-arms")).toHaveCount(1);

  const serverCarousel = page.getByRole("region", {
    name: "Carousel from the server",
  });
  await expect(
    serverCarousel.getByText("Slide from the server").first(),
  ).toBeVisible();
  await expect(
    serverCarousel.getByRole("button", { name: "Go to slide 1" }),
  ).toHaveAttribute("aria-current", "true");
  await serverCarousel.getByRole("button", { name: "Next slide" }).click();
  await expect(
    serverCarousel.getByRole("button", { name: "Go to slide 2" }),
  ).toHaveAttribute("aria-current", "true");

  const serverHandle = page.getByRole("separator", {
    name: "Handle from the server",
  });
  await expect(page.getByText("Panel from the server").first()).toBeVisible();
  await expect(serverHandle).toHaveAttribute("aria-valuenow", "40");
  await serverHandle.focus();
  await page.keyboard.press("ArrowRight");
  await expect(serverHandle).toHaveAttribute("aria-valuenow", "45");

  const serverList = page.getByRole("grid", { name: "List from the server" });
  await expect(serverList.getByRole("row")).toHaveCount(2);
  await serverList.getByText("Other row from the server").click();
  await expect(
    serverList.getByRole("row", { name: "Other row from the server" }),
  ).toHaveAttribute("aria-selected", "true");

  await expect(page.getByTestId("server-navbar")).toContainText(
    "Bar from the server",
  );
  await expect(
    page.getByTestId("server-navbar").locator('[aria-current="page"]'),
  ).toHaveText("First");

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
  await page.goto("/docs/rsc-smoke");

  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    /noindex/,
  );
});
