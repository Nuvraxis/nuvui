import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { expect, type Page, test } from "@playwright/test";
import tailwind from "@tailwindcss/postcss";
import postcss from "postcss";

// The Tailwind guide says what each way of combining the two stylesheets
// does. This site can only be set up one way, so the others are compiled
// here, with the same Tailwind the site uses, and measured in the browser.
// If one of these fails, the guide is wrong and needs changing with it.

const app = path.join(import.meta.dirname, "..", "app");
const library = path.join(import.meta.dirname, "..", "..", "..", "packages/ui");
const libraryCss = readFileSync(path.join(library, "dist/styles.css"), "utf8");

// `source(none)` stops Tailwind scanning this app for class names. Each
// setup names the utilities it wants instead.
const tailwindWith = (utilities: string) =>
  `@import "tailwindcss" source(none);\n@source inline("${utilities}");`;
const throughTailwind = '@import "@nuvui/react/styles.css";';
const tailwindFirst = "@layer theme, tokens, base, components, utilities;";
const tokensFirst = "@layer tokens, theme, base, components, utilities;";
const roundedTheme = "@theme { --radius-md: 0.75rem; }";

async function compile(css: string) {
  const result = await postcss([tailwind({ optimize: false })]).process(css, {
    // Never written. It's where imports are resolved from.
    from: path.join(app, "compiled-in-a-test.css"),
  });
  return result.css;
}

interface Setup {
  css: string;
  /** The library's stylesheet, loaded as a file of its own. */
  separateLibrary?: boolean;
  theme?: "light" | "dark" | "system";
  colorScheme?: "light" | "dark";
}

async function render(
  page: Page,
  { css, separateLibrary, theme = "light", colorScheme = "light" }: Setup,
) {
  // The button fades between colors, and these read them straight away.
  await page.emulateMedia({ colorScheme, reducedMotion: "reduce" });
  await page.setContent(`<!doctype html>
    <html data-theme="${theme}">
      <body>
        <button class="nuv-button nuv-button--primary nuv-button--md">Save</button>
        <div id="utility" class="rounded-md bg-primary dark:underline">Utility</div>
      </body>
    </html>`);
  await page.addStyleTag({ content: await compile(css) });
  if (separateLibrary) await page.addStyleTag({ content: libraryCss });

  const read = (selector: string, property: string) =>
    page
      .locator(selector)
      .evaluate(
        (element, name) => getComputedStyle(element).getPropertyValue(name),
        property,
      );
  return {
    button: (property: string) => read(".nuv-button", property),
    utility: (property: string) => read("#utility", property),
  };
}

const transparent = "rgba(0, 0, 0, 0)";

