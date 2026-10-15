import { readFileSync } from "node:fs";
import path from "node:path";
import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";
import { open, pageProblems, press, settleStyles, wcag } from "./helpers";

// The Icons page. What every page of the site has to have is tested for it
// in site.spec.ts, which goes through the list of pages.

const manifest = JSON.parse(
  readFileSync(
    path.join(
      import.meta.dirname,
      "..",
      "..",
      "..",
      "packages",
      "icons",
      "manifest.json",
    ),
    "utf8",
  ),
) as { icons: { name: string; component: string; category: string }[] };

const first = manifest.icons[0];
if (!first) throw new Error("the manifest lists no icons");

const tiles = (page: Page) => page.locator(".site-icons__tile");
const tile = (page: Page, name: string) =>
  page.locator(`.site-icons__tile[data-icon="${name}"]`);
const dialog = (page: Page) =>
  page.getByRole("dialog", { name: first.component });

// What was copied. Windows' clipboard hands back each line ending as \r\n.
const clipboard = async (page: Page) =>
  (await page.evaluate(() => navigator.clipboard.readText())).replace(
    /\r\n/g,
    "\n",
  );

test.describe("icons page", () => {
  test("has every icon in the package, under its category, with no errors", async ({
    page,
  }) => {
    const problems = pageProblems(page);
    await open(page, "/icons");

    await expect(tiles(page)).toHaveCount(manifest.icons.length);
    await expect(page.getByRole("status").first()).toHaveText(
      `${manifest.icons.length} icons`,
    );
    const categories = [...new Set(manifest.icons.map((i) => i.category))];
    await expect(page.locator(".site-icons__heading")).toHaveText(categories);
    expect(problems).toEqual([]);
  });

  test("the header links to it", async ({ page, isMobile }) => {
    test.skip(isMobile, "On a phone the links are in the menu.");
    await open(page, "/");
    await page
      .getByRole("banner")
      .getByRole("link", { name: "Icons", exact: true })
      .click();
    await expect(page).toHaveURL(/\/icons$/);
  });

  test("a search keeps the icons with every word in their name or category", async ({
    page,
  }) => {
    await open(page, "/icons");
    const words = first.name.split("-");
    const expected = manifest.icons.filter((icon) =>
      words.every((word) =>
        `${icon.name} ${icon.category.toLowerCase()}`.includes(word),
      ),
    );

    await page
      .getByRole("searchbox", { name: "Find an icon" })
      .fill(words.join(" "));
    await expect(tiles(page)).toHaveCount(expected.length);
    await expect(tile(page, first.name)).toBeVisible();

    await page
      .getByRole("searchbox", { name: "Find an icon" })
      .fill("nothing is called this");
    await expect(tiles(page)).toHaveCount(0);
  });

  test("the style switch draws every icon in that style", async ({
    page,
    isMobile,
  }) => {
    await open(page, "/icons");
    const ends = () =>
      tile(page, first.name)
        .locator("svg")
        .evaluate((svg) => {
          const style = getComputedStyle(svg);
          return [style.strokeLinecap, style.strokeLinejoin];
        });

    expect(await ends()).toEqual(["round", "round"]);
    await press(page.getByRole("radio", { name: "Sharp" }), isMobile);
    expect(await ends()).toEqual(["square", "miter"]);
  });

  test("an icon opens in each style and at each size, and closes back to its tile", async ({
    page,
    isMobile,
  }) => {
    await open(page, "/icons");
    await press(tile(page, first.name), isMobile);

    await expect(dialog(page)).toBeVisible();
    await expect(dialog(page).locator(".site-icons__style")).toHaveText([
      "Rounded",
      "Standard",
      "Sharp",
    ]);
    // The width the layout gives it. What's on screen is scaled while the
    // dialog grows into place, and a 32 pixel icon measures 31 then.
    const sizes = await dialog(page)
      .locator(".site-icons__size svg")
      .evaluateAll((svgs) =>
        svgs.map((svg) => Number.parseFloat(getComputedStyle(svg).width)),
      );
    expect(sizes).toEqual([16, 20, 24, 32]);
    await expect(dialog(page).locator("code")).toHaveText(
      `import { ${first.component} } from "@nuvui/icons";${"\n\n"}<${first.component} />`,
    );

    await page.keyboard.press("Escape");
    await expect(dialog(page)).toBeHidden();
    await expect(tile(page, first.name)).toBeFocused();
  });

  test("the import copied is from the style chosen, and the SVG is the drawing", async ({
    page,
    browserName,
    isMobile,
  }) => {
    test.skip(
      browserName !== "chromium",
      "Only Chromium lets a test read the clipboard back.",
    );
    await open(page, "/icons");
    await press(page.getByRole("radio", { name: "Sharp" }), isMobile);
    await press(tile(page, first.name), isMobile);

    await press(
      dialog(page).getByRole("button", { name: "Copy import" }),
      isMobile,
    );
    expect(await clipboard(page)).toBe(
      `import { ${first.component} } from "@nuvui/icons/sharp";\n\n<${first.component} />`,
    );

    await press(
      dialog(page).getByRole("button", { name: "Copy SVG" }),
      isMobile,
    );
    const svg = await clipboard(page);
    expect(svg).toMatch(/^<svg [^>]*xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
    expect(svg).toContain('viewBox="0 0 24 24"');
    expect(svg).toContain('stroke="currentColor"');
    expect(svg).toContain('stroke-linecap="square"');
    expect(svg).not.toContain("aria-hidden");
  });

  test("the Figma file the icons are drawn in downloads", async ({ page }) => {
    await open(page, "/icons");
    const link = page.getByRole("link", { name: "Download the Figma file" });

    await expect(link).toHaveAttribute("download", "");
    const href = await link.getAttribute("href");
    expect(href).toBe("/docs/NuvUI_Icons_Figma_File.fig");
    const response = await page.request.get(href ?? "");
    expect(response.status()).toBe(200);
    // A .fig file is a zip, which starts with PK.
    expect((await response.body()).subarray(0, 2).toString()).toBe("PK");
  });

  test("the SVG downloads as a file named for the icon", async ({
    page,
    isMobile,
  }) => {
    await open(page, "/icons");
    await press(tile(page, first.name), isMobile);
    const link = dialog(page).getByRole("link", { name: "Download SVG" });

    await expect(link).toHaveAttribute("download", `${first.name}.svg`);
    await expect(link).toHaveAttribute("href", /^data:image\/svg\+xml/);
  });

  test("passes axe with an icon open", async ({ page, isMobile }) => {
    await open(page, "/icons");
    await press(tile(page, first.name), isMobile);
    await expect(dialog(page)).toBeVisible();
    // The dialog and the shade behind it fade in, and the words are checked
    // for contrast once they have: halfway there they're paler than they'll
    // be.
    await page.evaluate(() =>
      Promise.all(
        document.getAnimations().map((animation) => animation.finished),
      ),
    );
    await settleStyles(page);

    const results = await new AxeBuilder({ page }).withTags(wcag).analyze();
    expect(results.violations).toEqual([]);
  });
});
