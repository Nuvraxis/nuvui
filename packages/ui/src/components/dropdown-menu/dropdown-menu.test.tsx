import "../../styles/index.scss";
import { type CSSProperties, createRef, useState } from "react";
import { describe, expect, test, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { axe, behindOpenList } from "../../../test/axe";
import { contrast } from "../../../test/contrast";
import { emulateMedia, emulateTouch, setViewport } from "../../../test/media";
import { setPageTheme, themes } from "../../../test/themed";
import { Button } from "../button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  type DropdownMenuContentProps,
  DropdownMenuItem,
  DropdownMenuLabel,
  type DropdownMenuProps,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "./dropdown-menu";

interface ExampleProps extends DropdownMenuProps {
  content?: DropdownMenuContentProps;
  onSelect?: (action: string) => void;
  wrapper?: CSSProperties;
}

function Example({
  content,
  onSelect,
  wrapper = { padding: 40 },
  ...props
}: ExampleProps) {
  return (
    <div style={wrapper}>
      <DropdownMenu {...props}>
        <DropdownMenuTrigger asChild>
          <Button intent="secondary">Options</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent {...content}>
          <DropdownMenuLabel>Project</DropdownMenuLabel>
          <DropdownMenuItem onSelect={() => onSelect?.("rename")}>
            Rename
          </DropdownMenuItem>
          <DropdownMenuItem disabled onSelect={() => onSelect?.("duplicate")}>
            Duplicate
          </DropdownMenuItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>Move to</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem onSelect={() => onSelect?.("archive")}>
                Archive
              </DropdownMenuItem>
              <DropdownMenuItem>Trash</DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            intent="danger"
            onSelect={() => onSelect?.("delete")}
          >
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function ViewMenu() {
  const [grid, setGrid] = useState(false);
  const [sort, setSort] = useState("name");
  return (
    <DropdownMenu defaultOpen>
      <DropdownMenuTrigger>View</DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuCheckboxItem checked={grid} onCheckedChange={setGrid}>
          Show grid
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem checked="indeterminate">
          Show hidden files
        </DropdownMenuCheckboxItem>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup value={sort} onValueChange={setSort}>
          <DropdownMenuLabel>Sort by</DropdownMenuLabel>
          <DropdownMenuRadioItem value="name">Name</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="date">Date</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const trigger = () => page.getByRole("button", { name: "Options" });
const menu = () => page.getByRole("menu", { name: "Options" });
const item = (name: string) => page.getByRole("menuitem", { name });
const rect = (element: Element) => element.getBoundingClientRect();
const display = (element: Element, part: string) =>
  getComputedStyle(
    element.querySelector(`.nuv-dropdown-menu__${part}`) as Element,
  ).display;

// The animation scales the panel, which would make measurements depend on
// timing.
async function openStill(node: React.ReactNode) {
  await emulateMedia({ reducedMotion: "reduce" });
  await render(node);
  await expect.element(menu()).toBeVisible();
  return menu().element();
}

describe("rendering", () => {
  test("is closed until the trigger is pressed", async () => {
    await render(<Example />);

    await expect.element(menu()).not.toBeInTheDocument();
    await expect.element(trigger()).toHaveAttribute("aria-haspopup", "menu");
    await expect.element(trigger()).toHaveAttribute("aria-expanded", "false");

    // Held as an element, because the open menu hides the rest of the page
    // from the accessibility tree and a role query can't find the trigger.
    const element = trigger().element();
    await trigger().click();

    await expect.element(menu()).toBeVisible();
    expect(element.getAttribute("aria-expanded")).toBe("true");
  });

  test("choosing an item calls onSelect, closes the menu and returns focus", async () => {
    const onSelect = vi.fn();
    await render(<Example onSelect={onSelect} />);
    await trigger().click();

    await item("Rename").click();

    expect(onSelect).toHaveBeenCalledWith("rename");
    await expect.element(menu()).not.toBeInTheDocument();
    await expect.element(trigger()).toHaveFocus();
  });

  test("a disabled item can't be chosen", async () => {
    const onSelect = vi.fn();
    await render(<Example defaultOpen onSelect={onSelect} />);

    await expect
      .element(item("Duplicate"))
      .toHaveAttribute("aria-disabled", "true");
    await item("Duplicate").click({ force: true });

    expect(onSelect).not.toHaveBeenCalled();
    await expect.element(menu()).toBeVisible();
  });

  test("renders at the end of body, or in a container when given one", async () => {
    function InSection() {
      const [section, setSection] = useState<HTMLElement | null>(null);
      return (
        <section ref={setSection} data-testid="section">
          <Example defaultOpen content={{ container: section }} />
        </section>
      );
    }
    const first = await render(<Example defaultOpen />);
    await expect.element(menu()).toBeVisible();
    expect(first.container.contains(menu().element())).toBe(false);
    await first.unmount();

    await render(<InSection />);
    await expect.element(menu()).toBeVisible();
    expect(
      page.getByTestId("section").element().contains(menu().element()),
    ).toBe(true);
  });

  test("forwards refs and keeps classNames", async () => {
    const contentRef = createRef<HTMLDivElement>();
    const itemRef = createRef<HTMLDivElement>();
    await render(
      <DropdownMenu defaultOpen>
        <DropdownMenuTrigger>Options</DropdownMenuTrigger>
        <DropdownMenuContent ref={contentRef} className="mine">
          <DropdownMenuItem ref={itemRef} className="row" intent="danger">
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );

    await expect.element(menu()).toHaveClass("nuv-dropdown-menu", "mine");
    await expect
      .element(item("Delete"))
      .toHaveClass(
        "nuv-dropdown-menu__item",
        "nuv-dropdown-menu__item--danger",
        "row",
      );
    expect(contentRef.current).toBe(menu().element());
    expect(itemRef.current).toBe(item("Delete").element());
  });

  test("can be controlled", async () => {
    const onOpenChange = vi.fn();
    await render(<Example open onOpenChange={onOpenChange} />);

    await expect.element(menu()).toBeVisible();
    await userEvent.keyboard("{Escape}");

    expect(onOpenChange).toHaveBeenCalledWith(false);
    await expect.element(menu()).toBeVisible();
  });
});

describe("keyboard", () => {
  test("Enter on the trigger opens the menu on its first item", async () => {
    await render(<Example />);

    await userEvent.keyboard("{Tab}");
    await userEvent.keyboard("{Enter}");

    await expect.element(item("Rename")).toHaveFocus();
  });

  test("the down arrow on the trigger opens it too", async () => {
    await render(<Example />);

    await userEvent.keyboard("{Tab}");
    await userEvent.keyboard("{ArrowDown}");

    await expect.element(item("Rename")).toHaveFocus();
  });

  test("arrow keys move between items and skip disabled ones", async () => {
    await render(<Example />);
    await userEvent.keyboard("{Tab}");
    await userEvent.keyboard("{Enter}");
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
    await userEvent.keyboard("{Tab}");
    await userEvent.keyboard("{Enter}");
    await expect.element(item("Rename")).toHaveFocus();

    await userEvent.keyboard("m");

    await expect.element(item("Move to")).toHaveFocus();
  });

  test("Enter chooses the focused item", async () => {
    const onSelect = vi.fn();
    await render(<Example onSelect={onSelect} />);
    await userEvent.keyboard("{Tab}");
    await userEvent.keyboard("{Enter}");
    await expect.element(item("Rename")).toHaveFocus();

    await userEvent.keyboard("{Enter}");

    expect(onSelect).toHaveBeenCalledWith("rename");
    await expect.element(menu()).not.toBeInTheDocument();
  });

  test("Escape closes it and returns focus to the trigger", async () => {
    await render(<Example />);
    await userEvent.keyboard("{Tab}");
    await userEvent.keyboard("{Enter}");
    await expect.element(menu()).toBeVisible();

    await userEvent.keyboard("{Escape}");

    await expect.element(menu()).not.toBeInTheDocument();
    await expect.element(trigger()).toHaveFocus();
  });

  test("the item the keyboard is on is filled, which is its focus indicator", async () => {
    await render(<Example />);
    await userEvent.keyboard("{Tab}");
    await userEvent.keyboard("{Enter}");
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
    await userEvent.keyboard("{Tab}");
    await userEvent.keyboard("{Enter}");
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
    await render(<Example defaultOpen onSelect={onSelect} />);

    await item("Move to").click();
    await expect.element(submenu()).toBeVisible();
    await expect.element(submenu()).toHaveClass("nuv-dropdown-menu");

    await item("Archive").click();

    expect(onSelect).toHaveBeenCalledWith("archive");
    await expect.element(menu()).not.toBeInTheDocument();
  });

  test("opens beside its trigger, and stays on the screen", async () => {
    await setViewport("desktop");
    await openStill(<Example defaultOpen />);

    await item("Move to").click();
    await expect.element(submenu()).toBeVisible();

    // It starts at the end of the row that opened it, which leaves it
    // overlapping the parent's padding by a few pixels. That's Radix's
    // default, and it's what ties the two panels together visually.
    const panel = rect(submenu().element());
    expect(panel.left).toBeCloseTo(rect(item("Move to").element()).right, 0);
    expect(panel.right).toBeLessThanOrEqual(window.innerWidth);
  });

  test("on a phone it narrows to the room there is, and stays on the screen", async () => {
    await setViewport("phone");
    await openStill(
      <Example
        defaultOpen
        wrapper={{ display: "flex", justifyContent: "center", padding: 40 }}
      />,
    );

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
    await userEvent.keyboard("{Tab}");
    await userEvent.keyboard("{Enter}");
    await userEvent.keyboard("{ArrowDown}");
    await expect.element(item("Move to")).toHaveFocus();

    const chevron = item("Move to")
      .element()
      .querySelector(".nuv-dropdown-menu__chevron") as Element;
    expect(getComputedStyle(chevron).transform).toBe(
      "matrix(-1, 0, 0, 1, 0, 0)",
    );

    await userEvent.keyboard("{ArrowLeft}");
    await expect.element(submenu()).toBeVisible();
    await expect.element(item("Archive")).toHaveFocus();
  });

  test("the arrow points right in a left-to-right layout", async () => {
    await render(<Example defaultOpen />);
    await expect.element(menu()).toBeVisible();

    const chevron = item("Move to")
      .element()
      .querySelector(".nuv-dropdown-menu__chevron") as Element;
    expect(getComputedStyle(chevron).transform).toBe("none");
  });
});

describe("checkable items", () => {
  const checkbox = (name: string) =>
    page.getByRole("menuitemcheckbox", { name });
  const radio = (name: string) => page.getByRole("menuitemradio", { name });

  test("a checkbox item shows a check once it's chosen", async () => {
    await render(<ViewMenu />);
    const element = checkbox("Show grid").element();

    expect(element.getAttribute("aria-checked")).toBe("false");
    expect(element.querySelector(".nuv-dropdown-menu__indicator")).toBeNull();

    await checkbox("Show grid").click();
    await page.getByRole("button", { name: "View" }).click();

    await expect
      .element(checkbox("Show grid"))
      .toHaveAttribute("aria-checked", "true");
    expect(display(checkbox("Show grid").element(), "check")).not.toBe("none");
  });

  test("an indeterminate checkbox item shows a dash", async () => {
    await render(<ViewMenu />);
    const element = checkbox("Show hidden files").element();

    expect(element.getAttribute("aria-checked")).toBe("mixed");
    expect(display(element, "dash")).not.toBe("none");
    expect(display(element, "check")).toBe("none");
  });

  test("radio items mark the one that's selected", async () => {
    await render(<ViewMenu />);

    await expect.element(radio("Name")).toHaveAttribute("aria-checked", "true");
    await radio("Date").click();
    await page.getByRole("button", { name: "View" }).click();

    await expect.element(radio("Date")).toHaveAttribute("aria-checked", "true");
    await expect
      .element(radio("Name"))
      .toHaveAttribute("aria-checked", "false");
  });

  test("the check sits at the end of the row", async () => {
    await render(<ViewMenu />);
    const row = rect(radio("Name").element());
    const check = rect(
      radio("Name")
        .element()
        .querySelector(".nuv-dropdown-menu__indicator") as Element,
    );

    // The row's 12px of padding, give or take the panel's fractional width.
    expect(row.right - check.right).toBeCloseTo(12, 0);
  });
});

describe("layout", () => {
  test("opens under the trigger, lined up with its start edge", async () => {
    const panel = await openStill(<Example defaultOpen />);
    const button = document.querySelector(".nuv-button") as Element;

    expect(rect(panel).top - rect(button).bottom).toBe(6);
    expect(rect(panel).left).toBe(rect(button).left);
  });

  test("rows are 44px tall on a touch screen and 32px with a mouse", async () => {
    await openStill(<Example defaultOpen />);
    const height = () => rect(item("Rename").element()).height;

    expect(height()).toBe(32);
    await emulateTouch(true);
    expect(height()).toBe(44);
  });

  test("a long menu stays on the screen and scrolls inside itself", async () => {
    await setViewport("phone");
    await emulateMedia({ reducedMotion: "reduce" });
    await emulateTouch(true);
    await render(
      <DropdownMenu defaultOpen>
        <DropdownMenuTrigger>Options</DropdownMenuTrigger>
        <DropdownMenuContent>
          {Array.from({ length: 40 }, (_, index) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: static filler
            <DropdownMenuItem key={index}>Item {index}</DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    await expect.element(menu()).toBeVisible();
    const panel = menu().element();

    expect(rect(panel).bottom).toBeLessThanOrEqual(window.innerHeight);
    expect(rect(panel).top).toBeGreaterThanOrEqual(0);
    expect(panel.scrollHeight).toBeGreaterThan(panel.clientHeight);
  });

  test("flips above the trigger when there's no room below", async () => {
    const panel = await openStill(
      <Example
        defaultOpen
        wrapper={{ position: "fixed", insetBlockEnd: 16, insetInlineStart: 16 }}
      />,
    );
    const button = document.querySelector(".nuv-button") as Element;

    expect(rect(panel).bottom).toBeLessThanOrEqual(rect(button).top);
  });

  test("a variable changes the row height", async () => {
    await openStill(
      <Example
        defaultOpen
        content={{
          style: { "--nuv-dropdown-menu-item-height": "3.5rem" } as never,
        }}
      />,
    );

    expect(rect(item("Rename").element()).height).toBe(56);
  });
});

describe("styles", () => {
  test("the item under the pointer is filled the same way", async () => {
    await openStill(<Example defaultOpen />);
    const style = getComputedStyle(item("Rename").element());
    const before = style.backgroundColor;

    await userEvent.hover(item("Rename"));

    await expect.element(item("Rename")).toHaveAttribute("data-highlighted");
    expect(style.backgroundColor).not.toBe(before);
    expect(contrast(style.color, style.backgroundColor)).toBeGreaterThanOrEqual(
      4.5,
    );
  });

  test("a submenu's trigger stays marked while focus is in the submenu", async () => {
    await openStill(<Example defaultOpen />);
    const style = getComputedStyle(item("Move to").element());
    const resting = style.backgroundColor;

    await item("Move to").click();
    await expect.element(item("Archive")).toBeVisible();
    await userEvent.hover(item("Archive"));
    await expect.element(item("Archive")).toHaveAttribute("data-highlighted");

    await expect
      .element(item("Move to"))
      .not.toHaveAttribute("data-highlighted");
    expect(style.backgroundColor).not.toBe(resting);
    // Marked, but not filled like the row that has focus.
    expect(style.backgroundColor).not.toBe(
      getComputedStyle(item("Archive").element()).backgroundColor,
    );
  });

  test("a variable changes the highlight", async () => {
    await openStill(
      <Example
        defaultOpen
        content={{
          style: {
            "--nuv-dropdown-menu-highlight-bg": "rgb(0, 0, 0)",
            "--nuv-dropdown-menu-highlight-fg": "rgb(255, 255, 255)",
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
    await openStill(<Example defaultOpen />);
    const style = getComputedStyle(item("Delete").element());
    const resting = style.color;

    await userEvent.hover(item("Delete"));
    await expect.element(item("Delete")).toHaveAttribute("data-highlighted");

    expect(style.backgroundColor).toBe(resting);
    expect(contrast(style.color, style.backgroundColor)).toBeGreaterThan(4.5);
  });

  test("pops in when motion is fine", async () => {
    await emulateMedia({ reducedMotion: "no-preference" });
    await render(<Example defaultOpen />);

    await expect.element(menu()).toBeVisible();
    expect(getComputedStyle(menu().element()).animationName).toBe(
      "nuv-dropdown-menu-in",
    );
  });

  test("still closes after its exit animation", async () => {
    await emulateMedia({ reducedMotion: "no-preference" });
    await render(<Example defaultOpen />);
    await expect.element(menu()).toBeVisible();

    await userEvent.keyboard("{Escape}");

    await expect.element(menu()).not.toBeInTheDocument();
  });

  test("doesn't animate when reduced motion is on", async () => {
    const panel = await openStill(<Example defaultOpen />);

    expect(getComputedStyle(panel).animationName).toBe("none");
  });
});

describe.each(themes)("accessibility in %s", (theme) => {
  test("the open menu passes axe", async () => {
    setPageTheme(theme);
    await openStill(<Example defaultOpen />);
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
    await emulateMedia({ reducedMotion: "reduce" });
    await render(<ViewMenu />);
    await expect
      .element(page.getByRole("menuitemradio", { name: "Name" }))
      .toBeVisible();

    expect(await axe(document.body, behindOpenList)).toHaveNoViolations();
  });
});