test.describe("tailwind guide", () => {
  test.skip(
    ({ isMobile }) => isMobile,
    "This is the cascade, not layout. One viewport is enough.",
  );

  test("tokens before theme: a value set in @theme reaches components and utilities", async ({
    page,
  }) => {
    const { button, utility } = await render(page, {
      css: [
        tokensFirst,
        tailwindWith("rounded-md"),
        throughTailwind,
        roundedTheme,
      ].join("\n"),
    });

    expect(await button("border-radius")).toBe("12px");
    expect(await utility("border-radius")).toBe("12px");
    // Preflight resets every <button> to a transparent background. The
    // component's layer comes after it.
    expect(await button("background-color")).not.toBe(transparent);
  });

  test("theme before tokens: the library's value wins and the @theme line does nothing", async ({
    page,
  }) => {
    const { button, utility } = await render(page, {
      css: [
        tailwindFirst,
        tailwindWith("rounded-md"),
        throughTailwind,
        roundedTheme,
      ].join("\n"),
    });

    expect(await button("border-radius")).toBe("6px");
    expect(await utility("border-radius")).toBe("6px");
  });

  test("with no layer statement, the import order decides", async ({
    page,
  }) => {
    const tailwindImportedFirst = await render(page, {
      css: [tailwindWith("rounded-md"), throughTailwind, roundedTheme].join(
        "\n",
      ),
    });
    expect(await tailwindImportedFirst.button("border-radius")).toBe("6px");

    const libraryImportedFirst = await render(page, {
      css: [throughTailwind, tailwindWith("rounded-md"), roundedTheme].join(
        "\n",
      ),
    });
    expect(await libraryImportedFirst.button("border-radius")).toBe("12px");
  });

  test("a theme value no utility uses only reaches components if Tailwind sees their CSS", async ({
    page,
  }) => {
    const noUtilities = '@import "tailwindcss" source(none);';

    // The library's stylesheet loaded on its own, the way a JavaScript
    // import does it. Tailwind never writes the variable out.
    const separate = await render(page, {
      css: [tokensFirst, noUtilities, roundedTheme].join("\n"),
      separateLibrary: true,
    });
    expect(await separate.button("border-radius")).toBe("6px");

    const imported = await render(page, {
      css: [tokensFirst, noUtilities, throughTailwind, roundedTheme].join("\n"),
    });
    expect(await imported.button("border-radius")).toBe("12px");

    const forced = await render(page, {
      css: [
        tokensFirst,
        noUtilities,
        "@theme static { --radius-md: 0.75rem; }",
      ].join("\n"),
      separateLibrary: true,
    });
    expect(await forced.button("border-radius")).toBe("12px");
  });

  test("the color mapping needs `reference`, or primary buttons lose their background", async ({
    page,
  }) => {
    const mapping = (options: string) =>
      [
        tokensFirst,
        tailwindWith("bg-primary"),
        throughTailwind,
        `@theme ${options} { --color-primary: var(--color-primary); }`,
      ].join("\n");

    const broken = await render(page, { css: mapping("inline") });
    expect(await broken.button("background-color")).toBe(transparent);

    const working = await render(page, { css: mapping("inline reference") });
    expect(await working.button("background-color")).not.toBe(transparent);
    expect(await working.utility("background-color")).toBe(
      await working.button("background-color"),
    );
  });

  test("the dark variant follows data-theme, system included", async ({
    page,
  }) => {
    // Copied from the guide.
    const variant = `@custom-variant dark {
      &:where([data-theme="dark"], [data-theme="dark"] *) {
        @slot;
      }

      @media (prefers-color-scheme: dark) {
        &:where([data-theme="system"], [data-theme="system"] *) {
          @slot;
        }
      }
    }`;
    const css = [tailwindWith("dark:underline"), variant].join("\n");

    const cases = [
      { theme: "dark", colorScheme: "light", underlined: true },
      { theme: "light", colorScheme: "dark", underlined: false },
      { theme: "system", colorScheme: "dark", underlined: true },
      { theme: "system", colorScheme: "light", underlined: false },
    ] as const;

    for (const { theme, colorScheme, underlined } of cases) {
      const { utility } = await render(page, { css, theme, colorScheme });
      expect(
        await utility("text-decoration-line"),
        `data-theme="${theme}" on a ${colorScheme} system`,
      ).toBe(underlined ? "underline" : "none");
    }
  });

  test("tokens that share a name with Tailwind's theme share its value", async () => {
    const declarations = (css: string) =>
      new Map(
        [...css.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)].map(
          ([, name = "", value = ""]) => [
            name,
            // Tailwind quotes font names with single quotes.
            value.replace(/\s+/g, " ").replace(/'/g, '"').trim(),
          ],
        ),
      );

    const require = createRequire(import.meta.url);
    const theirs = declarations(
      readFileSync(require.resolve("tailwindcss/theme.css"), "utf8"),
    );
    // matchAll keeps the last declaration of a name, which for a semantic
    // color is a dark value. Those aren't in Tailwind's theme, so it doesn't
    // matter here.
    const ours = declarations(
      readFileSync(path.join(library, "dist/tokens.css"), "utf8"),
    );

    const shared = [...ours.keys()].filter((name) => theirs.has(name));
    expect(shared.length).toBeGreaterThan(90);
    expect(
      shared.filter((name) => ours.get(name) !== theirs.get(name)),
    ).toEqual([]);
  });
});
