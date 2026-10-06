import { createTheme, presets } from "@nuvui/theme";
import { expect, type Locator, type Page, test } from "@playwright/test";
import { open, rootStyle, sameColor } from "./helpers";

const purple = "#7c3aed";
const purpleRgb = "rgb(124, 58, 237)";

function background(locator: Locator) {
  return locator.evaluate(
    (element) => getComputedStyle(element).backgroundColor,
  );
}

function parts(page: Page) {
  const editor = page.locator("[data-token-editor]");
  const preview = editor.locator("[data-token-scope]");
  return {
    editor,
    preview,
    save: preview.getByRole("button", { name: "Save" }),
    snippet: editor.locator("pre"),
    color: (name: string) => editor.getByLabel(name, { exact: true }),
  };
}

test.describe("token editor", () => {
  test.beforeEach(async ({ page }) => {
    // Colors are read straight after a change, so nothing should be fading.
    await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
    await open(page, "/docs/theming");
  });

  test("changing a color changes the preview and nothing outside it", async ({
    page,
  }) => {
    const { editor, save, color } = parts(page);
    const reset = editor.getByRole("button", { name: "Reset all" });
    const before = await background(save);
    const pageValue = await rootStyle(page, "--color-primary");

    await color("--color-primary").fill(purple);

    expect(await background(save)).toBe(purpleRgb);
    expect(before).not.toBe(purpleRgb);
    // The page's own token is untouched, and so is a library button that
    // sits outside the preview box.
    expect(await rootStyle(page, "--color-primary")).toBe(pageValue);
    expect(await background(reset)).not.toBe(purpleRgb);
  });

  test("the CSS for a change is printed, and Reset clears it", async ({
    page,
  }) => {
    const { editor, save, snippet, color } = parts(page);
    const before = await background(save);
    await expect(snippet).toContainText("Change a value above");

    await color("--color-primary").fill(purple);
    await expect(snippet).toContainText(`--color-primary: ${purple};`);

    await editor.getByRole("button", { name: "Reset all" }).click();

    await expect(snippet).toContainText("Change a value above");
    expect(await background(save)).toBe(before);
  });

  test("a size slider moves with the keyboard and resizes the preview", async ({
    page,
  }) => {
    const { editor, save, snippet } = parts(page);
    const radius = () =>
      save.evaluate((element) => getComputedStyle(element).borderRadius);
    expect(await radius()).toBe("6px");

    const slider = editor.getByLabel("--radius-md", { exact: true });
    await slider.focus();
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowRight");

    // Two steps of a sixteenth of a rem, from 0.375rem.
    expect(await radius()).toBe("8px");
    await expect(snippet).toContainText("--radius-md: 0.5rem;");

    // Back on the default there's nothing left to override.
    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("ArrowLeft");
    expect(await radius()).toBe("6px");
    await expect(snippet).not.toContainText("--radius-md");
  });

  test("light and dark keep separate colors", async ({ page }) => {
    const { editor, save, color } = parts(page);
    const html = page.locator("html");

    await color("--color-primary").fill(purple);
    expect(await background(save)).toBe(purpleRgb);

    // The site follows the system theme, so this is the visitor's system
    // changing while the page is open.
    await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
    await expect(html).toHaveAttribute("data-theme", "dark");
    await expect(editor).toContainText("Colors in the dark theme");

    // Dark shows the library's own dark primary, not the light edit.
    const darkPrimary = await background(save);
    expect(darkPrimary).not.toBe(purpleRgb);
    await expect(editor).toContainText("var(--color-blue-400)");

    await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
    await expect(html).toHaveAttribute("data-theme", "light");
    expect(await background(save)).toBe(purpleRgb);
  });

  test("it says when a pair of colors is too close to read", async ({
    page,
  }) => {
    const { editor, color } = parts(page);
    const row = editor.locator('[data-contrast="--color-primary-foreground"]');
    await expect(row).toContainText(/\d+\.\d\d:1/);
    await expect(row).not.toContainText("below");

    await color("--color-primary").fill(purple);
    await color("--color-primary-foreground").fill(purple);

    await expect(row).toContainText("1.00:1, below 4.5:1");
  });

  test("the select list opens inside the preview and takes its colors", async ({
    page,
    isMobile,
  }) => {
    const { preview, color } = parts(page);
    await color("--color-primary").fill(purple);

    const trigger = preview.getByRole("combobox", { name: "How often" });
    await (isMobile ? trigger.tap() : trigger.click());

    // Inside the box, not at the end of <body>, or the override wouldn't
    // reach it.
    const list = preview.getByRole("listbox");
    await expect(list).toBeVisible();

    // The chosen option starts out focused, and a focused row is filled with
    // the primary color.
    const focused = list.getByRole("option", { name: "Once a week" });
    await expect(focused).toBeFocused();
    expect(await background(focused)).toBe(purpleRgb);
  });

  test("the printed CSS does on a real page what the preview showed", async ({
    page,
  }) => {
    const { snippet, color } = parts(page);
    await color("--color-primary").fill(purple);
    // The dark block gives the library's value back. Waiting for it here
    // matters: read straight away, the snippet can still be the empty one.
    await expect(snippet).toContainText('[data-theme="dark"]');
    const css = (await snippet.innerText()).trim();
    expect(css).toContain("--color-primary: var(--color-blue-400);");

    const button = page.locator('[data-preview="button/basic"] .nuv-button');

    await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
    await open(page, "/docs/components/button");
    const libraryDark = await background(button);

    // First the :root rule alone. It reaches dark too, which is why the
    // editor prints a dark block at all.
    const rootOnly = await page.addStyleTag({
      content: `:root { --color-primary: ${purple}; }`,
    });
    expect(await background(button)).toBe(purpleRgb);
    await rootOnly.evaluate((style) => style.parentNode?.removeChild(style));

    await page.addStyleTag({ content: css });
    expect(await background(button)).toBe(libraryDark);

    await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    expect(await background(button)).toBe(purpleRgb);
  });
});

