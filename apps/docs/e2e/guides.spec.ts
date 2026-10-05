import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { expect, type Locator, test } from "@playwright/test";
import { open, rootStyle } from "./helpers";

const library = path.join(import.meta.dirname, "..", "..", "..", "packages/ui");

function style(locator: Locator, property: string) {
  return locator.evaluate(
    (element, name) => getComputedStyle(element).getPropertyValue(name).trim(),
    property,
  );
}

test.describe("theming page", () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
    await open(page, "/docs/theming");
  });

  test("the reference lists every token the package ships", async ({
    page,
  }) => {
    const css = readFileSync(path.join(library, "dist/tokens.css"), "utf8");
    const names = [...new Set(css.match(/--[\w-]+(?=\s*:)/g))];
    expect(names.length).toBeGreaterThan(100);

    // Most are printed in a table. The color scales are swatches, which
    // carry the token name in an attribute.
    const article = page.locator("article");
    const printed = await article.innerText();
    const swatches = await article
      .locator("[data-token]")
      .evaluateAll((items) =>
        items.map((item) => item.getAttribute("data-token")),
      );

    const missing = names.filter(
      (name) => !printed.includes(name) && !swatches.includes(name),
    );
    expect(missing).toEqual([]);
  });

  test("a token set on a section changes the components inside it only", async ({
    page,
  }) => {
    const preview = page.locator('[data-preview="theming/scope"]');
    const outside = preview.getByRole("button", { name: "Outside" });
    const inside = preview.getByRole("button", { name: "Inside .checkout" });

    expect(await style(inside, "background-color")).not.toBe(
      await style(outside, "background-color"),
    );
    expect(await style(outside, "border-radius")).toBe("6px");
    expect(await style(inside, "border-radius")).not.toBe("6px");
  });

  // The page tells people to override the semantic token on a section, not
  // the raw color behind it. This is the reason.
  test("a raw color set on a section doesn't reach the semantic token", async ({
    page,
  }) => {
    const preview = page.locator('[data-preview="theming/scope"]');
    const outside = preview.getByRole("button", { name: "Outside" });
    const wrapper = outside.locator("..");
    const before = await style(outside, "background-color");

    await wrapper.evaluate((element) =>
      element.style.setProperty("--color-blue-600", "rgb(255, 0, 0)"),
    );
    expect(await style(outside, "background-color")).toBe(before);

    await wrapper.evaluate((element) =>
      element.style.setProperty("--color-primary", "rgb(255, 0, 0)"),
    );
    expect(await style(outside, "background-color")).toBe("rgb(255, 0, 0)");
  });

  test("a dark section stays dark on a light page, its select list included", async ({
    page,
    isMobile,
  }) => {
    const preview = page.locator('[data-preview="theming/subtree"]');
    const section = preview.locator('[data-theme="dark"]');

    expect(await style(section, "background-color")).not.toBe(
      await style(page.locator("body"), "background-color"),
    );
    expect(await style(section, "--color-surface")).toBe(
      await rootStyle(page, "--color-gray-900"),
    );
    expect(await rootStyle(page, "--color-surface")).toBe(
      await rootStyle(page, "--color-white"),
    );

    const trigger = section.getByRole("combobox", { name: "Density" });
    await (isMobile ? trigger.tap() : trigger.click());

    // `container` puts the list inside the section. Left at the end of
    // <body> it would be white.
    const list = section.getByRole("listbox");
    await expect(list).toBeVisible();
    expect(await style(list, "--color-surface")).toBe(
      await rootStyle(page, "--color-gray-900"),
    );
  });
});

