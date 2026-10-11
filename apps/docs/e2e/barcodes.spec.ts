import { expect, type Page, test } from "@playwright/test";
import { open, press } from "./helpers";

// The rendered example. The figure around it also holds the example's
// source, where the same words turn up again.
const preview = (page: Page, name: string) =>
  page.locator(`[data-preview="${name}"] > div:first-child`);
const playground = (page: Page) => page.locator("[data-playground]");
const fill = (page: Page, selector: string) =>
  page
    .locator(selector)
    .first()
    .evaluate((element) => getComputedStyle(element).fill);

test.describe("barcodes start page", () => {
  test("says what to install and names the two components", async ({
    page,
  }) => {
    await open(page, "/docs/barcodes");
    const article = page.locator("article").first();

    await expect(
      article.getByText("pnpm add @nuvui/barcodes @nuvui/react").first(),
    ).toBeVisible();
    await expect(
      article.getByRole("link", { name: "Barcode", exact: true }),
    ).toHaveAttribute("href", "/docs/barcodes/barcode");
    await expect(
      article.getByRole("link", { name: "QRCode", exact: true }),
    ).toHaveAttribute("href", "/docs/barcodes/qrcode");
  });
});

test.describe("barcode page", () => {
  test.beforeEach(async ({ page }) => {
    await open(page, "/docs/barcodes/barcode");
  });

  test("it's a picture named for what it's for, with its value written under it", async ({
    page,
  }) => {
    const code = preview(page, "barcode/basic").getByRole("img", {
      name: "Order ORD-2026-001042",
    });

    await expect(code).toBeVisible();
    await expect(code).toHaveAttribute("data-type", "code128");
    await expect(code.locator(".nuv-barcode__text")).toHaveText(
      "ORD-2026-001042",
    );
  });

  test("it's black on white, whatever the page's theme", async ({ page }) => {
    await page.evaluate(() => {
      document.documentElement.classList.add("dark");
      document.documentElement.dataset.theme = "dark";
    });

    expect(await fill(page, ".nuv-barcode__bars")).toBe("rgb(0, 0, 0)");
    expect(await fill(page, ".nuv-barcode__ground")).toBe("rgb(255, 255, 255)");
  });

  test("each kind is drawn, with the check digit it worked out", async ({
    page,
  }) => {
    const area = preview(page, "barcode/types");

    await expect(area.locator(".nuv-barcode")).toHaveCount(6);
    await expect(area.locator("[data-invalid]")).toHaveCount(0);
    // Twelve digits went in, and the thirteenth is written with them.
    await expect(
      area.locator('[data-type="ean13"] .nuv-barcode__text'),
    ).toHaveText(["5", "901234", "123457"]);
  });

  test("the playground changes the kind, and a value the kind can't hold is a box and no bars", async ({
    page,
  }) => {
    const area = playground(page);
    const code = area.locator(".nuv-barcode");
    await expect(code).toHaveAttribute("data-type", "code128");

    await area.getByLabel("type").selectOption("ean13");
    await expect(code).toHaveAttribute("data-type", "ean13");
    await expect(area.getByLabel("value")).toHaveValue("590123412345");
    await expect(area.locator("pre").first()).toContainText('type="ean13"');

    await area.getByLabel("value").fill("59012341234X");
    await expect(code).toHaveAttribute("data-invalid", "");
    await expect(code.locator(".nuv-barcode__bars")).toHaveCount(0);

    await area.getByLabel("value").fill("400638133393");
    await expect(code).not.toHaveAttribute("data-invalid", "");
    await expect(code.locator(".nuv-barcode__text")).toHaveText([
      "4",
      "006381",
      "333931",
    ]);
  });

  test("a value that can't be a barcode is a box, or what the page gives for it", async ({
    page,
  }) => {
    const area = preview(page, "barcode/fallback");

    await expect(area.locator(".nuv-barcode[data-invalid]")).toHaveCount(1);
    await expect(area.getByText("isn't an EAN-13")).toBeVisible();
  });

  test("it's saved as an SVG or a PNG, under the name it's given", async ({
    page,
    isMobile,
  }) => {
    const area = preview(page, "barcode/download");

    const svg = page.waitForEvent("download");
    await press(area.getByRole("button", { name: "Save as SVG" }), isMobile);
    expect((await svg).suggestedFilename()).toBe("parcel-7781.svg");

    const png = page.waitForEvent("download");
    await press(area.getByRole("button", { name: "Save as PNG" }), isMobile);
    expect((await png).suggestedFilename()).toBe("parcel-7781.png");
  });

  test("no barcode on the page makes the page wider than the screen", async ({
    page,
  }) => {
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  });
});

