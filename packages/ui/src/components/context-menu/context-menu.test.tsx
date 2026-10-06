import "../../styles/index.scss";
import { type CSSProperties, createRef, useState } from "react";
import { describe, expect, test, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { axe, behindOpenList } from "../../../test/axe";
import { contrast } from "../../../test/contrast";
import { emulateMedia, setViewport } from "../../../test/media";
import { setPageTheme, themes } from "../../../test/themed";
import {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  type ContextMenuContentProps,
  ContextMenuItem,
  ContextMenuLabel,
  type ContextMenuProps,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "./context-menu";

interface ExampleProps extends ContextMenuProps {
  content?: ContextMenuContentProps;
  onSelect?: (action: string) => void;
  area?: CSSProperties;
  disabled?: boolean;
}

function Example({
  content,
  onSelect,
  area,
  disabled,
  ...props
}: ExampleProps) {
  return (
    <ContextMenu {...props}>
      <ContextMenuTrigger
        disabled={disabled}
        data-testid="area"
        style={{
          display: "block",
          inlineSize: 240,
          blockSize: 120,
          margin: 40,
          ...area,
        }}
      >
        report.pdf
      </ContextMenuTrigger>
      <ContextMenuContent aria-label="File" {...content}>
        <ContextMenuLabel>report.pdf</ContextMenuLabel>
        <ContextMenuItem onSelect={() => onSelect?.("rename")}>
          Rename
          <ContextMenuShortcut>F2</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem disabled onSelect={() => onSelect?.("duplicate")}>
          Duplicate
        </ContextMenuItem>
        <ContextMenuSub>
          <ContextMenuSubTrigger>Move to</ContextMenuSubTrigger>
          <ContextMenuSubContent>
            <ContextMenuItem onSelect={() => onSelect?.("archive")}>
              Archive
            </ContextMenuItem>
            <ContextMenuItem>Trash</ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>
        <ContextMenuSeparator />
        <ContextMenuItem intent="danger" onSelect={() => onSelect?.("delete")}>
          Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

function ViewMenu() {
  const [grid, setGrid] = useState(false);
  const [sort, setSort] = useState("name");
  return (
    <ContextMenu>
      <ContextMenuTrigger
        data-testid="area"
        style={{ display: "block", inlineSize: 240, blockSize: 120 }}
      >
        Files
      </ContextMenuTrigger>
      <ContextMenuContent aria-label="View">
        <ContextMenuCheckboxItem checked={grid} onCheckedChange={setGrid}>
          Show grid
        </ContextMenuCheckboxItem>
        <ContextMenuCheckboxItem checked="indeterminate">
          Show hidden files
        </ContextMenuCheckboxItem>
        <ContextMenuSeparator />
        <ContextMenuRadioGroup value={sort} onValueChange={setSort}>
          <ContextMenuLabel>Sort by</ContextMenuLabel>
          <ContextMenuRadioItem value="name">Name</ContextMenuRadioItem>
          <ContextMenuRadioItem value="date">Date</ContextMenuRadioItem>
        </ContextMenuRadioGroup>
      </ContextMenuContent>
    </ContextMenu>
  );
}

const area = () => page.getByTestId("area");
const menu = () => page.getByRole("menu", { name: "File" });
const item = (name: string) => page.getByRole("menuitem", { name });
const rect = (element: Element) => element.getBoundingClientRect();
const display = (element: Element, part: string) =>
  getComputedStyle(
    element.querySelector(`.nuv-context-menu__${part}`) as Element,
  ).display;

// A context menu has no open prop to start from: it opens where the pointer
// is, so it takes a real right click.
async function rightClick(position = { x: 20, y: 20 }) {
  await userEvent.click(area(), { button: "right", position });
}

// The animation scales the panel, which would make measurements depend on
// timing.
async function openStill(
  node: React.ReactNode,
  position?: { x: number; y: number },
) {
  await emulateMedia({ reducedMotion: "reduce" });
  await render(node);
  await rightClick(position);
  await expect.element(page.getByRole("menu").first()).toBeVisible();
  return page.getByRole("menu").first().element();
}

describe("rendering", () => {
  test("is closed until the area is right-clicked", async () => {
    await render(<Example />);

    await expect.element(menu()).not.toBeInTheDocument();
    await expect.element(area()).toHaveAttribute("data-state", "closed");

    // Held as an element, because the open menu hides the rest of the page
    // from the accessibility tree.
    const element = area().element();
    await rightClick();

    await expect.element(menu()).toBeVisible();
    expect(element.getAttribute("data-state")).toBe("open");
  });

  test("a left click doesn't open it", async () => {
    await render(<Example />);

    await area().click();
    await new Promise((resolve) => setTimeout(resolve, 200));

    await expect.element(menu()).not.toBeInTheDocument();
  });

  test("opens where the pointer is", async () => {
    const panel = await openStill(<Example />, { x: 60, y: 30 });
    const box = rect(area().element());

    // Radix leaves 2px between the pointer and the menu's corner.
    expect(rect(panel).left).toBeCloseTo(box.left + 60 + 2, 0);
    expect(rect(panel).top).toBeCloseTo(box.top + 30, 0);
  });

  test("choosing an item calls onSelect and closes the menu", async () => {
    const onSelect = vi.fn();
    await render(<Example onSelect={onSelect} />);
    await rightClick();

    await item("Rename").click();

    expect(onSelect).toHaveBeenCalledWith("rename");
    await expect.element(menu()).not.toBeInTheDocument();
  });

  test("a disabled item can't be chosen", async () => {
    const onSelect = vi.fn();
    await render(<Example onSelect={onSelect} />);
    await rightClick();

    await expect
      .element(item("Duplicate"))
      .toHaveAttribute("aria-disabled", "true");
    await item("Duplicate").click({ force: true });

    expect(onSelect).not.toHaveBeenCalled();
    await expect.element(menu()).toBeVisible();
  });

  test("a disabled trigger leaves the browser's own menu alone", async () => {
    const onContextMenu = vi.fn((event: Event) => {
      // Radix would have called preventDefault before this ran.
      expect(event.defaultPrevented).toBe(false);
      // Keeps the browser's menu from opening over the next test.
      event.preventDefault();
    });
    document.addEventListener("contextmenu", onContextMenu, { once: true });
    await render(<Example disabled />);

    await rightClick();

    expect(onContextMenu).toHaveBeenCalledOnce();
    await expect.element(menu()).not.toBeInTheDocument();
    await expect.element(area()).toHaveAttribute("data-disabled");
  });

  test("renders at the end of body, or in a container when given one", async () => {
    function InSection() {
      const [section, setSection] = useState<HTMLElement | null>(null);
      return (
        <section ref={setSection} data-testid="section">
          <Example content={{ container: section }} />
        </section>
      );
    }
    const first = await render(<Example />);
    await rightClick();
    await expect.element(menu()).toBeVisible();
    expect(first.container.contains(menu().element())).toBe(false);
    await first.unmount();

    await render(<InSection />);
    await rightClick();
    await expect.element(menu()).toBeVisible();
    expect(
      page.getByTestId("section").element().contains(menu().element()),
    ).toBe(true);
  });

  test("forwards refs and keeps classNames", async () => {
    const contentRef = createRef<HTMLDivElement>();
    const itemRef = createRef<HTMLDivElement>();
    const shortcutRef = createRef<HTMLSpanElement>();
    await render(
      <ContextMenu>
        <ContextMenuTrigger data-testid="area">report.pdf</ContextMenuTrigger>
        <ContextMenuContent ref={contentRef} className="mine" aria-label="File">
          <ContextMenuItem ref={itemRef} className="row" intent="danger">
            Delete
            <ContextMenuShortcut ref={shortcutRef} className="keys">
              Del
            </ContextMenuShortcut>
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>,
    );
    await userEvent.click(area(), { button: "right" });

    await expect.element(menu()).toHaveClass("nuv-context-menu", "mine");
    await expect
      .element(item("Delete"))
      .toHaveClass(
        "nuv-context-menu__item",
        "nuv-context-menu__item--danger",
        "row",
      );
    expect(contentRef.current).toBe(menu().element());
    expect(itemRef.current).toBe(item("Delete").element());
    expect(shortcutRef.current?.className).toBe(
      "nuv-context-menu__shortcut keys",
    );
  });

  test("reports opening and closing", async () => {
    const onOpenChange = vi.fn();
    await render(<Example onOpenChange={onOpenChange} />);

    await rightClick();
    await expect.element(menu()).toBeVisible();
    expect(onOpenChange).toHaveBeenLastCalledWith(true);

    await userEvent.keyboard("{Escape}");
    await expect.element(menu()).not.toBeInTheDocument();
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
  });
});

describe("keyboard", () => {
  test("the down arrow moves to the first item", async () => {
    await render(<Example />);
    await rightClick();
    await expect.element(menu()).toBeVisible();

    await userEvent.keyboard("{ArrowDown}");

    await expect.element(item("Rename")).toHaveFocus();
  });

  test("arrow keys move between items and skip disabled ones", async () => {
    await render(<Example />);
    await rightClick();
    await expect.element(menu()).toBeVisible();
    await userEvent.keyboard("{ArrowDown}");
    await expect.element(item("Rename")).toHaveFocus();

    await userEvent.keyboard("{ArrowDown}");
    await expect.element(item("Move to")).toHaveFocus();

    await userEvent.keyboard("{End}");
    await expect.element(item("Delete")).toHaveFocus();

    await userEvent.keyboard("{Home}");
    await expect.element(item("Rename")).toHaveFocus();
  });

  test("typing a letter jumps to the item that starts with it", async () => {
    await render(<Example />);
    await rightClick();
    await expect.element(menu()).toBeVisible();

    await userEvent.keyboard("m");

    await expect.element(item("Move to")).toHaveFocus();
  });

  test("Enter chooses the focused item", async () => {
    const onSelect = vi.fn();
    await render(<Example onSelect={onSelect} />);
    await rightClick();
    await expect.element(menu()).toBeVisible();
    await userEvent.keyboard("{ArrowDown}");
    await expect.element(item("Rename")).toHaveFocus();

    await userEvent.keyboard("{Enter}");

    expect(onSelect).toHaveBeenCalledWith("rename");
    await expect.element(menu()).not.toBeInTheDocument();
  });

  test("Escape closes it", async () => {
    await render(<Example />);
    await rightClick();
    await expect.element(menu()).toBeVisible();

    await userEvent.keyboard("{Escape}");

    await expect.element(menu()).not.toBeInTheDocument();
  });

  test("the item the keyboard is on is filled, which is its focus indicator", async () => {
    await render(<Example />);
    await rightClick();
    await expect.element(menu()).toBeVisible();
    await userEvent.keyboard("{ArrowDown}");
    await expect.element(item("Rename")).toHaveFocus();
    const row = getComputedStyle(item("Rename").element());
    const panel = getComputedStyle(menu().element());

    // 3:1 against the panel to be seen as a state, 4.5:1 for its own text.
    expect(
      contrast(row.backgroundColor, panel.backgroundColor),
    ).toBeGreaterThanOrEqual(3);
    expect(contrast(row.color, row.backgroundColor)).toBeGreaterThanOrEqual(
      4.5,
    );
    // Kept for forced-colors mode, where the fill isn't drawn.
    expect(row.outlineStyle).toBe("solid");
    expect(row.outlineColor).toBe("rgba(0, 0, 0, 0)");
  });
});

describe("submenu", () => {
  const submenu = () => page.getByRole("menu", { name: "Move to" });

  test("the right arrow opens it and the left arrow closes it", async () => {
    await render(<Example />);
    await rightClick();
    await expect.element(menu()).toBeVisible();
    await userEvent.keyboard("{ArrowDown}");
    await userEvent.keyboard("{ArrowDown}");
    await expect.element(item("Move to")).toHaveFocus();

    await userEvent.keyboard("{ArrowRight}");
    await expect.element(submenu()).toBeVisible();
    await expect.element(item("Archive")).toHaveFocus();

    await userEvent.keyboard("{ArrowLeft}");
    await expect.element(submenu()).not.toBeInTheDocument();
    await expect.element(item("Move to")).toHaveFocus();
  });

  test("a click opens it, and choosing inside closes the whole menu", async () => {
    const onSelect = vi.fn();
    await render(<Example onSelect={onSelect} />);
    await rightClick();

    await item("Move to").click();
    await expect.element(submenu()).toBeVisible();
    await expect.element(submenu()).toHaveClass("nuv-context-menu");

    await item("Archive").click();

    expect(onSelect).toHaveBeenCalledWith("archive");
    await expect.element(menu()).not.toBeInTheDocument();
  });

  test("on a phone it narrows to the room there is, and stays on the screen", async () => {
    await setViewport("phone");
    await openStill(<Example />, { x: 120, y: 20 });

    await item("Move to").click();
    await expect.element(submenu()).toBeVisible();

    const panel = rect(submenu().element());
    expect(panel.left).toBeGreaterThanOrEqual(8);
    expect(panel.right).toBeLessThanOrEqual(window.innerWidth - 8);
    expect(document.documentElement.scrollWidth).toBe(
      document.documentElement.clientWidth,
    );
  });

  test("dir=rtl flips the arrow and swaps the arrow keys", async () => {
    await render(<Example dir="rtl" />);
    await rightClick();
    await expect.element(menu()).toBeVisible();
    await userEvent.keyboard("{ArrowDown}");
    await userEvent.keyboard("{ArrowDown}");
    await expect.element(item("Move to")).toHaveFocus();

    const chevron = item("Move to")
      .element()
      .querySelector(".nuv-context-menu__chevron") as Element;
    expect(getComputedStyle(chevron).transform).toBe(
      "matrix(-1, 0, 0, 1, 0, 0)",
    );

    await userEvent.keyboard("{ArrowLeft}");
    await expect.element(submenu()).toBeVisible();
    await expect.element(item("Archive")).toHaveFocus();
  });
});

describe("checkable items", () => {
  const checkbox = (name: string) =>
    page.getByRole("menuitemcheckbox", { name });
  const radio = (name: string) => page.getByRole("menuitemradio", { name });

  test("a checkbox item shows a check once it's chosen", async () => {
    await render(<ViewMenu />);
    await rightClick();
    await expect.element(checkbox("Show grid")).toBeVisible();
    const element = checkbox("Show grid").element();

    expect(element.getAttribute("aria-checked")).toBe("false");
    expect(element.querySelector(".nuv-context-menu__indicator")).toBeNull();

    await checkbox("Show grid").click();
    await rightClick();

    await expect
      .element(checkbox("Show grid"))
      .toHaveAttribute("aria-checked", "true");
    expect(display(checkbox("Show grid").element(), "check")).not.toBe("none");
  });

  test("an indeterminate checkbox item shows a dash", async () => {
    await render(<ViewMenu />);
    await rightClick();
    await expect.element(checkbox("Show hidden files")).toBeVisible();
    const element = checkbox("Show hidden files").element();

    expect(element.getAttribute("aria-checked")).toBe("mixed");
    expect(display(element, "dash")).not.toBe("none");
    expect(display(element, "check")).toBe("none");
  });

  test("radio items mark the one that's selected", async () => {
    await render(<ViewMenu />);
    await rightClick();

    await expect.element(radio("Name")).toHaveAttribute("aria-checked", "true");
    await radio("Date").click();
    await rightClick();

    await expect.element(radio("Date")).toHaveAttribute("aria-checked", "true");
    await expect
      .element(radio("Name"))
      .toHaveAttribute("aria-checked", "false");
  });
});

describe("layout", () => {
  test("rows are 32px tall with a mouse", async () => {
    await openStill(<Example />);

    expect(rect(item("Rename").element()).height).toBe(32);
  });

  test("a shortcut sits at the end of its row, in smaller text", async () => {
    await openStill(<Example />);
    const row = rect(item("Rename").element());
    const keys = page.getByText("F2").element();

    // The row's 12px of padding, give or take the panel's fractional width.
    expect(row.right - rect(keys).right).toBeCloseTo(12, 0);
    expect(getComputedStyle(keys).fontSize).toBe("12px");
  });

  test("stays on the screen when opened in the bottom corner", async () => {
    await setViewport("phone");
    const panel = await openStill(
      <Example
        area={{
          position: "fixed",
          insetBlockEnd: 0,
          insetInlineEnd: 0,
          margin: 0,
        }}
      />,
      { x: 230, y: 110 },
    );

    expect(rect(panel).right).toBeLessThanOrEqual(window.innerWidth - 8);
    expect(rect(panel).bottom).toBeLessThanOrEqual(window.innerHeight - 8);
    expect(rect(panel).left).toBeGreaterThanOrEqual(8);
  });

  test("a long menu stays on the screen and scrolls inside itself", async () => {
    await setViewport("phone");
    await emulateMedia({ reducedMotion: "reduce" });
    await render(
      <ContextMenu>
        <ContextMenuTrigger data-testid="area">report.pdf</ContextMenuTrigger>
        <ContextMenuContent aria-label="File">
          {Array.from({ length: 40 }, (_, index) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: static filler
            <ContextMenuItem key={index}>Item {index}</ContextMenuItem>
          ))}
        </ContextMenuContent>
      </ContextMenu>,
    );
    await userEvent.click(area(), { button: "right" });
    await expect.element(menu()).toBeVisible();
    const panel = menu().element();

    expect(rect(panel).bottom).toBeLessThanOrEqual(window.innerHeight);
    expect(rect(panel).top).toBeGreaterThanOrEqual(0);
    expect(panel.scrollHeight).toBeGreaterThan(panel.clientHeight);
  });

  test("a variable changes the row height", async () => {
    await openStill(
      <Example
        content={{
          style: { "--nuv-context-menu-item-height": "3.5rem" } as never,
        }}
      />,
    );

    expect(rect(item("Rename").element()).height).toBe(56);
  });

  test("a dropdown menu's variables don't reach it", async () => {
    document.documentElement.style.setProperty(
      "--nuv-dropdown-menu-item-height",
      "3.5rem",
    );

    try {
      await openStill(<Example />);
      expect(rect(item("Rename").element()).height).toBe(32);
    } finally {
      document.documentElement.style.removeProperty(
        "--nuv-dropdown-menu-item-height",
      );
    }
  });
});

describe("styles", () => {
  test("the item under the pointer is filled", async () => {
    await openStill(<Example />);
    const style = getComputedStyle(item("Rename").element());
    const before = style.backgroundColor;

    await userEvent.hover(item("Rename"));

    await expect.element(item("Rename")).toHaveAttribute("data-highlighted");
    expect(style.backgroundColor).not.toBe(before);
    expect(contrast(style.color, style.backgroundColor)).toBeGreaterThanOrEqual(
      4.5,
    );
    // The shortcut is gray until its row is filled, then takes the row's color.
    expect(getComputedStyle(page.getByText("F2").element()).color).toBe(
      style.color,
    );
  });

  test("a variable changes the highlight", async () => {
    await openStill(
      <Example
        content={{
          style: {
            "--nuv-context-menu-highlight-bg": "rgb(0, 0, 0)",
            "--nuv-context-menu-highlight-fg": "rgb(255, 255, 255)",
          } as never,
        }}
      />,
    );

    await userEvent.hover(item("Rename"));
    await expect.element(item("Rename")).toHaveAttribute("data-highlighted");

    const style = getComputedStyle(item("Rename").element());
    expect(style.backgroundColor).toBe("rgb(0, 0, 0)");
    expect(style.color).toBe("rgb(255, 255, 255)");
  });

  test("a danger item is filled when highlighted, and stays readable", async () => {
    await openStill(<Example />);
    const style = getComputedStyle(item("Delete").element());
    const resting = style.color;

    await userEvent.hover(item("Delete"));
    await expect.element(item("Delete")).toHaveAttribute("data-highlighted");

    expect(style.backgroundColor).toBe(resting);
    expect(contrast(style.color, style.backgroundColor)).toBeGreaterThan(4.5);
  });

  test("pops in when motion is fine", async () => {
    await emulateMedia({ reducedMotion: "no-preference" });
    await render(<Example />);
    await rightClick();

    await expect.element(menu()).toBeVisible();
    expect(getComputedStyle(menu().element()).animationName).toBe(
      "nuv-context-menu-in",
    );
  });

  test("still closes after its exit animation", async () => {
    await emulateMedia({ reducedMotion: "no-preference" });
    await render(<Example />);
    await rightClick();
    await expect.element(menu()).toBeVisible();

    await userEvent.keyboard("{Escape}");

    await expect.element(menu()).not.toBeInTheDocument();
  });

  test("doesn't animate when reduced motion is on", async () => {
    const panel = await openStill(<Example />);

    expect(getComputedStyle(panel).animationName).toBe("none");
  });
});

describe.each(themes)("accessibility in %s", (theme) => {
  test("the open menu passes axe", async () => {
    setPageTheme(theme);
    await openStill(<Example />);
    // One row filled while axe looks, so its colors are checked as well.
    await userEvent.keyboard("{ArrowDown}");
    await expect.element(item("Rename")).toHaveFocus();

    const results = await axe(document.body, behindOpenList);

    expect(results).toHaveNoViolations();
    const checked = results.passes.find((rule) => rule.id === "color-contrast");
    // The label and the enabled items.
    expect(checked?.nodes.length).toBeGreaterThanOrEqual(4);
  });

  test("the menu with checkable items passes axe", async () => {
    setPageTheme(theme);
    await openStill(<ViewMenu />);
    await expect
      .element(page.getByRole("menuitemradio", { name: "Name" }))
      .toBeVisible();

    expect(await axe(document.body, behindOpenList)).toHaveNoViolations();
  });
});
