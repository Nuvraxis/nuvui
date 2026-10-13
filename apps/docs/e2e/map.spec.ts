import AxeBuilder from "@axe-core/playwright";
import { expect, type Locator, type Page, test } from "@playwright/test";
import { drawsMaps, open, press } from "./helpers";

// The rendered example. The figure around it also holds the example's
// source, where the same words turn up again.
const preview = (page: Page, name: string) =>
  page.locator(`[data-preview="${name}"] > div:first-child`);
const playground = (page: Page) => page.locator("[data-playground]");
const map = (within: Locator | Page) => within.locator(".nuv-map");
const marker = (within: Locator | Page, name: string | RegExp) =>
  within.locator(".nuv-map__marker").and(within.getByRole("button", { name }));

// `open` hands every map on these pages a style of one color in place of
// the provider's, so a map is ready as soon as MapLibre has come.
async function ready(within: Locator | Page) {
  await expect(map(within).first()).toHaveAttribute("data-state", "ready", {
    timeout: 20_000,
  });
}

test.describe("map start page", () => {
  test("says what to install, that the tiles are a provider's, and leads to the component", async ({
    page,
  }) => {
    await open(page, "/docs/map");
    const article = page.locator("article").first();

    await expect(
      article.getByText("pnpm add @nuvui/map maplibre-gl @nuvui/react").first(),
    ).toBeVisible();
    await expect(
      article.getByRole("link", { name: "MapView", exact: true }).first(),
    ).toHaveAttribute("href", "/docs/map/map-view");
    await expect(
      article.getByRole("heading", { name: "You bring the map" }),
    ).toBeVisible();
    await expect(
      article.getByRole("heading", { name: "What a browser needs" }),
    ).toBeVisible();
  });
});

test.describe("map view page, where a browser can't draw a map", () => {
  test("the box says so, and the page has no error of its own", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      HTMLCanvasElement.prototype.getContext = () => null;
    });
    const problems: string[] = [];
    page.on("pageerror", (error) => problems.push(error.message));
    await open(page, "/docs/map/map-view");

    await expect(preview(page, "map/basic").getByRole("alert")).toHaveText(
      "The map couldn't be drawn",
    );
    expect(problems).toEqual([]);
  });
});

