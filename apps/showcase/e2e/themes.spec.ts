import AxeBuilder from "@axe-core/playwright";
import {
  createTheme,
  defaultChoice,
  encodeChoice,
  presetNames,
  presets,
  type ThemeChoice,
  toCss,
} from "@nuvui/theme";
import { expect, type Page, test } from "@playwright/test";
import { siteThemeKey } from "../src/lib/site-theme";
import { noLocks, shuffle } from "../src/lib/theme-builder";
import { open, pageProblems, press, settleStyles, wcag } from "./helpers";

// The Themes page. What every page of the site has to have is tested for
// it in site.spec.ts, which goes through the list of pages.

const path = "/themes";
const withTheme = (choice: Partial<ThemeChoice>) =>
  `${path}?preset=${encodeChoice(choice)}`;

const frame = (page: Page, mode: "light" | "dark") =>
  page.getByRole("region", { name: `Preview in ${mode}` });

// A color as the browser paints it, whatever notation it was written in.
const painted = (page: Page, color: string) =>
  page.evaluate((value) => {
    const probe = document.createElement("span");
    probe.style.color = value;
    document.body.append(probe);
    const result = getComputedStyle(probe).color;
    probe.remove();
    return result;
  }, color);

const background = (page: Page, selector: string) =>
  page
    .locator(selector)
    .first()
    .evaluate((node) => getComputedStyle(node).backgroundColor);

const code = (page: Page) => page.locator(".site-builder__code code");
const select = (page: Page, name: string) =>
  page.getByRole("combobox", { name, exact: true });

test.describe("the controls", () => {
  test("change the preview, in both modes, and leave the site alone", async ({
    page,
  }) => {
    await open(page, path);
    const header = await background(page, ".site-header");
    await select(page, "Brand color").selectOption("emerald");
    await select(page, "Base color").selectOption("stone");
    await expect(code(page)).toHaveText("1.emerald.stone.md.default.standard");

    const theme = createTheme({ brand: "emerald", base: "stone" });
    await page.getByRole("tab", { name: "Components" }).click();
    for (const mode of ["light", "dark"] as const) {
      const button = frame(page, mode).getByRole("button", {
        name: "Primary",
        exact: true,
      });
      await expect(button).toBeVisible();
      expect(
        await button.evaluate((node) => getComputedStyle(node).backgroundColor),
      ).toBe(await painted(page, theme[mode]["--color-primary"]));
      expect(
        await frame(page, mode).evaluate(
          (node) => getComputedStyle(node).backgroundColor,
        ),
      ).toBe(await painted(page, theme[mode]["--color-background"]));
    }

    // Nothing outside the previews has changed.
    await expect(page.locator("html")).not.toHaveAttribute("data-preset");
    expect(await background(page, ".site-header")).toBe(header);
  });

  test("radius and density reach the components", async ({ page }) => {
    await open(page, path);
    await page.getByRole("tab", { name: "Components" }).click();
    const button = frame(page, "light").getByRole("button", {
      name: "Primary",
      exact: true,
    });
    const shape = () =>
      button.evaluate((node) => {
        const style = getComputedStyle(node);
        return [style.borderTopLeftRadius, style.minHeight || style.height];
      });

    const before = await shape();
    await select(page, "Radius").selectOption("none");
    await expect.poll(async () => (await shape())[0]).toBe("0px");
    // A phone keeps its 44 pixel targets whatever the density, so the
    // height is only looked at with a mouse.
    await select(page, "Density").selectOption("compact");
    const after = await shape();
    expect(after[0]).not.toBe(before[0]);
  });

  test("a color of your own can be the brand color", async ({ page }) => {
    await open(page, path);
    await select(page, "Brand color").selectOption("custom");
    const own = page.getByLabel("Your color");
    await expect(own).toBeVisible();
    await own.fill("#0f766e");
    await expect(code(page)).toHaveText("1.x0f766e.gray.md.default.standard");

    const theme = createTheme({ brand: "#0f766e" });
    await page.getByRole("tab", { name: "Components" }).click();
    const button = frame(page, "light").getByRole("button", {
      name: "Primary",
      exact: true,
    });
    expect(
      await button.evaluate((node) => getComputedStyle(node).backgroundColor),
    ).toBe(await painted(page, theme.light["--color-primary"]));
  });

  test("a font is put in front of the system's, and a name that can't be one is refused", async ({
    page,
  }) => {
    await open(page, path);
    const font = page.getByRole("textbox", { name: "Font" });
    await font.fill("Public Sans");
    await expect(code(page)).toHaveText(
      "1.blue.gray.md.default.standard.Public+Sans",
    );
    expect(
      await frame(page, "light").evaluate(
        (node) => getComputedStyle(node).fontFamily,
      ),
    ).toMatch(/^"?Public Sans"?, /);

    // Anything that could end the declaration it's written into.
    await font.fill("x; color: red");
    await expect(page.getByText(/^Use letters, digits/)).toBeVisible();
    await expect(font).toHaveAttribute("aria-invalid", "true");
    await expect(code(page)).toHaveText(
      "1.blue.gray.md.default.standard.Public+Sans",
    );

    await font.fill("");
    await expect(code(page)).toHaveText("1.blue.gray.md.default.standard");
  });

  test("a preset is a place to start from", async ({ page, isMobile }) => {
    await open(page, path);
    const ledger = page.getByRole("button", { name: "Ledger", exact: true });
    await press(ledger, isMobile);
    await expect(code(page)).toHaveText(encodeChoice(presets.ledger));
    await expect(ledger).toHaveAttribute("aria-pressed", "true");
    await expect(select(page, "Brand color")).toHaveValue("teal");
    await expect(select(page, "Radius")).toHaveValue("none");

    await select(page, "Radius").selectOption("lg");
    await expect(ledger).toHaveAttribute("aria-pressed", "false");
  });
});

