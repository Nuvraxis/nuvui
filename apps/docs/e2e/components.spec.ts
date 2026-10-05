import { expect, test } from "@playwright/test";
import { open } from "./helpers";

test.describe("button page", () => {
  test.beforeEach(async ({ page }) => {
    await open(page, "/docs/components/button");
  });

  test("the library's styles win over Tailwind's reset", async ({ page }) => {
    const style = await page
      .locator('[data-preview="button/basic"] .nuv-button')
      .evaluate((element) => {
        const computed = getComputedStyle(element);
        return {
          background: computed.backgroundColor,
          radius: computed.borderRadius,
        };
      });

    // Tailwind's preflight makes every button transparent with square
    // corners. Seeing neither means the layer order in global.css held.
    expect(style.background).not.toBe("rgba(0, 0, 0, 0)");
    expect(style.radius).toBe("6px");
  });

  test("the copy button copies the example's source", async ({ page }) => {
    await page
      .locator('[data-preview="button/basic"]')
      .getByRole("button", { name: "Copy Text" })
      .click();

    const copied = await page.evaluate(() => navigator.clipboard.readText());
    expect(copied).toContain('import { Button } from "@nuvui/react";');
    expect(copied).toContain("<Button>Save changes</Button>");
  });

  test("the playground changes the button and the code together", async ({
    page,
  }) => {
    const playground = page.locator("[data-playground]");
    const button = playground.locator(".nuv-button");

    await playground.getByLabel("intent").selectOption("danger");
    await playground.getByLabel("size").selectOption("lg");
    await playground.getByLabel("children").fill("Delete account");

    await expect(button).toHaveClass(/nuv-button--danger/);
    await expect(button).toHaveClass(/nuv-button--lg/);
    await expect(button).toHaveText("Delete account");
    await expect(playground.locator("pre")).toHaveText(
      '<Button intent="danger" size="lg">Delete account</Button>',
    );

    await playground.getByLabel("disabled").check();
    await expect(button).toBeDisabled();
  });

  test("the props table is built from the component's types", async ({
    page,
  }) => {
    // Each prop is a row that expands. On a phone the type is only shown
    // once it has.
    await page.getByRole("button", { name: /^intent/ }).click();

    await expect(
      page
        .getByText('"danger" | "ghost" | "primary" | "secondary"')
        .filter({ visible: true })
        .first(),
    ).toBeVisible();
    await expect(page.getByText("How much visual weight")).toBeVisible();
    await expect(page.getByRole("button", { name: /^asChild/ })).toBeVisible();
  });

  test("the reference tables list what's in the CSS", async ({ page }) => {
    await expect(
      page.getByRole("rowheader", { name: "--nuv-button-radius" }),
    ).toBeVisible();
    await expect(
      page.getByRole("rowheader", { name: ".nuv-button--danger" }),
    ).toBeVisible();
  });
});

test.describe("dialog page", () => {
  test.beforeEach(async ({ page }) => {
    await open(page, "/docs/components/dialog");
  });

  test("the example opens and closes with the keyboard", async ({ page }) => {
    const trigger = page
      .locator('[data-preview="dialog/basic"]')
      .getByRole("button", { name: "Delete project" });

    await trigger.focus();
    await page.keyboard.press("Enter");

    const dialog = page.getByRole("dialog", { name: "Delete this project?" });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("button", { name: "Cancel" })).toBeFocused();

    await page.keyboard.press("Escape");

    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test("the dialog is a sheet on a phone and centered on a desktop", async ({
    page,
    isMobile,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page
      .locator('[data-preview="dialog/basic"]')
      .getByRole("button", { name: "Delete project" })
      .click();

    const box = await page.getByRole("dialog").boundingBox();
    const viewport = page.viewportSize();
    if (!box || !viewport) throw new Error("nothing to measure");

    if (isMobile) {
      expect(box.x).toBe(0);
      expect(box.width).toBe(viewport.width);
      expect(Math.round(box.y + box.height)).toBe(viewport.height);
    } else {
      expect(box.x).toBeGreaterThan(0);
      expect(box.width).toBe(512);
    }
  });

  test("the controlled example closes itself once the save is done", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "Rename project" }).click();
    const dialog = page.getByRole("dialog", { name: "Rename project" });
    await expect(dialog).toBeVisible();

    await dialog.getByRole("button", { name: "Save" }).click();

    await expect(dialog).toBeHidden();
  });
});