test.describe("map view page", () => {
  test.beforeEach(async ({ page }) => {
    await open(page, "/docs/map/map-view");
    test.skip(!(await drawsMaps(page)), "this browser draws no WebGL here");
  });

  test("it's a map with a name, a marker with one, and buttons to zoom", async ({
    page,
  }) => {
    const area = preview(page, "map/basic");
    await ready(area);

    await expect(
      area.getByRole("region", { name: "Where the Berlin office is" }),
    ).toBeVisible();
    await expect(marker(area, "Berlin office")).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    await expect(area.getByRole("button", { name: "Zoom in" })).toBeVisible();
    await expect(area.getByRole("button", { name: "Zoom out" })).toBeVisible();
    await expect(area.locator(".nuv-map__note")).toHaveCount(0);
  });

  test("a press on a marker opens its popup, and its button closes it", async ({
    page,
    isMobile,
  }) => {
    const area = preview(page, "map/basic");
    await ready(area);

    await press(marker(area, "Berlin office"), isMobile);
    const popup = area.getByRole("dialog", { name: "Berlin office" });
    await expect(popup).toContainText("Friedrichstraße 68");
    await expect(marker(area, "Berlin office")).toHaveAttribute(
      "aria-expanded",
      "true",
    );

    await press(popup.getByRole("button", { name: "Close" }), isMobile);
    await expect(popup).toHaveCount(0);
  });

  test("Escape closes a popup and puts the focus back on its marker", async ({
    page,
    isMobile,
  }) => {
    // A phone has no Escape key.
    test.skip(isMobile);
    const area = preview(page, "map/basic");
    await ready(area);
    await marker(area, "Berlin office").focus();
    await page.keyboard.press("Enter");
    await expect(
      area.getByRole("dialog", { name: "Berlin office" }),
    ).toBeFocused();

    await page.keyboard.press("Escape");

    await expect(area.getByRole("dialog")).toHaveCount(0);
    await expect(marker(area, "Berlin office")).toBeFocused();
  });

  test("with several markers one popup is open at a time, and a press on the map closes it", async ({
    page,
    isMobile,
  }) => {
    const area = preview(page, "map/markers");
    await ready(area);
    await expect(area.locator(".nuv-map__marker")).toHaveCount(3);

    await press(marker(area, "Berlin office"), isMobile);
    await expect(
      area.getByRole("dialog", { name: "Berlin office" }),
    ).toContainText("42 people");

    await press(marker(area, "Madrid office"), isMobile);
    await expect(
      area.getByRole("dialog", { name: "Madrid office" }),
    ).toContainText("9 people");
    await expect(area.getByRole("dialog")).toHaveCount(1);

    // A corner of the map, away from the markers and the buttons.
    const box = await map(area).boundingBox();
    const at = { x: (box?.x ?? 0) + 12, y: (box?.y ?? 0) + 12 };
    if (isMobile) await page.touchscreen.tap(at.x, at.y);
    else await page.mouse.click(at.x, at.y);
    await expect(area.getByRole("dialog")).toHaveCount(0);
  });

  test("an area given as bounds has every marker in view", async ({ page }) => {
    const area = preview(page, "map/markers");
    await ready(area);
    const box = await map(area).boundingBox();

    for (const name of ["Berlin office", "Paris office", "Madrid office"]) {
      const pin = await marker(area, name).boundingBox();
      expect(pin?.x ?? -1).toBeGreaterThanOrEqual(box?.x ?? 0);
      expect((pin?.x ?? 0) + (pin?.width ?? 0)).toBeLessThanOrEqual(
        (box?.x ?? 0) + (box?.width ?? 0),
      );
      expect(pin?.y ?? -1).toBeGreaterThanOrEqual(box?.y ?? 0);
      expect((pin?.y ?? 0) + (pin?.height ?? 0)).toBeLessThanOrEqual(
        (box?.y ?? 0) + (box?.height ?? 0),
      );
    }
  });

  test("a center kept by the app moves the map, and the app is told where it rests", async ({
    page,
    isMobile,
  }) => {
    const area = preview(page, "map/view");
    await ready(area);
    await expect(area.getByRole("status")).toHaveText("Not moved yet");

    await press(area.getByRole("button", { name: "Paris" }), isMobile);

    await expect(area.getByRole("status")).toHaveText(
      "At rest at 48.857, 2.352 at zoom 10.0",
      { timeout: 15_000 },
    );
  });

  test("the arrow keys move the map, and the key with plus on it zooms it", async ({
    page,
    isMobile,
  }) => {
    // A phone has no arrow keys.
    test.skip(isMobile);
    const area = preview(page, "map/view");
    await ready(area);
    await area.getByRole("region", { name: "Cities" }).focus();

    await page.keyboard.press("ArrowRight");
    await expect(area.getByRole("status")).toHaveText(
      /^At rest at 52\.520, 13\.4\d\d at zoom 10\.0$/,
      { timeout: 15_000 },
    );
    await expect(area.getByRole("status")).not.toHaveText(/13\.405/);

    await page.keyboard.press("Equal");
    await expect(area.getByRole("status")).toHaveText(/at zoom 11\.0$/, {
      timeout: 15_000,
    });
  });

  test("a marker drawn another way is read by its name, and every control asked for is there", async ({
    page,
  }) => {
    const area = preview(page, "map/custom");
    await ready(area);

    await expect(
      area.getByRole("img", { name: "Van 12, 14 parcels on board" }),
    ).toHaveText("14");
    await expect(area.locator(".nuv-map__pin")).toHaveCount(0);
    await expect(
      area.getByRole("button", { name: "Turn north up" }),
    ).toBeVisible();
    await expect(
      area.getByRole("button", { name: "Go to my location" }),
    ).toBeVisible();
    // Where the browser can fill the screen, which an iPhone's can't.
    const can = await page.evaluate(() => document.fullscreenEnabled === true);
    await expect(
      area.getByRole("button", { name: "Fill the screen" }),
    ).toHaveCount(can ? 1 : 0);
  });

  test("a marker that can be moved goes with the arrow keys, and the app is told where", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile);
    const area = preview(page, "map/draggable");
    await ready(area);
    const point = marker(area, /^Delivery point/);
    await expect(area.getByRole("status")).toHaveText(
      "Deliver to 52.36760, 4.90410",
    );
    const before = await point.boundingBox();

    await point.focus();
    await page.keyboard.press("ArrowRight");

    await expect(area.getByRole("status")).toHaveText(
      /^Deliver to 52\.36760, 4\.9045\d$/,
    );
    await expect
      .poll(async () =>
        Math.round(((await point.boundingBox())?.x ?? 0) - (before?.x ?? 0)),
      )
      .toBe(10);
  });

  test("it's dragged with a mouse, and dropping it doesn't press it", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile);
    const area = preview(page, "map/draggable");
    await ready(area);
    const point = marker(area, /^Delivery point/);
    await point.scrollIntoViewIfNeeded();
    const box = await point.boundingBox();
    const from = {
      x: (box?.x ?? 0) + (box?.width ?? 0) / 2,
      y: (box?.y ?? 0) + (box?.height ?? 0) / 2,
    };

    await page.mouse.move(from.x, from.y);
    await page.mouse.down();
    await page.mouse.move(from.x + 40, from.y + 10, { steps: 6 });
    await page.mouse.move(from.x + 90, from.y + 30, { steps: 6 });
    await page.mouse.up();

    await expect(area.getByRole("status")).not.toHaveText(
      "Deliver to 52.36760, 4.90410",
    );
    await expect
      .poll(async () =>
        Math.round(((await point.boundingBox())?.x ?? 0) - (box?.x ?? 0)),
      )
      .toBeGreaterThan(60);
  });

  test("the playground changes the buttons and where they are, and the code with them", async ({
    page,
  }) => {
    const area = playground(page);
    await ready(area);
    await expect(area.locator("pre")).toContainText("<MapControls />");
    await expect(
      area.getByRole("button", { name: "Turn north up" }),
    ).toHaveCount(0);

    await area.getByRole("checkbox", { name: "compass" }).check();
    await area.getByLabel("position").selectOption("bottom-start");

    await expect(
      area.getByRole("button", { name: "Turn north up" }),
    ).toBeVisible();
    await expect(area.locator(".nuv-map__controls")).toHaveClass(
      /nuv-map__controls--bottom-start/,
    );
    await expect(area.locator("pre")).toContainText(
      '<MapControls position="bottom-start" compass />',
    );
  });

  test("the playground's marker becomes one that can be moved", async ({
    page,
  }) => {
    const area = playground(page);
    await ready(area);
    await expect(
      area.getByRole("img", { name: "Berlin office" }),
    ).toBeVisible();

    await area.getByRole("checkbox", { name: "draggable" }).check();

    await expect(marker(area, "Berlin office")).toHaveAttribute(
      "data-draggable",
      "",
    );
    await expect(area.locator("pre")).toContainText("draggable");
  });

  test("with cooperative gestures the wheel is the page's, and the map says how to zoom it", async ({
    page,
    isMobile,
  }) => {
    // A finger has no wheel.
    test.skip(isMobile);
    const area = preview(page, "map/view");
    await ready(area);
    await map(area).scrollIntoViewIfNeeded();
    const box = await map(area).boundingBox();
    await page.mouse.move(
      (box?.x ?? 0) + (box?.width ?? 0) / 2,
      (box?.y ?? 0) + (box?.height ?? 0) / 2,
    );
    const before = await page.evaluate(() => window.scrollY);

    await page.mouse.wheel(0, 300);

    await expect
      .poll(() => page.evaluate(() => window.scrollY))
      .toBeGreaterThan(before);
    await expect(area.getByRole("status")).toHaveText("Not moved yet");
  });

  test("on a narrow screen the map fits and the page doesn't scroll sideways", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    const area = preview(page, "map/basic");
    await ready(area);
    const box = await map(area).boundingBox();

    expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(320);
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth,
      ),
    ).toBeLessThanOrEqual(0);
  });

  test("the examples pass axe, one of them with a popup open", async ({
    page,
    isMobile,
  }) => {
    for (const name of ["basic", "markers", "view", "custom", "draggable"]) {
      await ready(preview(page, `map/${name}`));
    }
    await press(marker(preview(page, "map/basic"), "Berlin office"), isMobile);
    await expect(preview(page, "map/basic").getByRole("dialog")).toBeVisible();

    expect(
      (
        await new AxeBuilder({ page })
          .include("[data-preview]")
          .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
          .analyze()
      ).violations,
    ).toEqual([]);
  });
});