test.describe("shuffle", () => {
  test("changes what isn't locked, and says what it chose", async ({
    page,
    isMobile,
  }) => {
    await open(page, path);
    await select(page, "Base color").selectOption("olive");
    await press(
      page.getByRole("button", { name: "Lock base color" }),
      isMobile,
    );
    await press(page.getByRole("button", { name: "Lock contrast" }), isMobile);

    const seen = new Set<string>();
    for (let turn = 0; turn < 6; turn += 1) {
      const before = await code(page).textContent();
      await press(
        page.getByRole("button", { name: "Shuffle", exact: true }),
        isMobile,
      );
      await expect(code(page)).not.toHaveText(before ?? "");
      const now = (await code(page).textContent()) ?? "";
      seen.add(now);
      const [, , base, , , contrast] = now.split(".");
      expect(base).toBe("olive");
      expect(contrast).toBe("standard");
    }
    expect(seen.size).toBeGreaterThan(1);
    await expect(page.locator("[data-builder-status]")).toHaveText(
      /^Shuffled: /,
    );
  });

  test("never makes a theme that fails its contrast checks", () => {
    // createTheme throws on a theme with a pair that falls short.
    let choice: ThemeChoice = defaultChoice;
    const codes = new Set<string>();
    for (let turn = 0; turn < 400; turn += 1) {
      const next = shuffle(choice, noLocks);
      expect(encodeChoice(next)).not.toBe(encodeChoice(choice));
      expect(() => createTheme(next)).not.toThrow();
      codes.add(encodeChoice(next));
      choice = next;
    }
    expect(codes.size).toBeGreaterThan(200);
  });

  test("with everything locked, changes nothing", () => {
    const all = { ...noLocks };
    for (const axis of Object.keys(all) as (keyof typeof all)[]) {
      all[axis] = true;
    }
    expect(shuffle(defaultChoice, all)).toBe(defaultChoice);
  });
});