test.describe("QR code page", () => {
  test.beforeEach(async ({ page }) => {
    await open(page, "/docs/barcodes/qrcode");
  });

  test("it's a square picture named for what scanning it does", async ({
    page,
  }) => {
    const code = preview(page, "qrcode/basic").getByRole("img", {
      name: "Open the nuvui docs",
    });

    await expect(code).toBeVisible();
    await expect(code).toHaveAttribute("data-error-correction", "M");
    const box = await code.boundingBox();
    expect(box?.width).toBe(box?.height);
  });

  test("it's black on white, whatever the page's theme", async ({ page }) => {
    await page.evaluate(() => {
      document.documentElement.classList.add("dark");
      document.documentElement.dataset.theme = "dark";
    });

    expect(await fill(page, ".nuv-qrcode__squares")).toBe("rgb(0, 0, 0)");
    expect(await fill(page, ".nuv-qrcode__ground")).toBe("rgb(255, 255, 255)");
  });

  test("a higher level of error correction is a code with more squares", async ({
    page,
  }) => {
    const codes = preview(page, "qrcode/levels").locator(".nuv-qrcode");
    const versions = await codes.evaluateAll((all) =>
      all.map((code) => Number((code as SVGElement).dataset.version)),
    );

    await expect(codes).toHaveCount(4);
    expect(versions).toEqual([...versions].sort((a, b) => a - b));
    expect(versions[3]).toBeGreaterThan(versions[0] ?? 0);
  });

  test("something over the middle raises the level, and the Swiss cross keeps the one a bill asks for", async ({
    page,
  }) => {
    const logo = preview(page, "qrcode/overlay").locator(".nuv-qrcode");
    await expect(logo).toHaveAttribute("data-error-correction", "H");
    await expect(logo.locator(".nuv-qrcode__overlay")).toHaveCount(1);

    const bill = preview(page, "qrcode/swiss").locator(".nuv-qrcode");
    await expect(bill).toHaveAttribute("data-error-correction", "M");
    await expect(bill.locator(".nuv-qrcode__cross-arms")).toHaveCount(1);
  });

  test("the playground changes the level, and nothing to encode is a box and no squares", async ({
    page,
  }) => {
    const area = playground(page);
    const code = area.locator(".nuv-qrcode");

    await area.getByLabel("errorCorrection").selectOption("H");
    await expect(code).toHaveAttribute("data-error-correction", "H");
    await expect(area.locator("pre").first()).toContainText(
      'errorCorrection="H"',
    );

    await area.getByLabel("value").fill("");
    await expect(code).toHaveAttribute("data-invalid", "");
    await expect(code.locator(".nuv-qrcode__squares")).toHaveCount(0);
  });

  test("it's saved as an SVG or a PNG, under the name it's given", async ({
    page,
    isMobile,
  }) => {
    const area = preview(page, "qrcode/download");

    const svg = page.waitForEvent("download");
    await press(area.getByRole("button", { name: "Save as SVG" }), isMobile);
    expect((await svg).suggestedFilename()).toBe("nuvui-docs.svg");

    const png = page.waitForEvent("download");
    await press(area.getByRole("button", { name: "Save as PNG" }), isMobile);
    expect((await png).suggestedFilename()).toBe("nuvui-docs.png");
  });
});
