import { readFileSync } from "node:fs";
import path from "node:path";
import { expect, type Page, test } from "@playwright/test";
import { open, press } from "./helpers";

// What the package has, read from where the grid reads it.
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
) as {
  icons: { name: string; component: string; category: string }[];
};

const grid = (page: Page) => page.locator("[data-icon-grid]");
const tiles = (page: Page) => grid(page).locator("button[data-icon]");
const search = (page: Page) =>
  grid(page).getByRole("searchbox", { name: "Find an icon" });

test.describe("icons page", () => {
  test("the grid has every icon in the package, under its category", async ({
    page,
  }) => {
    await open(page, "/docs/icons");

    await expect(tiles(page)).toHaveCount(manifest.icons.length);
    await expect(grid(page).getByRole("status")).toHaveText(
      `${manifest.icons.length} icons. Press one to copy its import.`,
    );
    const categories = [...new Set(manifest.icons.map((i) => i.category))];
    await expect(grid(page).getByRole("heading", { level: 3 })).toHaveText(
      categories,
    );
  });

  test("the grid is in the page the server sends", async ({ page }) => {
    const html = await (await page.request.get("/docs/icons")).text();
    const first = manifest.icons[0];
    if (!first) throw new Error("the manifest lists no icons");

    expect(html).toContain(`data-icon="${first.name}"`);
  });

  test("a search keeps the icons with every word in their name or category", async ({
    page,
  }) => {
    await open(page, "/docs/icons");
    const first = manifest.icons[0];
    if (!first) throw new Error("the manifest lists no icons");
    const words = first.name.split("-");
    const expected = manifest.icons.filter((icon) =>
      words.every((word) =>
        `${icon.name} ${icon.category.toLowerCase()}`.includes(word),
      ),
    );

    await search(page).fill(words.join(" "));

    await expect(tiles(page)).toHaveCount(expected.length);
    await expect(
      grid(page).locator(`button[data-icon="${first.name}"]`),
    ).toBeVisible();

    await search(page).fill("nothing is called this");
    await expect(tiles(page)).toHaveCount(0);
    await expect(grid(page).getByRole("status")).toHaveText(
      "No icon has that in its name or its category.",
    );
  });

  test("the style switch draws every icon in that style", async ({
    page,
    isMobile,
  }) => {
    await open(page, "/docs/icons");
    const ends = () =>
      tiles(page)
        .first()
        .locator("svg")
        .evaluate((svg) => {
          const style = getComputedStyle(svg);
          return [style.strokeLinecap, style.strokeLinejoin];
        });

    expect(await ends()).toEqual(["round", "round"]);
    await press(grid(page).getByRole("radio", { name: "Sharp" }), isMobile);
    await expect(
      grid(page).getByRole("radio", { name: "Sharp" }),
    ).toBeChecked();
    expect(await ends()).toEqual(["square", "miter"]);
    await press(grid(page).getByRole("radio", { name: "Rounded" }), isMobile);
    expect(await ends()).toEqual(["round", "round"]);
  });

  test("pressing an icon copies its import, from the style chosen", async ({
    page,
    browserName,
    isMobile,
  }) => {
    test.skip(
      browserName !== "chromium",
      "Only Chromium lets a test read the clipboard back.",
    );
    await open(page, "/docs/icons");
    const first = manifest.icons[0];
    if (!first) throw new Error("the manifest lists no icons");
    const line = `import { ${first.component} } from "@nuvui/icons/sharp";`;

    await press(grid(page).getByRole("radio", { name: "Sharp" }), isMobile);
    await press(
      grid(page).locator(`button[data-icon="${first.name}"]`),
      isMobile,
    );

    await expect(grid(page).locator("[aria-live]")).toHaveText(
      `Copied ${line}`,
    );
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
      line,
    );
  });

  test("each icon's button is named by the icon and big enough to press", async ({
    page,
  }) => {
    await open(page, "/docs/icons");
    const first = manifest.icons[0];
    if (!first) throw new Error("the manifest lists no icons");
    const tile = grid(page).getByRole("button", {
      name: first.name,
      exact: true,
    });

    await expect(tile).toBeVisible();
    const box = await tile.boundingBox();
    expect(box?.width).toBeGreaterThanOrEqual(44);
    expect(box?.height).toBeGreaterThanOrEqual(44);
    // The drawing is hidden, and the name is the words under it.
    await expect(tile.locator("svg")).toHaveAttribute("aria-hidden", "true");
  });
});