test.describe("the address", () => {
  test("holds the theme, and a link to it restores it", async ({ page }) => {
    await open(page, path);
    await expect(page).toHaveURL(/\/themes$/);
    await select(page, "Brand color").selectOption("rose");
    await select(page, "Density").selectOption("comfortable");
    await expect(page).toHaveURL(
      /\/themes\?preset=1\.rose\.gray\.md\.comfortable\.standard$/,
    );

    // The same address in a new page.
    const address = page.url();
    await page.goto("about:blank");
    await open(page, address);
    await expect(select(page, "Brand color")).toHaveValue("rose");
    await expect(select(page, "Density")).toHaveValue("comfortable");
    await expect(code(page)).toHaveText("1.rose.gray.md.comfortable.standard");

    // The default theme needs nothing in the address.
    await page.getByRole("button", { name: "Reset" }).click();
    await expect(page).toHaveURL(/\/themes$/);
  });

  test("with something that isn't a theme in it, the page starts from the default", async ({
    page,
  }) => {
    const problems = pageProblems(page);
    for (const bad of [
      "nonsense",
      "2.blue.gray.md.default.standard",
      "1.blue",
    ]) {
      await open(page, `${path}?preset=${bad}`);
      await expect(code(page)).toHaveText(encodeChoice(defaultChoice));
    }
    await open(
      page,
      `${path}?preset=${encodeURIComponent("1.blue.gray.md.default.standard.x;}body{display:none")}`,
    );
    await expect(code(page)).toHaveText(encodeChoice(defaultChoice));
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    expect(problems).toEqual([]);
  });

  test("is what Copy link copies", async ({ page, isMobile, browserName }) => {
    test.skip(
      browserName !== "chromium",
      "Only Chromium lets a test read the clipboard.",
    );
    await open(page, withTheme(presets.meadow));
    await press(page.getByRole("button", { name: "Copy link" }), isMobile);
    await expect(page.locator("[data-builder-status]")).toHaveText(
      "Link copied.",
    );
    const copied = await page.evaluate(() => navigator.clipboard.readText());
    expect(new URL(copied).pathname).toBe(path);
    expect(new URL(copied).searchParams.get("preset")).toBe(
      encodeChoice(presets.meadow),
    );
  });
});

