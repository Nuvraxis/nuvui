import { expect, test } from "@playwright/test";
import { open } from "./helpers";

// The page for people, and the docs as plain text for what reads them in
// their place. The plain text is written when the docs are built, by
// scripts/agent-skill.mjs, from the same pages.

test.describe("using with AI agents", () => {
  test("the page says how the skill is installed and what's in it", async ({
    page,
  }) => {
    await open(page, "/docs/agents");
    const article = page.locator("article").first();

    await expect(
      article.getByRole("heading", { level: 1, name: "Using with AI agents" }),
    ).toBeVisible();
    await expect(
      article.getByText("pnpm dlx skills add Nuvraxis/nuvui").first(),
    ).toBeVisible();
    await expect(
      article.getByRole("link", { name: "NuvUIAIAgent.md" }).first(),
    ).toHaveAttribute(
      "href",
      "https://github.com/Nuvraxis/nuvui/blob/main/NuvUIAIAgent.md",
    );
    for (const file of ["SKILL.md", "rules/", "reference/", "blocks.md"]) {
      await expect(
        article.getByRole("cell", { name: file, exact: true }),
      ).toBeVisible();
    }
    await expect(
      article.getByRole("link", { name: "/docs/llms-full.txt" }),
    ).toHaveAttribute("href", "https://nuvui.nuvraxis.com/docs/llms-full.txt");
  });

  test("the page is in the menu", async ({ page, isMobile }) => {
    // On a phone the menu is behind a button, which other tests open.
    test.skip(isMobile);
    await open(page, "/docs");

    await expect(
      page.getByRole("link", { name: "Using with AI agents" }).first(),
    ).toHaveAttribute("href", "/docs/agents");
  });
});

test.describe("the MCP server's page", () => {
  test("gives the address, and how to add it to each agent", async ({
    page,
  }) => {
    await open(page, "/docs/mcp");
    const article = page.locator("article").first();

    await expect(
      article.getByRole("heading", { level: 1, name: "MCP server" }),
    ).toBeVisible();
    await expect(
      article
        .getByText("https://nuvui.nuvraxis.com/mcp", { exact: true })
        .first(),
    ).toBeVisible();
    for (const agent of [
      "Claude Code",
      "Cursor",
      "VS Code",
      "Codex",
      "Other clients",
    ]) {
      await expect(
        article.getByRole("heading", { level: 3, name: agent }),
      ).toBeVisible();
    }
    await expect(
      article
        .getByText(
          "claude mcp add --transport http nuvui https://nuvui.nuvraxis.com/mcp",
        )
        .first(),
    ).toBeVisible();
    // A row for each tool the server has.
    for (const tool of ["get_rules", "get_page", "search_docs", "get_tokens"]) {
      await expect(
        article.getByRole("cell", { name: tool, exact: true }),
      ).toBeVisible();
    }
  });

  test("the skill's page leads to it", async ({ page }) => {
    await open(page, "/docs/agents");

    await expect(
      // Exactly: the card for the next page, at the foot, says more.
      page
        .locator("article")
        .first()
        .getByRole("link", { name: "MCP server", exact: true }),
    ).toHaveAttribute("href", "/docs/mcp");
  });
});

test.describe("the docs as plain text", () => {
  test("llms.txt lists every page by the address of its Markdown", async ({
    request,
  }) => {
    const response = await request.get("/docs/llms.txt");
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("text/plain");
    const text = await response.text();

    expect(text).toMatch(/^# nuvui$/m);
    expect(text).toContain("## @nuvui/react: components");
    expect(text).toContain(
      "- [Button](https://nuvui.nuvraxis.com/docs/llms/components/button.md):",
    );
    expect(text).toContain(
      "https://nuvui.nuvraxis.com/docs/llms/map/map-view.md",
    );
    expect(text).toContain("pnpm dlx skills add Nuvraxis/nuvui");
  });

  test("a page's Markdown has its props, its variables and its examples' source, and no tags of the site's", async ({
    request,
  }) => {
    const response = await request.get("/docs/llms/components/button.md");
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("text/markdown");
    const text = await response.text();

    expect(text).toMatch(/^# Button$/m);
    // The first example, as its source.
    expect(text).toContain("return <Button>Save changes</Button>;");
    // The props, from the types.
    expect(text).toContain("| `intent` |");
    expect(text).toContain('`"primary"`');
    // The variables and the classes, from the built stylesheet.
    expect(text).toContain("| `--nuv-button-radius` |");
    expect(text).toContain("| `.nuv-button` |");
    // What the site draws from, which means nothing as text.
    expect(text).not.toMatch(/^<(Preview|PropsTable|CssVariables|BemClasses)/m);
    expect(text).not.toContain("Playground");
    // A link to another page goes to that page on the site.
    expect(text).toContain("](https://nuvui.nuvraxis.com/docs)");
  });

  test("an add-on's page is there too, with the table read from its own package", async ({
    request,
  }) => {
    const response = await request.get("/docs/llms/map/map-route.md");
    expect(response.status()).toBe(200);
    const text = await response.text();

    expect(text).toMatch(/^# MapRoute$/m);
    expect(text).toContain("| `coordinates` (required) |");
    expect(text).toContain("<MapRoute coordinates={driven} />");
  });

  test("the tokens are a page of their own", async ({ request }) => {
    const text = await (await request.get("/docs/llms/tokens.md")).text();

    expect(text).toMatch(/^# Design tokens$/m);
    expect(text).toContain("--color-primary:");
  });

  test("llms-full.txt is every page in one file", async ({ request }) => {
    const response = await request.get("/docs/llms-full.txt");
    expect(response.status()).toBe(200);
    const text = await response.text();

    for (const title of ["Getting started", "Button", "DataTable", "MapView"]) {
      expect(text).toMatch(new RegExp(`^# ${title}$`, "m"));
    }
    // A page for each component and guide, and then some.
    expect(text.match(/^# /gm)?.length).toBeGreaterThan(120);
  });

  test("a page that isn't there is a 404, and not another page's text", async ({
    request,
  }) => {
    const response = await request.get("/docs/llms/components/no-such.md");

    expect(response.status()).toBe(404);
  });
});
