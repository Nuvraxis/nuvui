import AxeBuilder from "@axe-core/playwright";
import { expect, type Locator, type Page, test } from "@playwright/test";
import { open, press } from "./helpers";

// The rendered example. The figure around it also holds the example's
// source, where the same words turn up again.
const preview = (page: Page, name: string) =>
  page.locator(`[data-preview="${name}"] > div:first-child`);
const playground = (page: Page) => page.locator("[data-playground]");
const diagram = (within: Locator) => within.getByRole("listbox");
const node = (within: Locator, id: string) =>
  within.locator(`.nuv-flow__node[data-id="${id}"]`);
// What the diagram last said to a screen reader.
const spoken = (within: Locator) => within.locator('.nuv-flow [role="status"]');

// Which node the keyboard is on, by its id.
async function active(within: Locator) {
  return within.evaluate((element) => {
    const canvas = element.querySelector(".nuv-flow__canvas");
    const id = canvas?.getAttribute("aria-activedescendant");
    return id
      ? (document.getElementById(id) as HTMLElement | null)?.dataset.id
      : undefined;
  });
}

test.describe("flow start page", () => {
  test("says what to install, leads to the component, and draws a diagram", async ({
    page,
  }) => {
    await open(page, "/docs/flow");
    const article = page.locator("article").first();

    await expect(
      article.getByText("pnpm add @nuvui/flow @nuvui/react").first(),
    ).toBeVisible();
    await expect(
      article.getByRole("link", { name: "Flow", exact: true }),
    ).toHaveAttribute("href", "/docs/flow/flow");
    await expect(
      diagram(preview(page, "flow/basic")).getByRole("option"),
    ).toHaveCount(5);
  });

  test("five thousand steps are a few paths fitted, and a few dozen nodes up close", async ({
    page,
  }) => {
    await open(page, "/docs/flow");
    const area = preview(page, "flow/large");
    await area.scrollIntoViewIfNeeded();

    await expect(area.locator(".nuv-flow__overview").first()).toBeAttached();
    await expect(area.locator(".nuv-flow__node")).toHaveCount(0);
    expect(await area.locator(".nuv-flow__svg *").count()).toBeLessThan(40);

    await diagram(area).focus();
    for (let i = 0; i < 12; i++) await page.keyboard.press("+");
    await expect
      .poll(() => area.locator(".nuv-flow__node").count())
      .toBeGreaterThan(0);
    expect(await area.locator(".nuv-flow__node").count()).toBeLessThan(300);
    await expect(area.locator(".nuv-flow__node").first()).toHaveAttribute(
      "aria-setsize",
      "5000",
    );
  });
});

