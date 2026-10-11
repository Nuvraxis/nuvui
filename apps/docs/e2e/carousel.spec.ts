import { expect, type Locator, type Page, test } from "@playwright/test";
import { open, press, scrollSettled } from "./helpers";

// The rendered example. The figure around it also holds the example's
// source, where the same words turn up again.
const preview = (page: Page, name: string) =>
  page.locator(`[data-preview="${name}"] > div:first-child`);
const playground = (page: Page) => page.locator("[data-playground]");
// The dot a carousel is at, by its name.
const current = (within: Locator) =>
  within.locator('.nuv-carousel__dot[aria-current="true"]');
// Which slides are within reach: "o" for one that is, "x" for one that isn't.
const reach = (within: Locator) =>
  within
    .locator(".nuv-carousel__item")
    .evaluateAll((slides) =>
      slides.map((slide) => (slide.hasAttribute("inert") ? "x" : "o")).join(""),
    );

test.describe("carousel page", () => {
  test.beforeEach(async ({ page }) => {
    await open(page, "/docs/components/carousel");
  });

  test("it's a carousel of named slides, and the buttons go on and back", async ({
    page,
    isMobile,
  }) => {
    const area = preview(page, "carousel/basic");
    const carousel = area.getByRole("region", { name: "Getting started" });
    await expect(carousel).toHaveAttribute("aria-roledescription", "carousel");
    await expect(area.getByRole("group", { name: "1 of 3" })).toHaveAttribute(
      "aria-roledescription",
      "slide",
    );
    await expect(current(area)).toHaveAccessibleName("Go to slide 1");
    await expect(
      area.getByRole("button", { name: "Previous slide" }),
    ).toBeDisabled();

    await press(area.getByRole("button", { name: "Next slide" }), isMobile);
    await expect(current(area)).toHaveAccessibleName("Go to slide 2");
    await expect(area.getByText("Invite the team")).toBeInViewport();
    await expect(area.getByRole("status")).toHaveText("Slide 2 of 3");

    await press(area.getByRole("button", { name: "Next slide" }), isMobile);
    await expect(current(area)).toHaveAccessibleName("Go to slide 3");
    await expect(
      area.getByRole("button", { name: "Next slide" }),
    ).toBeDisabled();

    await press(area.getByRole("button", { name: "Previous slide" }), isMobile);
    await expect(current(area)).toHaveAccessibleName("Go to slide 2");
  });

  test("a dot goes straight to its slide, and a slide out of sight is out of reach", async ({
    page,
    isMobile,
  }) => {
    const area = preview(page, "carousel/basic");
    await expect.poll(() => reach(area)).toBe("oxx");

    await press(area.getByRole("button", { name: "Go to slide 3" }), isMobile);

    await expect(current(area)).toHaveAccessibleName("Go to slide 3");
    await expect(area.getByText("Connect billing")).toBeInViewport();
    await expect.poll(() => reach(area)).toBe("xxo");
  });

  test("a drag across the slides moves on to the next", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "A drag with a mouse. A swipe is checked by hand.");
    const area = preview(page, "carousel/basic");
    await area.scrollIntoViewIfNeeded();
    await scrollSettled(page);
    const box = await area.locator(".nuv-carousel__viewport").boundingBox();
    if (!box) throw new Error("the slides aren't there");
    const y = box.y + box.height / 2;

    await page.mouse.move(box.x + box.width * 0.8, y);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.2, y, { steps: 8 });
    await page.mouse.up();

    await expect(current(area)).toHaveAccessibleName("Go to slide 2");
  });

  test("with several in view, the ones that show can be reached and the rest can't", async ({
    page,
    isMobile,
  }) => {
    const area = preview(page, "carousel/several");
    await expect.poll(() => reach(area)).toBe("oooxx");

    await press(area.getByRole("button", { name: "Next slide" }), isMobile);

    await expect.poll(() => reach(area)).toBe("xooox");
  });

  test("up and down, on goes down a slide", async ({ page, isMobile }) => {
    const area = preview(page, "carousel/vertical");
    await expect(
      area.getByRole("region", { name: "This week" }),
    ).toHaveAttribute("data-orientation", "vertical");
    await expect.poll(() => reach(area)).toBe("oxxx");

    await press(area.getByRole("button", { name: "Next slide" }), isMobile);

    await expect.poll(() => reach(area)).toBe("xoxx");
    await expect(area.getByText("Tuesday")).toBeInViewport();
  });

  test("a thumbnail goes to its slide and is marked", async ({
    page,
    isMobile,
  }) => {
    const area = preview(page, "carousel/thumbnails");
    const thumbnail = (name: string) => area.getByRole("button", { name });
    await expect(thumbnail("Front")).toHaveAttribute("aria-current", "true");

    await press(thumbnail("Detail"), isMobile);

    await expect(thumbnail("Detail")).toHaveAttribute("aria-current", "true");
    await expect(thumbnail("Front")).not.toHaveAttribute("aria-current");
    await expect.poll(() => reach(area)).toBe("xxxo");
  });

  test("one that moves by itself has a button that stops it, and says what it would do", async ({
    page,
    isMobile,
  }) => {
    const area = preview(page, "carousel/autoplay");
    const stop = area.getByRole("button", { name: "Stop the slides moving" });
    await expect(stop).toBeVisible();

    await press(stop, isMobile);

    const start = area.getByRole("button", { name: "Start the slides moving" });
    await expect(start).toBeVisible();
    await expect(start).not.toHaveAttribute("data-playing");
    // Stopped, it's where it was six seconds on, which is past when it
    // would have moved.
    const dot = await current(area).getAttribute("aria-label");
    await page.waitForTimeout(6000);
    expect(await current(area).getAttribute("aria-label")).toBe(dot);
  });

  test("the keyboard reaching one that moves by itself stops it", async ({
    page,
    isMobile,
    browserName,
  }) => {
    test.skip(isMobile, "A phone has no Tab key.");
    // Safari leaves anything that isn't a field out of the Tab order
    // unless a setting is changed.
    test.skip(browserName === "webkit", "Safari's Tab skips buttons.");
    const area = preview(page, "carousel/autoplay");
    const first = area.locator(".nuv-carousel__button").first();
    await expect(first).toHaveAttribute("data-playing", "");
    // From the last thing before it, with Tab.
    await first.focus();
    await page.keyboard.press("Shift+Tab");
    await page.keyboard.press("Tab");

    await expect(first).toBeFocused();
    await expect(first).not.toHaveAttribute("data-playing");
    await expect(first).toHaveAccessibleName("Start the slides moving");
  });

  test("the playground changes the carousel and the code together", async ({
    page,
  }) => {
    const area = playground(page);
    const carousel = area.getByRole("region", { name: "Steps" });
    await expect(carousel).toHaveAttribute("data-orientation", "horizontal");
    await expect(area.locator(".nuv-carousel__dot")).toHaveCount(4);
    await expect(
      area.getByRole("button", { name: "Previous slide" }),
    ).toBeDisabled();

    await area.getByLabel("orientation").selectOption("vertical");
    await area.getByLabel("loop").check();
    await area.getByLabel("dots").uncheck();

    await expect(carousel).toHaveAttribute("data-orientation", "vertical");
    await expect(area.locator(".nuv-carousel__dot")).toHaveCount(0);
    await expect(
      area.getByRole("button", { name: "Previous slide" }),
    ).toBeEnabled();
    await expect(area.locator("pre")).toContainText(
      '<Carousel aria-label="Steps" orientation="vertical" loop>',
    );
    await expect(area.locator("pre")).not.toContainText("<CarouselDots />");
  });
});