test.describe("token editor, starting from a preset", () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
    await open(page, "/docs/theming");
  });

  async function startFrom(page: Page, isMobile: boolean, option: string) {
    const trigger = parts(page).editor.getByRole("combobox", {
      name: "Start from",
    });
    await (isMobile ? trigger.tap() : trigger.click());
    const item = page.getByRole("option", { name: option });
    await (isMobile ? item.tap() : item.click());
    await expect(trigger).toHaveText(option);
  }

  test("the preview takes the preset, and the page doesn't", async ({
    page,
    isMobile,
  }) => {
    const { preview, save, snippet } = parts(page);
    const ink = createTheme(presets.ink);
    const pageValue = await rootStyle(page, "--color-primary");

    await startFrom(page, isMobile, "The ink preset");

    await expect(preview).toHaveAttribute("data-preset", "ink");
    expect(
      await sameColor(
        page,
        await background(save),
        ink.light["--color-primary"],
      ),
    ).toBe(true);
    expect(await rootStyle(page, "--color-primary")).toBe(pageValue);
    await expect(snippet).toContainText("@nuvui/react/themes/ink.css");
    await expect(snippet).toContainText('data-preset="ink"');
  });

  test("a change on top of a preset prints the preset's own dark value", async ({
    page,
    isMobile,
  }) => {
    const { save, snippet, color } = parts(page);
    const ink = createTheme(presets.ink);
    await startFrom(page, isMobile, "The ink preset");

    await color("--color-primary").fill(purple);

    expect(await background(save)).toBe(purpleRgb);
    await expect(snippet).toContainText(`--color-primary: ${purple};`);
    await expect(snippet).toContainText(
      `--color-primary: ${ink.dark["--color-primary"]};`,
    );
  });

  test("the square preset moves the radius sliders to zero", async ({
    page,
    isMobile,
  }) => {
    const { editor, save } = parts(page);
    await startFrom(page, isMobile, "The ledger preset");

    await expect(editor.getByLabel("--radius-md", { exact: true })).toHaveValue(
      "0",
    );
    expect(
      await save.evaluate(
        (element) => getComputedStyle(element).borderTopLeftRadius,
      ),
    ).toBe("0px");
  });

  test("going back to the default theme clears it", async ({
    page,
    isMobile,
  }) => {
    const { preview, save, snippet, color } = parts(page);
    const before = await background(save);
    await startFrom(page, isMobile, "The ember preset");
    await color("--color-primary").fill(purple);

    await startFrom(page, isMobile, "The default theme");

    await expect(preview).not.toHaveAttribute("data-preset");
    expect(await background(save)).toBe(before);
    await expect(snippet).toContainText("Change a value above");
  });
});
