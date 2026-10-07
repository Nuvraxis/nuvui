import "../../styles/index.scss";
import { axe, outsideLandmarks } from "@nuvui/tooling/test/axe";
import { contrast } from "@nuvui/tooling/test/contrast";
import { emulateMedia, setViewport } from "@nuvui/tooling/test/media";
import {
  expectNoViolations,
  renderThemed,
  setPageTheme,
  themes,
} from "@nuvui/tooling/test/themed";
import { createRef, useState } from "react";
import { describe, expect, test, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import {
  Menubar,
  MenubarCheckboxItem,
  MenubarContent,
  type MenubarContentProps,
  MenubarItem,
  MenubarLabel,
  MenubarMenu,
  type MenubarProps,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarSeparator,
  MenubarShortcut,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
} from "./menubar";

interface ExampleProps extends Omit<MenubarProps, "onSelect" | "content"> {
  content?: MenubarContentProps;
  onSelect?: (action: string) => void;
}

function Example({ content, onSelect, ...props }: ExampleProps) {
  const [grid, setGrid] = useState(false);
  const [zoom, setZoom] = useState("100");
  return (
    <Menubar aria-label="Document" {...props}>
      <MenubarMenu value="file">
        <MenubarTrigger>File</MenubarTrigger>
        <MenubarContent {...content}>
          <MenubarItem onSelect={() => onSelect?.("new")}>
            New tab
            <MenubarShortcut>Ctrl+T</MenubarShortcut>
          </MenubarItem>
          <MenubarItem disabled>New window</MenubarItem>
          <MenubarSub>
            <MenubarSubTrigger>Share</MenubarSubTrigger>
            <MenubarSubContent>
              <MenubarItem onSelect={() => onSelect?.("email")}>
                Email
              </MenubarItem>
              <MenubarItem>Messages</MenubarItem>
            </MenubarSubContent>
          </MenubarSub>
          <MenubarSeparator />
          <MenubarItem intent="danger" onSelect={() => onSelect?.("close")}>
            Close window
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>
      <MenubarMenu value="edit">
        <MenubarTrigger>Edit</MenubarTrigger>
        <MenubarContent>
          <MenubarItem>Undo</MenubarItem>
          <MenubarItem>Redo</MenubarItem>
        </MenubarContent>
      </MenubarMenu>
      <MenubarMenu value="history">
        <MenubarTrigger disabled>History</MenubarTrigger>
        <MenubarContent>
          <MenubarItem>Back</MenubarItem>
        </MenubarContent>
      </MenubarMenu>
      <MenubarMenu value="view">
        <MenubarTrigger>View</MenubarTrigger>
        <MenubarContent>
          <MenubarCheckboxItem checked={grid} onCheckedChange={setGrid}>
            Show grid
          </MenubarCheckboxItem>
          <MenubarCheckboxItem checked="indeterminate">
            Show rulers
          </MenubarCheckboxItem>
          <MenubarSeparator />
          <MenubarRadioGroup value={zoom} onValueChange={setZoom}>
            <MenubarLabel>Zoom</MenubarLabel>
            <MenubarRadioItem value="100">100%</MenubarRadioItem>
            <MenubarRadioItem value="200">200%</MenubarRadioItem>
          </MenubarRadioGroup>
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  );
}

const bar = () => page.getByRole("menubar", { name: "Document" });
// The triggers are menu items too. These are the ones in the bar.
const trigger = (name: string) => bar().getByRole("menuitem", { name });
const menu = (name: string) => page.getByRole("menu", { name });
const item = (name: string) => page.getByRole("menuitem", { name });
const rect = (element: Element) => element.getBoundingClientRect();

// Radix moves focus a moment after an arrow key goes down. See the same
// helper in the radio group's tests.
async function arrow(key: "ArrowRight" | "ArrowLeft" | "ArrowDown") {
  await userEvent.keyboard(`{${key}>}`);
  await new Promise((resolve) => setTimeout(resolve, 30));
  await userEvent.keyboard(`{/${key}}`);
}

// The animation scales the panel, which would make measurements depend on
// timing.
async function openStill(node: React.ReactNode, name = "File") {
  await emulateMedia({ reducedMotion: "reduce" });
  await render(node);
  await expect.element(menu(name)).toBeVisible();
  return menu(name).element();
}

describe("rendering", () => {
  test("is a menu bar whose entries each open a menu", async () => {
    await render(<Example />);

    await expect.element(bar()).toHaveClass("nuv-menubar");
    await expect
      .element(trigger("File"))
      .toHaveAttribute("aria-haspopup", "menu");
    await expect
      .element(trigger("File"))
      .toHaveAttribute("aria-expanded", "false");
    await expect.element(menu("File")).not.toBeInTheDocument();

    await trigger("File").click();

    await expect.element(menu("File")).toBeVisible();
    await expect
      .element(trigger("File"))
      .toHaveAttribute("aria-expanded", "true");
  });

  test("the page behind stays reachable while a menu is open", async () => {
    await render(
      <>
        <Example defaultValue="file" />
        <button type="button">Outside</button>
      </>,
    );
    await expect.element(menu("File")).toBeVisible();

    // A menu bar's menus aren't modal, so nothing else is hidden.
    await expect
      .element(page.getByRole("button", { name: "Outside" }))
      .toBeVisible();
    expect(getComputedStyle(document.body).pointerEvents).not.toBe("none");
  });

  test("choosing an item calls onSelect, closes the menu and returns focus", async () => {
    const onSelect = vi.fn();
    await render(<Example onSelect={onSelect} />);
    await trigger("File").click();

    await item("New tab").click();

    expect(onSelect).toHaveBeenCalledWith("new");
    await expect.element(menu("File")).not.toBeInTheDocument();
    await expect.element(trigger("File")).toHaveFocus();
  });

  test("a disabled entry doesn't open, and a disabled item can't be chosen", async () => {
    await render(<Example defaultValue="file" />);
    await expect.element(menu("File")).toBeVisible();

    await expect
      .element(item("New window"))
      .toHaveAttribute("aria-disabled", "true");
    await expect.element(trigger("History")).toBeDisabled();
    await trigger("History").click({ force: true });

    await expect.element(menu("History")).not.toBeInTheDocument();
  });

  test("renders its menus at the end of body, or in a container when given one", async () => {
    function InSection() {
      const [section, setSection] = useState<HTMLElement | null>(null);
      return (
        <section ref={setSection} data-testid="section">
          <Example defaultValue="file" content={{ container: section }} />
        </section>
      );
    }
    const first = await render(<Example defaultValue="file" />);
    await expect.element(menu("File")).toBeVisible();
    expect(first.container.contains(menu("File").element())).toBe(false);
    await first.unmount();

    await render(<InSection />);
    await expect.element(menu("File")).toBeVisible();
    expect(
      page.getByTestId("section").element().contains(menu("File").element()),
    ).toBe(true);
  });

  test("forwards refs and keeps classNames", async () => {
    const barRef = createRef<HTMLDivElement>();
    const triggerRef = createRef<HTMLButtonElement>();
    const contentRef = createRef<HTMLDivElement>();
    const itemRef = createRef<HTMLDivElement>();
    await render(
      <Menubar ref={barRef} className="mine" aria-label="Document">
        <MenubarMenu value="file">
          <MenubarTrigger ref={triggerRef} className="entry">
            File
          </MenubarTrigger>
          <MenubarContent ref={contentRef} className="panel">
            <MenubarItem ref={itemRef} className="row" intent="danger">
              Close window
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>,
    );
    await trigger("File").click();
    await expect.element(menu("File")).toBeVisible();

    await expect.element(bar()).toHaveClass("nuv-menubar", "mine");
    await expect
      .element(trigger("File"))
      .toHaveClass("nuv-menubar__trigger", "entry");
    await expect
      .element(menu("File"))
      .toHaveClass("nuv-menubar__content", "panel");
    await expect
      .element(item("Close window"))
      .toHaveClass("nuv-menubar__item", "nuv-menubar__item--danger", "row");
    expect(barRef.current).toBe(bar().element());
    expect(triggerRef.current).toBe(trigger("File").element());
    expect(contentRef.current).toBe(menu("File").element());
    expect(itemRef.current).toBe(item("Close window").element());
  });

  test("can be controlled", async () => {
    const onValueChange = vi.fn();
    await render(<Example value="edit" onValueChange={onValueChange} />);
    await expect.element(menu("Edit")).toBeVisible();

    await userEvent.keyboard("{Escape}");

    expect(onValueChange).toHaveBeenCalledWith("");
    // Still open, because the parent hasn't changed the prop.
    await expect.element(menu("Edit")).toBeVisible();
  });
});

describe("keyboard", () => {
  test("the bar is one tab stop", async () => {
    await render(
      <>
        <Example />
        <button type="button">After</button>
      </>,
    );

    await userEvent.keyboard("{Tab}");
    await expect.element(trigger("File")).toHaveFocus();
    await userEvent.keyboard("{Tab}");

    await expect
      .element(page.getByRole("button", { name: "After" }))
      .toHaveFocus();
  });

  test("the arrow keys move along the bar, skip a disabled entry and wrap", async () => {
    await render(<Example />);
    await userEvent.keyboard("{Tab}");
    await expect.element(trigger("File")).toHaveFocus();

    await arrow("ArrowRight");
    await expect.element(trigger("Edit")).toHaveFocus();
    await arrow("ArrowRight");
    await expect.element(trigger("View")).toHaveFocus();
    await arrow("ArrowRight");
    await expect.element(trigger("File")).toHaveFocus();
    await arrow("ArrowLeft");
    await expect.element(trigger("View")).toHaveFocus();
  });

  test.each(["{Enter}", " ", "{ArrowDown}"])(
    "%s on an entry opens its menu on the first item",
    async (key) => {
      await render(<Example />);
      await userEvent.keyboard("{Tab}");
      await expect.element(trigger("File")).toHaveFocus();

      await userEvent.keyboard(key);

      await expect.element(menu("File")).toBeVisible();
      await expect.element(item("New tab")).toHaveFocus();
    },
  );

  test("inside a menu, the right and left arrows go to the menus beside it", async () => {
    await render(<Example />);
    await userEvent.keyboard("{Tab}");
    await userEvent.keyboard("{Enter}");
    await expect.element(item("New tab")).toHaveFocus();

    await arrow("ArrowRight");
    await expect.element(menu("Edit")).toBeVisible();
    await expect.element(menu("File")).not.toBeInTheDocument();
    // Radix puts focus on the new menu, not on its first item. The down
    // arrow goes there.
    await expect.element(menu("Edit")).toHaveFocus();
    await userEvent.keyboard("{ArrowDown}");
    await expect.element(item("Undo")).toHaveFocus();

    await arrow("ArrowLeft");
    await expect.element(menu("File")).toBeVisible();
    await expect.element(menu("Edit")).not.toBeInTheDocument();
  });

  test("arrow keys move between items and skip disabled ones", async () => {
    await render(<Example />);
    await userEvent.keyboard("{Tab}");
    await userEvent.keyboard("{Enter}");
    await expect.element(item("New tab")).toHaveFocus();

    await userEvent.keyboard("{ArrowDown}");
    await expect.element(item("Share")).toHaveFocus();
    await userEvent.keyboard("{End}");
    await expect.element(item("Close window")).toHaveFocus();
    await userEvent.keyboard("{Home}");
    await expect.element(item("New tab")).toHaveFocus();
  });

  test("Escape closes the menu and returns focus to its entry", async () => {
    await render(<Example />);
    await userEvent.keyboard("{Tab}");
    await userEvent.keyboard("{Enter}");
    await expect.element(menu("File")).toBeVisible();

    await userEvent.keyboard("{Escape}");

    await expect.element(menu("File")).not.toBeInTheDocument();
    await expect.element(trigger("File")).toHaveFocus();
  });

  test("dir=rtl swaps the arrow keys", async () => {
    await render(<Example dir="rtl" />);
    await userEvent.keyboard("{Tab}");
    await expect.element(trigger("File")).toHaveFocus();

    await arrow("ArrowLeft");

    await expect.element(trigger("Edit")).toHaveFocus();
  });

  test("an entry with keyboard focus has a ring", async () => {
    await render(<Example />);

    await userEvent.keyboard("{Tab}");

    await expect.element(trigger("File")).toHaveFocus();
    const style = getComputedStyle(trigger("File").element());
    expect(style.outlineStyle).toBe("solid");
    expect(
      contrast(
        style.outlineColor,
        getComputedStyle(bar().element()).backgroundColor,
      ),
    ).toBeGreaterThanOrEqual(3);
  });
});

describe("pointer", () => {
  test("with one menu open, moving to another entry opens that one", async () => {
    await render(<Example />);
    await trigger("File").click();
    await expect.element(menu("File")).toBeVisible();

    await userEvent.hover(trigger("Edit"));

    await expect.element(menu("Edit")).toBeVisible();
    await expect.element(menu("File")).not.toBeInTheDocument();
  });

  test("moving over the bar opens nothing until an entry is pressed", async () => {
    await render(<Example />);

    await userEvent.hover(trigger("Edit"));
    await new Promise((resolve) => setTimeout(resolve, 200));

    await expect.element(menu("Edit")).not.toBeInTheDocument();
  });

  test("a click outside closes the menu", async () => {
    await render(
      <>
        <Example defaultValue="file" />
        <button type="button" style={{ marginBlockStart: 300 }}>
          Outside
        </button>
      </>,
    );
    await expect.element(menu("File")).toBeVisible();

    await page.getByRole("button", { name: "Outside" }).click();

    await expect.element(menu("File")).not.toBeInTheDocument();
  });
});

describe("submenu", () => {
  test("the right arrow opens it, and the left arrow closes it", async () => {
    await render(<Example />);
    await userEvent.keyboard("{Tab}");
    await userEvent.keyboard("{Enter}");
    await userEvent.keyboard("{ArrowDown}");
    await expect.element(item("Share")).toHaveFocus();

    await arrow("ArrowRight");
    await expect.element(menu("Share")).toBeVisible();
    await expect.element(menu("Share")).toHaveClass("nuv-menubar__content");
    await expect.element(item("Email")).toHaveFocus();

    await arrow("ArrowLeft");
    await expect.element(menu("Share")).not.toBeInTheDocument();
    await expect.element(item("Share")).toHaveFocus();
  });

  test("choosing inside it closes the whole menu", async () => {
    const onSelect = vi.fn();
    await render(<Example defaultValue="file" onSelect={onSelect} />);

    await item("Share").click();
    await item("Email").click();

    expect(onSelect).toHaveBeenCalledWith("email");
    await expect.element(menu("File")).not.toBeInTheDocument();
  });

  test("on a phone it stays on the screen", async () => {
    await setViewport("phone");
    await openStill(<Example defaultValue="file" />);

    await item("Share").click();
    await expect.element(menu("Share")).toBeVisible();

    const panel = rect(menu("Share").element());
    expect(panel.left).toBeGreaterThanOrEqual(8);
    expect(panel.right).toBeLessThanOrEqual(window.innerWidth - 8);
    expect(document.documentElement.scrollWidth).toBe(
      document.documentElement.clientWidth,
    );
  });
});

describe("checkable items", () => {
  const checkbox = (name: string) =>
    page.getByRole("menuitemcheckbox", { name });
  const radio = (name: string) => page.getByRole("menuitemradio", { name });
  const display = (element: Element, part: string) =>
    getComputedStyle(element.querySelector(`.nuv-menubar__${part}`) as Element)
      .display;

  test("a checkbox item shows a check once it's chosen", async () => {
    await render(<Example defaultValue="view" />);
    await expect.element(checkbox("Show grid")).toBeVisible();
    expect(
      checkbox("Show grid").element().querySelector(".nuv-menubar__indicator"),
    ).toBeNull();

    await checkbox("Show grid").click();
    await trigger("View").click();

    await expect
      .element(checkbox("Show grid"))
      .toHaveAttribute("aria-checked", "true");
    expect(display(checkbox("Show grid").element(), "check")).not.toBe("none");
  });

  test("an indeterminate checkbox item shows a dash", async () => {
    await render(<Example defaultValue="view" />);
    await expect.element(checkbox("Show rulers")).toBeVisible();
    const element = checkbox("Show rulers").element();

    expect(element.getAttribute("aria-checked")).toBe("mixed");
    expect(display(element, "dash")).not.toBe("none");
    expect(display(element, "check")).toBe("none");
  });

  test("radio items mark the one that's selected", async () => {
    await render(<Example defaultValue="view" />);

    await expect.element(radio("100%")).toHaveAttribute("aria-checked", "true");
    await radio("200%").click();
    await trigger("View").click();

    await expect.element(radio("200%")).toHaveAttribute("aria-checked", "true");
    await expect
      .element(radio("100%"))
      .toHaveAttribute("aria-checked", "false");
  });
});

describe("layout", () => {
  test("entries are 32px tall with a mouse, in a bar with an edge", async () => {
    await render(<Example />);

    expect(rect(trigger("File").element()).height).toBe(32);
    // The entries, 4px of padding above and below, and the 1px border.
    expect(rect(bar().element()).height).toBe(42);
    expect(getComputedStyle(bar().element()).borderTopStyle).toBe("solid");
  });

  test("a menu opens under its entry, lined up with its start edge", async () => {
    const panel = await openStill(<Example defaultValue="edit" />, "Edit");
    const entry = rect(trigger("Edit").element());

    expect(rect(panel).top - entry.bottom).toBe(6);
    // Radix puts the menu on a whole pixel, and the entry isn't on one.
    expect(Math.abs(rect(panel).left - entry.left)).toBeLessThan(1);
  });

  test("rows are 32px tall with a mouse", async () => {
    await openStill(<Example defaultValue="file" />);

    expect(rect(item("New tab").element()).height).toBe(32);
  });

  test("a shortcut sits at the end of its row, and stays out of the item's name", async () => {
    await openStill(<Example defaultValue="file" />);
    const row = rect(item("New tab").element());
    const keys = page.getByText("Ctrl+T").element();

    await expect.element(item("New tab")).toHaveAccessibleName("New tab");
    // The row's 12px of padding, give or take the panel's fractional width.
    expect(row.right - rect(keys).right).toBeCloseTo(12, 0);
    expect(getComputedStyle(keys).fontSize).toBe("12px");
  });

  test("more entries than fit a narrow screen wrap, and the page doesn't scroll sideways", async () => {
    await setViewport("phone");
    await render(
      <div style={{ inlineSize: 200 }}>
        <Example />
      </div>,
    );

    expect(rect(bar().element()).width).toBe(200);
    expect(rect(trigger("View").element()).top).toBeGreaterThan(
      rect(trigger("File").element()).top,
    );
    expect(document.documentElement.scrollWidth).toBe(
      document.documentElement.clientWidth,
    );
  });

  test("a long menu stays on the screen and scrolls inside itself", async () => {
    await setViewport("phone");
    await emulateMedia({ reducedMotion: "reduce" });
    await render(
      <Menubar defaultValue="file" aria-label="Document">
        <MenubarMenu value="file">
          <MenubarTrigger>File</MenubarTrigger>
          <MenubarContent>
            {Array.from({ length: 40 }, (_, index) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: static filler
              <MenubarItem key={index}>Item {index}</MenubarItem>
            ))}
          </MenubarContent>
        </MenubarMenu>
      </Menubar>,
    );
    await expect.element(menu("File")).toBeVisible();
    const panel = menu("File").element();

    expect(rect(panel).bottom).toBeLessThanOrEqual(window.innerHeight);
    expect(panel.scrollHeight).toBeGreaterThan(panel.clientHeight);
  });
});