test.describe("flow page", () => {
  test.beforeEach(async ({ page }) => {
    await open(page, "/docs/flow/flow");
  });

  test("each node is an option named for its kind and where it leads", async ({
    page,
  }) => {
    const area = preview(page, "flow/basic");
    await expect(
      diagram(area).getByRole("option", {
        name: "In stock?, decision, leads to Pack and ship (yes) and Reorder from the supplier (no)",
      }),
    ).toBeAttached();
    await expect(diagram(area)).toHaveAttribute(
      "aria-roledescription",
      "flow diagram",
    );
  });

  test("each diagram takes the whole width of its preview", async ({
    page,
  }) => {
    for (const name of ["flow/basic", "flow/edges", "flow/editable"]) {
      const area = preview(page, name);
      const outer = await area.boundingBox();
      const frame = await area.locator(".nuv-flow__frame").boundingBox();
      // The preview's padding aside, not the 300 pixels an SVG is by
      // default.
      expect(frame?.width ?? 0, name).toBeGreaterThan((outer?.width ?? 0) - 60);
    }
  });

  test("the arrow keys go from node to node", async ({ page }) => {
    const area = preview(page, "flow/basic");
    await diagram(area).focus();
    await expect.poll(() => active(area)).toBe("placed");
    await page.keyboard.press("ArrowDown");
    await expect.poll(() => active(area)).toBe("stock");
    await page.keyboard.press("ArrowRight");
    await expect.poll(() => active(area)).toBe("ship");
  });

  test("in the editable example a node is dragged, and the app is told once", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "A drag with a mouse.");
    const area = preview(page, "flow/editable");
    await area.scrollIntoViewIfNeeded();
    const target = node(area, "qualify");
    const before = await target.getAttribute("transform");
    const box = await target.boundingBox();
    if (!box) throw new Error("nothing to drag");

    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 + 10, box.y + box.height / 2, {
      steps: 3,
    });
    await page.mouse.move(box.x + box.width / 2 + 80, box.y + 90, {
      steps: 12,
    });
    await page.mouse.up();

    await expect(target).not.toHaveAttribute("transform", before ?? "");
    await expect(area.getByText("Nodes: move qualify")).toBeVisible();
    await expect(spoken(area)).toHaveText("Moved Qualify.");
  });

  test("in the editable example, L joins two nodes and Delete removes one with its links", async ({
    page,
  }) => {
    const area = preview(page, "flow/editable");
    await diagram(area).focus();
    await expect.poll(() => active(area)).toBe("lead");

    await page.keyboard.press("l");
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowRight");
    await expect.poll(() => active(area)).toBe("won");
    await page.keyboard.press("l");
    await expect(spoken(area)).toHaveText("Linked New lead to Won.");
    await expect(area.getByText("Edges: add lead->won")).toBeVisible();

    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("Delete");
    await expect(spoken(area)).toHaveText("Removed 1 step and 2 links.");
    await expect(node(area, "qualify")).toHaveCount(0);
  });

  test("the list shows the steps and finds one in the diagram", async ({
    page,
    isMobile,
  }) => {
    const area = preview(page, "flow/basic");
    await press(area.getByRole("button", { name: "Show as a list" }), isMobile);
    const list = area.getByRole("list", { name: "Steps" });
    await expect(list.getByRole("listitem")).toHaveCount(5);
    await expect(list.getByRole("listitem").nth(1)).toContainText(
      "leads to Pack and ship (yes) and Reorder from the supplier (no)",
    );
    await press(
      list.getByRole("button", { name: "Find Delivered in the diagram" }),
      isMobile,
    );
    await expect(diagram(area)).toBeFocused();
    await expect.poll(() => active(area)).toBe("delivered");
  });

  test("the playground's code follows its controls", async ({ page }) => {
    const area = playground(page);
    await area.getByLabel("edgePath").selectOption("step");
    await area.getByLabel("editable").uncheck();
    await expect(area.locator("pre")).toContainText('edgePath="step"');
    await expect(area.locator("pre")).not.toContainText("editable");
    await expect(area.locator(".nuv-flow")).not.toHaveAttribute(
      "data-editable",
      "",
    );
  });

  test("the zoom buttons zoom, and fit puts it back", async ({
    page,
    isMobile,
  }) => {
    const area = preview(page, "flow/edges");
    const view = area.locator(".nuv-flow__svg > g").first();
    const before = await view.getAttribute("transform");
    await press(area.getByRole("button", { name: "Zoom in" }), isMobile);
    await expect(view).not.toHaveAttribute("transform", before ?? "");
    await press(
      area.getByRole("button", { name: "Fit the diagram" }),
      isMobile,
    );
    await expect(view).toHaveAttribute("transform", before ?? "");
  });

  test("passes axe", async ({ page }) => {
    // The rendered examples, not the code blocks beside them, which are
    // the docs' and not the diagram's.
    const results = await new AxeBuilder({ page })
      .include('[data-preview="flow/basic"] > div:first-child')
      .include('[data-preview="flow/editable"] > div:first-child')
      .analyze();
    expect(results.violations).toEqual([]);
  });
});