test.describe("the tokens", () => {
  test("are the generator's CSS, SCSS and Tailwind for the theme shown", async ({
    page,
    isMobile,
  }) => {
    await open(page, withTheme(presets.ember));
    await press(page.getByRole("button", { name: "Get tokens" }), isMobile);
    const dialog = page.getByRole("dialog", { name: "Tokens for this theme" });
    await expect(dialog).toBeVisible();

    const shown = () =>
      dialog
        .getByRole("tabpanel")
        .locator("pre")
        .evaluate((pre) => pre.textContent ?? "");
    expect(await shown()).toBe(toCss(createTheme(presets.ember)));

    await press(dialog.getByRole("tab", { name: "SCSS" }), isMobile);
    expect(await shown()).toContain("@include nuv.dark {");
    await press(dialog.getByRole("tab", { name: "Tailwind v4" }), isMobile);
    expect(await shown()).toMatch(/^@theme \{/);
  });

  test("pasted into a page with nothing else, give the theme that was previewed", async ({
    page,
    isMobile,
  }) => {
    await open(page, withTheme(presets.ember));
    await page.getByRole("tab", { name: "Components" }).click();
    const previewed: Record<string, string> = {};
    for (const mode of ["light", "dark"] as const) {
      previewed[mode] = await frame(page, mode)
        .getByRole("button", { name: "Primary", exact: true })
        .evaluate((node) => {
          const style = getComputedStyle(node);
          return [
            style.backgroundColor,
            style.color,
            style.borderTopLeftRadius,
          ].join(" | ");
        });
    }

    await press(page.getByRole("button", { name: "Get tokens" }), isMobile);
    const css = await page
      .getByRole("dialog", { name: "Tokens for this theme" })
      .getByRole("tabpanel")
      .locator("pre")
      .evaluate((pre) => pre.textContent ?? "");

    // The home page is this site with no theme of its own: the library's
    // stylesheet and nothing over it. Its first button is a primary one.
    // The CSS is in the page from the start, as it would be in a real one.
    for (const mode of ["light", "dark"] as const) {
      await page.addInitScript(
        ([value, text]) => {
          localStorage.setItem("theme", value as string);
          document.addEventListener("DOMContentLoaded", () => {
            const style = document.createElement("style");
            style.textContent = text as string;
            document.head.append(style);
          });
        },
        [mode, css],
      );
      await open(page, "/");
      await expect(page.locator("html")).toHaveAttribute("data-theme", mode);
      await settleStyles(page);
      // The button's color changes over a moment, so this waits for where
      // it ends up.
      await expect
        .poll(
          () =>
            page.getByRole("link", { name: "Get started" }).evaluate((node) => {
              const style = getComputedStyle(node);
              return [
                style.backgroundColor,
                style.color,
                style.borderTopLeftRadius,
              ].join(" | ");
            }),
          { message: mode },
        )
        .toBe(previewed[mode]);
    }
  });

  test("can be downloaded as a file", async ({ page, isMobile }) => {
    await open(page, withTheme(presets.ink));
    await press(page.getByRole("button", { name: "Get tokens" }), isMobile);
    const waiting = page.waitForEvent("download");
    await press(
      page.getByRole("button", { name: "Download nuvui-theme.css" }),
      isMobile,
    );
    const download = await waiting;
    expect(download.suggestedFilename()).toBe("nuvui-theme.css");
    const stream = await download.createReadStream();
    let text = "";
    for await (const chunk of stream) text += chunk;
    expect(text).toBe(toCss(createTheme(presets.ink)));
  });
});

test.describe("on the whole site", () => {
  const put = (page: Page) =>
    page.getByRole("button", { name: "Put it on the whole site" });
  const primary = (page: Page) =>
    page
      .getByRole("link", { name: "Get started" })
      .evaluate((node) => getComputedStyle(node).backgroundColor);

  test("a theme stays, is there before the page is drawn, and can be taken off", async ({
    page,
    isMobile,
  }) => {
    await page.addInitScript(() => localStorage.setItem("theme", "light"));
    await open(page, "/");
    const plain = await primary(page);

    await open(page, withTheme(presets.meadow));
    await press(put(page), isMobile);
    await expect(page.locator("html")).toHaveAttribute("data-preset", "site");
    await expect(
      page.getByText("This theme is on the whole site."),
    ).toBeVisible();
    const stored = await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key) ?? "null"),
      siteThemeKey,
    );
    expect(stored.code).toBe(encodeChoice(presets.meadow));

    // What the attribute is when the document has been read and nothing
    // has run but the scripts in its head.
    await page.addInitScript(() => {
      document.addEventListener("DOMContentLoaded", () => {
        (window as unknown as { early: string | null }).early =
          document.documentElement.getAttribute("data-preset");
      });
    });
    await open(page, "/");
    expect(
      await page.evaluate(
        () => (window as unknown as { early: string | null }).early,
      ),
    ).toBe("site");
    const themed = await primary(page);
    expect(themed).not.toBe(plain);
    expect(themed).toBe(
      await painted(page, createTheme(presets.meadow).light["--color-primary"]),
    );

    // The builder starts from the theme the site has.
    await open(page, path);
    await expect(code(page)).toHaveText(encodeChoice(presets.meadow));
    await press(
      page.getByRole("button", { name: "Take it off the site" }),
      isMobile,
    );
    await expect(page.locator("html")).not.toHaveAttribute("data-preset");
    await expect(put(page)).toBeVisible();
    await open(page, "/");
    expect(await primary(page)).toBe(plain);
  });

  test("the previews keep the theme being made, not the site's", async ({
    page,
    isMobile,
  }) => {
    await open(page, withTheme(presets.meadow));
    await press(put(page), isMobile);
    await select(page, "Brand color").selectOption("red");
    await page.getByRole("tab", { name: "Components" }).click();

    const inPreview = await frame(page, "light")
      .getByRole("button", { name: "Primary", exact: true })
      .evaluate((node) => getComputedStyle(node).backgroundColor);
    expect(inPreview).toBe(
      await painted(
        page,
        createTheme({ ...presets.meadow, brand: "red" }).light[
          "--color-primary"
        ],
      ),
    );
    // A button's color changes over a moment after a press near it, so
    // this waits for where it ends up.
    const site = await painted(
      page,
      createTheme(presets.meadow).light["--color-primary"],
    );
    await expect
      .poll(() =>
        page
          .getByRole("button", { name: "Get tokens" })
          .evaluate((node) => getComputedStyle(node).backgroundColor),
      )
      .toBe(site);
  });

  test("something stored that isn't a theme is ignored", async ({ page }) => {
    const problems = pageProblems(page);
    for (const junk of ["not json", '{"code":5}', '{"css":"body{}"}', "[]"]) {
      await page.addInitScript(
        ([key, value]) => localStorage.setItem(key as string, value as string),
        [siteThemeKey, junk],
      );
      await open(page, "/");
      await expect(page.locator("html")).not.toHaveAttribute("data-preset");
    }
    expect(problems).toEqual([]);
  });
});

