import { expect, type Page, test } from "@playwright/test";
import { open } from "./helpers";

// The rendered example. The figure around it also holds the example's
// source, where the same words turn up again.
const preview = (page: Page, name: string) =>
  page.locator(`[data-preview="${name}"] > div:first-child`);

test.describe("editor start page", () => {
  test("names all three editors and the import for the code ones", async ({
    page,
  }) => {
    await open(page, "/docs/editor");
    for (const name of ["RichTextEditor", "CodeEditor", "DiffEditor"]) {
      await expect(
        page.getByRole("link", { name, exact: true }).first(),
      ).toBeVisible();
    }
    await expect(
      page.getByText('from "@nuvui/editor/code"').first(),
    ).toBeVisible();
  });
});

test.describe("code editor page", () => {
  test("the example is colored code that can be written in, and the status follows the cursor", async ({
    page,
    isMobile,
  }) => {
    await open(page, "/docs/editor/code-editor");
    const example = preview(page, "code-editor/basic");
    const code = example.getByRole("textbox", { name: "Packing script" });
    await expect(code).toBeVisible();
    await expect(example.getByText("TypeScript").last()).toBeVisible();

    await code.click();
    await page.keyboard.press(isMobile ? "End" : "ControlOrMeta+End");
    await page.keyboard.type("// packed");
    await expect(code).toContainText("// packed");
    await expect(example.locator(".nuv-code-editor__status")).toContainText(
      /Line \d+, column \d+/,
    );
  });

  test("Escape then Tab leaves the code, where Tab alone indents", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "a phone has no Tab key");
    await open(page, "/docs/editor/code-editor");
    const code = preview(page, "code-editor/basic").getByRole("textbox", {
      name: "Packing script",
    });
    await code.click();
    await page.keyboard.press("Tab");
    await expect(code).toBeFocused();
    await page.keyboard.press("Escape");
    await page.keyboard.press("Tab");
    await expect(code).not.toBeFocused();
  });

  test("the JSON example marks its problem and counts it", async ({ page }) => {
    await open(page, "/docs/editor/code-editor");
    const example = preview(page, "code-editor/diagnostics");
    await expect(
      example.getByRole("textbox", { name: "Store settings" }),
    ).toBeVisible();
    await expect(example.locator(".cm-lintRange-error")).toHaveCount(1);
    await expect(example.locator(".nuv-code-editor__status")).toContainText(
      "1 problem",
    );
  });

  test("search finds and counts, and closes back to the code", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "search is opened from the keyboard");
    await open(page, "/docs/editor/code-editor");
    const example = preview(page, "code-editor/basic");
    const code = example.getByRole("textbox", { name: "Packing script" });
    await code.click();
    await page.keyboard.press("ControlOrMeta+f");
    const find = example.getByRole("textbox", { name: "Find" });
    await expect(find).toBeFocused();
    await page.keyboard.type("item");
    await expect(example.locator(".nuv-code-editor__matches")).toHaveText(
      /of \d+/,
    );
    await page.keyboard.press("Escape");
    await expect(code).toBeFocused();
  });

  test("each file keeps its own text, and its language comes from its name", async ({
    page,
  }) => {
    await open(page, "/docs/editor/code-editor");
    const example = preview(page, "code-editor/files");
    await expect(
      example.getByRole("textbox", { name: "index.html" }),
    ).toBeVisible();
    await expect(example.locator(".nuv-code-editor__status")).toContainText(
      "HTML",
    );
    await example.getByRole("radio", { name: "styles.css" }).click();
    await expect(
      example.getByRole("textbox", { name: "styles.css" }),
    ).toContainText(".hours");
    await expect(example.locator(".nuv-code-editor__status")).toContainText(
      "CSS",
    );
  });

  test("in a form, the code is sent under its name and named by its label", async ({
    page,
  }) => {
    await open(page, "/docs/editor/code-editor");
    const example = preview(page, "code-editor/form");
    await expect(
      example.getByRole("textbox", { name: "Receipt template" }),
    ).toBeVisible();
    await example.getByRole("button", { name: "Save template" }).click();
    await expect(example.locator("pre")).toContainText("Order {{ number }}");
  });
});

test.describe("diff editor page", () => {
  test("the split example names both texts and says what changed", async ({
    page,
  }) => {
    await open(page, "/docs/editor/diff-editor");
    const example = preview(page, "diff-editor/split");
    await expect(
      example.getByRole("textbox", { name: "Changed" }),
    ).toBeVisible();
    await expect(example.locator(".nuv-diff-editor__status")).toHaveText(
      /\d+ changes?, \d+ lines? added, \d+ removed/,
    );
  });

  test("next change moves to one and says which", async ({ page }) => {
    await open(page, "/docs/editor/diff-editor");
    const example = preview(page, "diff-editor/split");
    await expect(
      example.getByRole("textbox", { name: "Changed" }),
    ).toBeVisible();
    await example.getByRole("button", { name: "Next change" }).click();
    await expect(example.locator("[aria-live]").last()).toHaveText(
      /Change 1 of \d+/,
    );
  });

  test("in the editable example, undoing and keeping each change leaves none", async ({
    page,
  }) => {
    await open(page, "/docs/editor/diff-editor");
    const example = preview(page, "diff-editor/editable");
    await expect(
      example.getByRole("textbox", { name: "Changed" }),
    ).toBeVisible();
    await example.getByRole("button", { name: "Undo change" }).first().click();
    await expect(example.locator(".nuv-diff-editor__status")).toContainText(
      "1 change",
    );
    await example.getByRole("button", { name: "Keep change" }).first().click();
    await expect(example.locator(".nuv-diff-editor__status")).toHaveText(
      "No changes",
    );
    await expect(example.getByText("0 left to decide on.")).toBeVisible();
  });
});
