import { readFileSync } from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";
import { isNew } from "../lib/new-pages";
import { open } from "./helpers";

// What a page's frontmatter says of when it was added, if it says.
function added(page: string) {
  const text = readFileSync(
    path.join(
      import.meta.dirname,
      "..",
      "content",
      "docs",
      "components",
      `${page}.mdx`,
    ),
    "utf8",
  );
  return text.match(/^added: "(.+)"$/m)?.[1];
}

test.describe("which pages are new", () => {
  const now = new Date("2026-10-20T12:00:00Z");

  test("a page is new for sixty days from the day it was added", () => {
    expect(isNew("2026-10-11", now)).toBe(true);
    expect(isNew("2026-08-22", now)).toBe(true);
    expect(isNew("2026-08-21", now)).toBe(false);
  });

  test("a page with no day isn't, and nor is one added on a day to come", () => {
    expect(isNew(undefined, now)).toBe(false);
    expect(isNew("2026-10-21", now)).toBe(false);
  });

  test("a day written another way is refused, so a slip stops the build", () => {
    expect(() => isNew("11/10/2026", now)).toThrow(/has to be a day like/);
    expect(() => isNew("2026-13-45", now)).toThrow(/has to be a day like/);
  });
});

test.describe("the New badge", () => {
  // The badge goes when the sixty days are up, and these tests with it:
  // what they expect is worked out from the same rule the site is built by.
  const carouselIsNew = isNew(added("carousel"));

  test("is beside the name of a page that's new, and not beside one that isn't", async ({
    page,
  }) => {
    expect(added("button")).toBe(undefined);

    await open(page, "/docs/components/carousel");
    await expect(page.locator("h1 [data-new]")).toHaveCount(
      carouselIsNew ? 1 : 0,
    );
    await expect(page.locator("h1")).toHaveText(
      carouselIsNew ? "Carousel New" : "Carousel",
    );

    await open(page, "/docs/components/button");
    await expect(page.locator("h1 [data-new]")).toHaveCount(0);
    await expect(page.locator("h1")).toHaveText("Button");
  });

  test("is in the menu too, on the pages that are new and no others", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "The menu is behind a button on a phone.");
    test.skip(!carouselIsNew, "No page is new any more.");
    await open(page, "/docs/components/button");
    const menu = page.locator("#nd-sidebar");

    await expect(
      menu.getByRole("link", { name: "Carousel New", exact: true }),
    ).toBeVisible();
    await expect(
      menu.getByRole("link", { name: "Button", exact: true }),
    ).toBeVisible();
  });

  test("shines twice and then is still", async ({ page }) => {
    test.skip(!carouselIsNew, "No page is new any more.");
    await open(page, "/docs/components/carousel");
    const shine = page.locator("h1 [data-new] .nuv-text-shimmer");

    await expect(shine).toHaveCSS("animation-iteration-count", "2");
    // Twice across at two seconds each, and nothing is moving after.
    await expect
      .poll(
        () =>
          shine.evaluate(
            (element) =>
              element
                .getAnimations()
                .filter((animation) => animation.playState === "running")
                .length,
          ),
        { timeout: 8000 },
      )
      .toBe(0);
  });

  test("doesn't shine at all for someone who asked for less motion", async ({
    page,
  }) => {
    test.skip(!carouselIsNew, "No page is new any more.");
    await page.emulateMedia({ reducedMotion: "reduce" });
    await open(page, "/docs/components/carousel");

    await expect(page.locator("h1 [data-new]")).toHaveText("New");
    await expect(page.locator("h1 [data-new] .nuv-text-shimmer")).toHaveCSS(
      "animation-name",
      "none",
    );
  });
});