test.describe("checkbox page", () => {
  test.beforeEach(async ({ page }) => {
    await open(page, "/docs/components/checkbox");
  });

  test("a click on the label checks the box", async ({ page }) => {
    const preview = page.locator('[data-preview="checkbox/basic"]');
    const checkbox = preview.getByRole("checkbox", {
      name: "I accept the terms",
    });

    // The code under the preview holds the same text, so go by element.
    await preview.locator("label").click();

    await expect(checkbox).toBeChecked();
  });

  test("select all is mixed while only some files are selected", async ({
    page,
  }) => {
    const preview = page.locator('[data-preview="checkbox/select-all"]');
    const all = preview.getByRole("checkbox", { name: "Select all" });

    await expect(all).toHaveAttribute("aria-checked", "mixed");

    await all.click();
    await expect(all).toHaveAttribute("aria-checked", "true");
    await expect(preview.getByRole("checkbox", { checked: true })).toHaveCount(
      4,
    );

    await preview.getByRole("checkbox", { name: "notes.txt" }).click();
    await expect(all).toHaveAttribute("aria-checked", "mixed");
  });

  test("the playground sets the state and the code together", async ({
    page,
  }) => {
    const playground = page.locator("[data-playground]");

    await playground.getByLabel("checked").selectOption("indeterminate");

    await expect(playground.locator(".nuv-checkbox")).toHaveAttribute(
      "aria-checked",
      "mixed",
    );
    await expect(playground.locator("pre")).toContainText(
      'checked="indeterminate"',
    );
  });

  test("the props table only lists the props picked for it", async ({
    page,
  }) => {
    await expect(
      page.getByRole("button", { name: /^onCheckedChange/ }),
    ).toBeVisible();
    // A button takes dozens of DOM props. None of them belong here.
    await expect(page.getByRole("button", { name: /^onClick/ })).toHaveCount(0);
  });
});

test.describe("switch page", () => {
  test.beforeEach(async ({ page }) => {
    await open(page, "/docs/components/switch");
  });

  test("the example flips with a click and with the keyboard", async ({
    page,
  }) => {
    const control = page
      .locator('[data-preview="switch/basic"]')
      .getByRole("switch", { name: "Email me product updates" });

    await control.click();
    await expect(control).toBeChecked();

    await page.keyboard.press("Space");
    await expect(control).not.toBeChecked();
  });

  test("the track is wider on a phone than with a mouse", async ({
    page,
    isMobile,
  }) => {
    const box = await page
      .locator('[data-preview="switch/basic"] .nuv-switch')
      .boundingBox();

    expect(box?.width).toBe(isMobile ? 44 : 36);
    expect(box?.height).toBe(isMobile ? 24 : 20);
  });
});

test.describe("tabs page", () => {
  test.beforeEach(async ({ page }) => {
    await open(page, "/docs/components/tabs");
  });

  test("the arrow keys move between tabs and change the panel", async ({
    page,
  }) => {
    const preview = page.locator('[data-preview="tabs/basic"]');
    const panel = preview.getByRole("tabpanel");

    await preview.getByRole("tab", { name: "Account" }).focus();
    await page.keyboard.press("ArrowRight");

    await expect(preview.getByRole("tab", { name: "Team" })).toBeFocused();
    await expect(panel).toHaveText("The people who can see this project.");
    await expect(panel).toHaveAccessibleName("Team");
  });

  test("the playground switches to a vertical list", async ({ page }) => {
    const playground = page.locator("[data-playground]");

    await playground.getByLabel("orientation").selectOption("vertical");

    await expect(playground.getByRole("tablist")).toHaveAttribute(
      "aria-orientation",
      "vertical",
    );
    await expect(playground.locator("pre")).toContainText(
      'orientation="vertical"',
    );
  });
});

test.describe("accordion page", () => {
  test.beforeEach(async ({ page }) => {
    await open(page, "/docs/components/accordion");
  });

  test("an item opens and closes, and only one is open at a time", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    // The code block under each preview is a region too, so look inside the
    // accordion itself.
    const preview = page.locator(
      '[data-preview="accordion/basic"] .nuv-accordion',
    );
    const shipping = preview.getByRole("button", {
      name: "How long does shipping take?",
    });

    await shipping.click();
    await expect(preview.getByRole("region")).toContainText(
      "within two working days",
    );

    await preview
      .getByRole("button", { name: "Can I send something back?" })
      .click();
    await expect(preview.getByRole("region")).toHaveCount(1);
    await expect(preview.getByRole("region")).toContainText("within 30 days");
    await expect(shipping).toHaveAttribute("aria-expanded", "false");
  });

  test("the playground changes the heading level", async ({ page }) => {
    const playground = page.locator("[data-playground]");

    await expect(playground.getByRole("heading", { level: 3 })).toHaveCount(3);
    await playground.getByLabel("headingLevel").selectOption("2");

    await expect(playground.getByRole("heading", { level: 2 })).toHaveCount(3);
    await expect(playground.locator("pre")).toContainText("headingLevel={2}");
  });

  test("the playground lets several items open with type multiple", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    const playground = page.locator("[data-playground]");

    await playground.getByLabel("type").selectOption("multiple");
    await playground
      .getByRole("button", { name: "How long does shipping take?" })
      .click();
    await playground
      .getByRole("button", { name: "Is there a warranty?" })
      .click();

    await expect(
      playground.locator(".nuv-accordion").getByRole("region"),
    ).toHaveCount(2);
    await expect(playground.getByLabel("collapsible")).toHaveCount(0);
  });
});