test.describe("the preview", () => {
  test("shows one mode or both, side by side when there's room", async ({
    page,
    isMobile,
  }) => {
    await open(page, path);
    const frames = page.locator(".site-preview__frame");
    await expect(frames).toHaveCount(2);
    const [light, dark] = await Promise.all(
      (["light", "dark"] as const).map((mode) =>
        frame(page, mode).evaluate(
          (node) => getComputedStyle(node).backgroundColor,
        ),
      ),
    );
    expect(light).not.toBe(dark);

    const first = await frames.nth(0).boundingBox();
    const second = await frames.nth(1).boundingBox();
    const wide = (page.viewportSize()?.width ?? 0) >= 1280;
    if (wide) expect(second?.y).toBe(first?.y);
    else expect(second?.y).toBeGreaterThan(first?.y ?? 0);

    const modes = page.getByRole("radiogroup", { name: "Modes shown" });
    await press(modes.getByRole("radio", { name: "Dark" }), isMobile);
    await expect(frames).toHaveCount(1);
    await expect(frames).toHaveAttribute("data-theme", "dark");
    // Pressing the one that's pressed doesn't leave nothing shown.
    await press(modes.getByRole("radio", { name: "Dark" }), isMobile);
    await expect(frames).toHaveCount(1);
  });

  test("is the same theme in each mode whatever mode the site is in", async ({
    page,
  }) => {
    const seen: string[] = [];
    for (const mode of ["light", "dark"] as const) {
      await page.addInitScript(
        (value) => localStorage.setItem("theme", value),
        mode,
      );
      await open(page, path);
      seen.push(
        await frame(page, "dark").evaluate(
          (node) => getComputedStyle(node).backgroundColor,
        ),
      );
    }
    expect(seen[0]).toBe(seen[1]);
  });

  for (const name of presetNames) {
    for (const view of ["Forms", "Components"]) {
      test(`${view} in ${name} has no axe violations, in light and in dark`, async ({
        page,
      }) => {
        await page.emulateMedia({ reducedMotion: "reduce" });
        await open(page, withTheme(presets[name]));
        await page.getByRole("tab", { name: view }).click();
        await expect(frame(page, "dark")).toBeVisible();

        await settleStyles(page);
        const results = await new AxeBuilder({ page })
          .include(".site-preview")
          .withTags(wcag)
          .analyze();
        expect(results.violations).toEqual([]);
      });
    }
  }
});

test.describe("the contrast report", () => {
  test("says every pair passes, and lists them", async ({ page, isMobile }) => {
    await open(page, withTheme(presets["high-contrast"]));
    const summary = page.locator(".site-contrast__summary");
    await expect(summary).toHaveText(/^All \d+ pairs pass/);
    await expect(summary).toHaveAttribute("data-failures", "0");
    await expect(page.locator(".site-contrast__closest")).toContainText(
      /needs (3|4\.5|7):1/,
    );

    await press(page.getByRole("button", { name: "Every pair" }), isMobile);
    const table = page.getByRole("table", {
      name: "Contrast of every pair of colors",
    });
    const pairs = Number(
      ((await summary.textContent()) ?? "").match(/\d+/)?.[0],
    );
    await expect(table.getByRole("row")).toHaveCount(pairs + 1);
  });
});

test.describe("on a phone", () => {
  test("every control is big enough to tap", async ({ page, isMobile }) => {
    test.skip(!isMobile);
    await open(page, path);
    const controls = page.locator(
      ".site-builder__panel button, .site-builder__panel select, .site-builder__panel input",
    );
    const count = await controls.count();
    expect(count).toBeGreaterThan(15);
    for (let index = 0; index < count; index += 1) {
      const box = await controls.nth(index).boundingBox();
      expect(box?.height, `control ${index}`).toBeGreaterThanOrEqual(44);
    }
  });
});
