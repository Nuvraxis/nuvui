import path from "node:path";
import AxeBuilder from "@axe-core/playwright";
import { expect, type Locator, type Page, test } from "@playwright/test";
import { drawsMaps, open } from "./helpers";

// The rendered example. The figure around it also holds the example's
// source, where the same words turn up again.
const preview = (page: Page, name: string) =>
  page.locator(`[data-preview="${name}"] > div:first-child`);
const viewer = (within: Locator) => within.locator(".nuv-model-viewer").first();

// The package's own test models, made by packages/3d/scripts/make-models.mjs.
const fixtures = path.join(
  import.meta.dirname,
  "..",
  "..",
  "..",
  "packages/3d/test/fixtures",
);
const fixture = (name: string) => path.join(fixtures, name);

async function ready(within: Locator) {
  await expect(viewer(within)).toHaveAttribute("data-state", "ready", {
    timeout: 20_000,
  });
}

// What's on the screen where the model is, as it's shown. The canvas
// keeps nothing once it's drawn, so it's read from the page's own picture.
const picture = (within: Locator) =>
  viewer(within).locator(".nuv-model-viewer__stage").screenshot();

// The picture once two in a row are the same. A viewer is ready once its
// model is, which can be a frame before the light from the room is drawn.
async function settled(within: Locator) {
  let last = await picture(within);
  await expect
    .poll(async () => {
      const now = await picture(within);
      const same = now.equals(last);
      last = now;
      return same;
    })
    .toBe(true);
  return last;
}

test.describe("3D start page", () => {
  test("says what to install, that it needs React 19, and leads to the component", async ({
    page,
  }) => {
    await open(page, "/docs/3d");
    const article = page.locator("article").first();

    await expect(
      article
        .getByText("pnpm add @nuvui/3d three @react-three/fiber @nuvui/react")
        .first(),
    ).toBeVisible();
    await expect(article.getByText("It needs React 19").first()).toBeVisible();
    await expect(
      article.getByRole("link", { name: "ModelViewer", exact: true }).first(),
    ).toHaveAttribute("href", "/docs/3d/model-viewer");
    for (const name of [
      "Formats",
      "Compressed glTF",
      "Serving the KTX2 transcoder",
      "What a browser needs",
    ]) {
      await expect(article.getByRole("heading", { name })).toBeVisible();
    }
  });
});

test.describe("model viewer page", () => {
  test("the example is named, and says it can't draw where there's no WebGL", async ({
    page,
  }) => {
    await open(page, "/docs/3d/model-viewer");
    const area = preview(page, "model-viewer/basic");
    await expect(area.getByRole("img", { name: "Oak chair" })).toBeVisible();

    if (await drawsMaps(page)) {
      await ready(area);
      await expect(area.locator("canvas")).toBeVisible();
    } else {
      await expect(area.getByRole("alert")).toHaveText(
        "This browser can't draw 3D models.",
      );
      await expect(area.locator(".nuv-model-viewer__poster")).toBeVisible();
    }
  });

  test.describe("where the browser draws WebGL", () => {
    test.beforeEach(async ({ page }) => {
      await open(page, "/docs/3d/model-viewer");
      test.skip(!(await drawsMaps(page)), "this browser has no WebGL here");
    });

    test("a drag turns the model", async ({ page, isMobile }) => {
      test.skip(isMobile, "Playwright can tap and can't drag a finger");
      const area = preview(page, "model-viewer/basic");
      await area.scrollIntoViewIfNeeded();
      await ready(area);
      const before = await picture(area);
      const box = await viewer(area).boundingBox();
      if (!box) throw new Error("The viewer has no box.");
      const x = box.x + box.width / 2;
      const y = box.y + box.height / 2;
      await page.mouse.move(x, y);
      await page.mouse.down();
      await page.mouse.move(x + 120, y, { steps: 6 });
      await page.mouse.up();
      await expect.poll(() => picture(area)).not.toEqual(before);
      // A press gave it the focus.
      await expect(area.getByRole("img", { name: "Oak chair" })).toBeFocused();
    });

    test("the keys turn it, and Home goes back", async ({ page }) => {
      const area = preview(page, "model-viewer/basic");
      await area.scrollIntoViewIfNeeded();
      await ready(area);
      const stage = area.getByRole("img", { name: "Oak chair" });
      await stage.focus();
      const before = await settled(area);
      await page.keyboard.press("ArrowRight");
      await expect.poll(() => picture(area)).not.toEqual(before);
      await page.keyboard.press("Home");
      await expect.poll(() => picture(area)).toEqual(before);
    });

    test("the wheel scrolls the page past a viewer it isn't on", async ({
      page,
      isMobile,
    }) => {
      test.skip(isMobile, "a phone has no wheel");
      const area = preview(page, "model-viewer/basic");
      await area.scrollIntoViewIfNeeded();
      await ready(area);
      const before = await picture(area);
      const scrolled = await page.evaluate(() => window.scrollY);
      const box = await viewer(area).boundingBox();
      if (!box) throw new Error("The viewer has no box.");
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.wheel(0, 200);
      await expect
        .poll(() => page.evaluate(() => window.scrollY))
        .toBeGreaterThan(scrolled);
      expect(await picture(area)).toEqual(before);
    });

    test("each format loads", async ({ page }) => {
      const area = preview(page, "model-viewer/formats");
      await area.scrollIntoViewIfNeeded();
      await ready(area);
      for (const [format, name] of [
        ["glTF", "Pine crate"],
        ["STL", "Gear with 18 teeth"],
      ] as const) {
        await area.getByRole("radio", { name: format }).click();
        await expect(area.getByRole("img", { name })).toBeVisible();
        await ready(area);
      }
    });

    test("files the person picks are shown, and what's missing is named", async ({
      page,
    }) => {
      const area = preview(page, "model-viewer/picked");
      await area.scrollIntoViewIfNeeded();
      const input = area.getByLabel("Your model");

      await input.setInputFiles([
        fixture("crate.gltf"),
        fixture("crate.bin"),
        fixture("crate.png"),
      ]);
      await ready(area);
      await expect(area.getByText("GLTF, 12 triangles")).toBeVisible();

      // Taken out of the list, the texture is missing.
      await area.getByRole("button", { name: "Remove crate.png" }).click();
      await expect(area.getByRole("alert")).toHaveText(
        "Some of the model's files are missing: crate.png. Pick them together with the glTF.",
      );

      // The model picked last is the one shown.
      await input.setInputFiles([fixture("block.stl")]);
      await ready(area);
      await expect(
        area.getByText("STL, 12 triangles, 40 × 10 × 20"),
      ).toBeVisible();
    });

    test("Meshopt and KTX2 models load with their decoders", async ({
      page,
    }) => {
      const area = preview(page, "model-viewer/decoders");
      await area.scrollIntoViewIfNeeded();
      const viewers = area.locator(".nuv-model-viewer");
      await expect(viewers).toHaveCount(2);
      for (const index of [0, 1]) {
        await expect(viewers.nth(index)).toHaveAttribute(
          "data-state",
          "ready",
          {
            timeout: 20_000,
          },
        );
      }
    });

    test("has no axe violations once a model is shown", async ({ page }) => {
      const area = preview(page, "model-viewer/basic");
      await area.scrollIntoViewIfNeeded();
      await ready(area);
      const results = await new AxeBuilder({ page })
        .include('[data-preview="model-viewer/basic"]')
        .analyze();
      expect(results.violations).toEqual([]);
    });
  });
});