describe("styles", () => {
  test("the entry whose menu is open is marked", async () => {
    await render(<Example />);
    const style = getComputedStyle(trigger("File").element());
    const resting = style.backgroundColor;

    await trigger("File").click();
    await expect.element(menu("File")).toBeVisible();
    // Off the entry, so that what's measured isn't its hover color.
    await userEvent.hover(item("Close window"));

    expect(style.backgroundColor).not.toBe(resting);
  });

  test("the item under the pointer is filled", async () => {
    await openStill(<Example defaultValue="file" />);
    const style = getComputedStyle(item("New tab").element());
    const before = style.backgroundColor;

    await userEvent.hover(item("New tab"));

    await expect.element(item("New tab")).toHaveAttribute("data-highlighted");
    expect(style.backgroundColor).not.toBe(before);
    expect(
      contrast(
        style.backgroundColor,
        getComputedStyle(menu("File").element()).backgroundColor,
      ),
    ).toBeGreaterThanOrEqual(3);
    expect(contrast(style.color, style.backgroundColor)).toBeGreaterThanOrEqual(
      4.5,
    );
  });

  test("the bar and its menus each have their own variables", async () => {
    await openStill(
      <Example
        defaultValue="file"
        style={
          {
            "--nuv-menubar-bg": "rgb(10, 20, 30)",
            "--nuv-menubar-radius": "0px",
          } as never
        }
        content={{
          style: {
            "--nuv-menubar-menu-item-height": "3.5rem",
            "--nuv-menubar-menu-bg": "rgb(40, 50, 60)",
          } as never,
        }}
      />,
    );

    const barStyle = getComputedStyle(bar().element());
    expect(barStyle.backgroundColor).toBe("rgb(10, 20, 30)");
    expect(barStyle.borderTopLeftRadius).toBe("0px");
    expect(rect(item("New tab").element()).height).toBe(56);
    expect(getComputedStyle(menu("File").element()).backgroundColor).toBe(
      "rgb(40, 50, 60)",
    );
  });

  test("a menu pops in when motion is fine", async () => {
    await emulateMedia({ reducedMotion: "no-preference" });
    await render(<Example defaultValue="file" />);

    await expect.element(menu("File")).toBeVisible();
    expect(getComputedStyle(menu("File").element()).animationName).toBe(
      "nuv-menubar-menu-in",
    );
  });

  // With an exit animation the old menu would still be on the page when
  // focus moves into the new one, and Radix would close the bar.
  test("a menu leaves at once, so the next one can open", async () => {
    await emulateMedia({ reducedMotion: "no-preference" });
    await render(<Example defaultValue="file" />);
    await expect.element(menu("File")).toBeVisible();

    await userEvent.hover(trigger("Edit"));

    await expect.element(menu("Edit")).toBeVisible();
    expect(menu("File").query()).toBeNull();
  });

  test("it doesn't animate when reduced motion is on", async () => {
    const panel = await openStill(<Example defaultValue="file" />);

    expect(getComputedStyle(panel).animationName).toBe("none");
  });
});

describe.each(themes)("accessibility in %s", (theme) => {
  test("the bar passes axe", async () => {
    const screen = await renderThemed(theme, <Example />);

    await expectNoViolations(screen.container);
  });

  test("an open menu passes axe", async () => {
    setPageTheme(theme);
    await openStill(<Example defaultValue="file" />);
    // One row filled while axe looks, so its colors are checked as well.
    await userEvent.hover(item("New tab"));
    await expect.element(item("New tab")).toHaveAttribute("data-highlighted");

    const results = await axe(document.body, outsideLandmarks);

    expect(results).toHaveNoViolations();
    const checked = results.passes.find((rule) => rule.id === "color-contrast");
    // The entries in the bar and the enabled items.
    expect(checked?.nodes.length).toBeGreaterThanOrEqual(6);
  });

  test("the menu with checkable items passes axe", async () => {
    setPageTheme(theme);
    await openStill(<Example defaultValue="view" />, "View");

    expect(await axe(document.body, outsideLandmarks)).toHaveNoViolations();
  });
});