test.describe("scss page", () => {
  test("the example is styled by the stylesheet printed above it", async ({
    page,
    isMobile,
  }) => {
    await open(page, "/docs/scss");
    const preview = page.locator('[data-preview="scss/notice"]');
    const notice = preview.locator(".billing-notice");
    const link = preview.getByRole("link", { name: "Update card" });

    // The source on the page is the file that was compiled.
    await expect(preview).toContainText('@use "@nuvui/react/scss/mixins"');

    // breakpoint("sm"): one column on the phone, two from 40rem.
    const columns = (await style(notice, "grid-template-columns")).split(" ");
    expect(columns).toHaveLength(isMobile ? 1 : 2);

    // touch-target
    const box = await link.boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(44);
    expect(box?.width).toBeGreaterThanOrEqual(44);

    // focus-ring, which only shows for keyboard focus.
    await link.focus();
    await page.keyboard.press("Shift+Tab");
    await page.keyboard.press("Tab");
    await expect(link).toBeFocused();
    expect(await style(link, "outline-style")).toBe("solid");
    expect(await style(link, "outline-width")).toBe("2px");
  });

  test("the table lists every mixin in the shipped file", async ({ page }) => {
    await open(page, "/docs/scss");
    const scss = readFileSync(
      path.join(library, "dist/scss/styles/_mixins.scss"),
      "utf8",
    );
    const mixins = [...scss.matchAll(/^@mixin\s+([\w-]+)/gm)].map(
      ([, name]) => name,
    );
    expect(mixins.length).toBeGreaterThan(5);

    const table = page.getByRole("region", { name: "Mixins" });
    for (const name of mixins) {
      await expect(
        table.getByRole("rowheader", { name: new RegExp(`^${name}(\\(|$)`) }),
      ).toBeVisible();
    }
  });
});

test.describe("tailwind page", () => {
  for (const colorScheme of ["light", "dark"] as const) {
    test(`the semantic colors work as utilities in ${colorScheme}`, async ({
      page,
    }) => {
      await page.emulateMedia({ colorScheme, reducedMotion: "reduce" });
      await open(page, "/docs/tailwind");
      await expect(page.locator("html")).toHaveAttribute(
        "data-theme",
        colorScheme,
      );

      const card = page.locator('[data-preview="tailwind/tokens"] .bg-surface');
      const badge = card.getByText("Current");
      const button = page
        .locator('[data-preview="tailwind/utilities"]')
        .getByRole("button", { name: "As it comes" });

      // bg-primary and a primary Button read the same token.
      expect(await style(badge, "background-color")).toBe(
        await style(button, "background-color"),
      );
      expect(await style(badge, "color")).toBe(await style(button, "color"));
      // bg-surface
      expect(await style(card, "background-color")).not.toBe(
        "rgba(0, 0, 0, 0)",
      );
    });
  }

  test("a utility class wins over the component's own styles", async ({
    page,
  }) => {
    await open(page, "/docs/tailwind");
    const preview = page.locator('[data-preview="tailwind/utilities"]');
    const plain = preview.getByRole("button", { name: "As it comes" });
    const rounded = preview.getByRole("button", { name: "With two utilities" });

    expect(await style(plain, "border-radius")).toBe("6px");
    expect(await style(plain, "padding-left")).toBe("16px");
    // rounded-full is an enormous radius, not a percentage.
    expect(
      Number.parseFloat(await style(rounded, "border-radius")),
    ).toBeGreaterThan(1000);
    expect(await style(rounded, "padding-left")).toBe("32px");
  });
});

test.describe("changelog page", () => {
  test("shows the released versions, or says there are none yet", async ({
    page,
  }) => {
    await open(page, "/docs/changelog");
    const article = page.locator("article");

    // Changesets writes this file the first time a version is cut.
    const changelog = path.join(library, "CHANGELOG.md");
    const released =
      existsSync(changelog) && /^## /m.test(readFileSync(changelog, "utf8"));

    if (released) {
      await expect(
        article.getByRole("heading", { level: 2, name: /^\d+\.\d+\.\d+/ }),
      ).not.toHaveCount(0);
      await expect(article).not.toContainText("has been published yet");
    } else {
      await expect(article).toContainText(
        "No version of @nuvui/react has been published yet.",
      );
    }
  });

  test("lists the changes waiting for a release", async ({ page }) => {
    // Every changeset that names the package, the same ones the page reads.
    const dir = path.join(library, "..", "..", ".changeset");
    const notes = readdirSync(dir)
      .filter((name) => name.endsWith(".md") && name !== "README.md")
      .filter((name) =>
        readFileSync(path.join(dir, name), "utf8").includes("@nuvui/react"),
      );
    test.skip(notes.length === 0, "nothing is waiting for a release");

    await open(page, "/docs/changelog");
    const article = page.locator("article");

    // The heading comes from a component, so its entry in the table of
    // contents is added by hand. The id is what that entry links to.
    const heading = article.getByRole("heading", {
      level: 2,
      name: "Not released yet",
    });
    await expect(heading).toBeVisible();
    await expect(heading).toHaveAttribute("id", "not-released-yet");
    await expect(article.locator("[data-pending] > ul > li")).toHaveCount(
      notes.length,
    );
  });
});
