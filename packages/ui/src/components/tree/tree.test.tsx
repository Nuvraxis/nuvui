import "../../styles/index.scss";
import { contrast } from "@nuvui/tooling/test/contrast";
import { emulateMedia, setViewport } from "@nuvui/tooling/test/media";
import {
  expectNoViolations,
  renderThemed,
  themes,
} from "@nuvui/tooling/test/themed";
import { Component, createRef, type ReactNode, useState } from "react";
import { describe, expect, test, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { Tree, TreeItem, type TreeProps } from "./tree";

// A small set of files. `src` and `test` open, and `notes` can't be used.
function Files(props: Partial<TreeProps>) {
  return (
    <Tree aria-label="Files" {...props}>
      <TreeItem value="src" label="src">
        <TreeItem value="components" label="components">
          <TreeItem value="button" label="button.tsx" />
          <TreeItem value="tree" label="tree.tsx" />
        </TreeItem>
        <TreeItem value="index" label="index.ts" />
      </TreeItem>
      <TreeItem value="test" label="test">
        <TreeItem value="setup" label="setup.ts" />
      </TreeItem>
      <TreeItem value="notes" label="notes.md" disabled />
      <TreeItem value="readme" label="README.md" />
    </Tree>
  );
}

const tree = () => page.getByRole("tree", { name: "Files" });
const row = (name: string) => page.getByRole("treeitem", { name, exact: true });
const rowEl = (name: string) => row(name).element() as HTMLElement;
// The part of a row that's pressed, which isn't the rows inside it.
const press = (name: string, options?: { shift?: boolean }) =>
  userEvent.click(
    rowEl(name).querySelector(":scope > .nuv-tree__row") as Element,
    options?.shift ? { modifiers: ["Shift"] } : undefined,
  );
const shown = () =>
  Array.from(
    tree().element().querySelectorAll<HTMLElement>('[role="treeitem"]'),
  ).map((item) => item.dataset.value);
const selected = () =>
  Array.from(
    tree().element().querySelectorAll<HTMLElement>('[aria-selected="true"]'),
  ).map((item) => item.dataset.value);
const focused = () => (document.activeElement as HTMLElement).dataset.value;
const style = (element: Element) => getComputedStyle(element);
const rect = (element: Element) => element.getBoundingClientRect();
const rowBox = (name: string) =>
  rowEl(name).querySelector(":scope > .nuv-tree__row") as HTMLElement;

describe("rendering", () => {
  test("is a tree of rows, and only the rows of open rows are in the page", async () => {
    await render(<Files defaultExpanded={["src"]} />);

    await expect.element(tree()).toBeVisible();
    expect(shown()).toEqual([
      "src",
      "components",
      "index",
      "test",
      "notes",
      "readme",
    ]);
    expect(rowEl("src").getAttribute("aria-expanded")).toBe("true");
    expect(rowEl("components").getAttribute("aria-expanded")).toBe("false");
    // A row with nothing inside it doesn't say it opens.
    expect(rowEl("index.ts").hasAttribute("aria-expanded")).toBe(false);
  });

  test("the rows inside a row are a group inside it", async () => {
    await render(<Files defaultExpanded={["src"]} />);
    const group = rowEl("src").querySelector(":scope > [role='group']");

    expect(group?.tagName).toBe("UL");
    expect(group?.contains(rowEl("index.ts"))).toBe(true);
    expect(group?.contains(rowEl("test"))).toBe(false);
  });

  test("a row's name is its own label, not the rows inside it too", async () => {
    await render(<Files defaultExpanded={["src", "components"]} />);

    await expect.element(row("src")).toBeVisible();
    expect(rowEl("src").textContent).toContain("button.tsx");
    await expect.element(row("src")).toHaveAccessibleName("src");
  });

  test("without selection no row says whether it's selected", async () => {
    await render(<Files />);

    expect(rowEl("src").hasAttribute("aria-selected")).toBe(false);
    expect(tree().element().hasAttribute("aria-multiselectable")).toBe(false);
  });

  test("with selection every row says, and a tree for several says so", async () => {
    await render(<Files selectionMode="multiple" defaultValue={["readme"]} />);

    expect(rowEl("src").getAttribute("aria-selected")).toBe("false");
    expect(rowEl("README.md").getAttribute("aria-selected")).toBe("true");
    expect(tree().element().getAttribute("aria-multiselectable")).toBe("true");
  });

  test("a disabled row says so", async () => {
    await render(<Files />);

    expect(rowEl("notes.md").getAttribute("aria-disabled")).toBe("true");
    expect(rowEl("README.md").hasAttribute("aria-disabled")).toBe(false);
  });

  test("forwards refs, class names and other props, on the tree and on a row", async () => {
    const treeRef = createRef<HTMLUListElement>();
    const itemRef = createRef<HTMLLIElement>();
    await render(
      <Tree ref={treeRef} aria-label="Files" className="mine" data-kind="a">
        <TreeItem
          ref={itemRef}
          value="one"
          label="One"
          className="row"
          data-kind="b"
        />
      </Tree>,
    );

    expect(treeRef.current?.className).toBe("nuv-tree mine");
    expect(treeRef.current?.dataset.kind).toBe("a");
    expect(itemRef.current?.className).toBe("nuv-tree__item row");
    expect(itemRef.current?.dataset.kind).toBe("b");
  });

  test("a row outside a tree says what's wrong", async () => {
    class Boundary extends Component<
      { children: ReactNode },
      { message: string }
    > {
      override state = { message: "" };
      static getDerivedStateFromError(error: Error) {
        return { message: error.message };
      }
      override render() {
        return this.state.message ? (
          <p role="alert">{this.state.message}</p>
        ) : (
          this.props.children
        );
      }
    }
    const quiet = vi.spyOn(console, "error").mockImplementation(() => {});

    await render(
      <Boundary>
        <TreeItem value="one" label="One" />
      </Boundary>,
    );

    await expect
      .poll(() => page.getByRole("alert").element().textContent)
      .toBe("TreeItem has to be inside a Tree.");
    quiet.mockRestore();
  });
});

describe("the tab stop", () => {
  test("is one row: the first, until focus has been somewhere else", async () => {
    await render(<Files defaultExpanded={["src"]} />);
    const stops = () =>
      shown().filter(
        (_, index) =>
          (
            tree().element().querySelectorAll('[role="treeitem"]')[
              index
            ] as HTMLElement
          ).tabIndex === 0,
      );

    await expect.poll(stops).toEqual(["src"]);

    await userEvent.tab();
    expect(focused()).toBe("src");
    await userEvent.keyboard("{ArrowDown}{ArrowDown}");
    expect(focused()).toBe("index");
    await expect.poll(stops).toEqual(["index"]);
  });

  test("goes to the first row when the row it was on is closed away", async () => {
    function Closable() {
      const [expanded, setExpanded] = useState(["src"]);
      return (
        <>
          <button type="button" onClick={() => setExpanded([])}>
            Close all
          </button>
          <Files expanded={expanded} onExpandedChange={setExpanded} />
        </>
      );
    }
    await render(<Closable />);
    rowEl("index.ts").focus();
    await expect.poll(() => rowEl("index.ts").tabIndex).toBe(0);

    await page.getByRole("button", { name: "Close all" }).click();

    await expect.poll(shown).toEqual(["src", "test", "notes", "readme"]);
    await expect.poll(() => rowEl("src").tabIndex).toBe(0);
  });
});

describe("the arrow keys", () => {
  test("Down and Up move through the rows that are shown", async () => {
    await render(<Files defaultExpanded={["src"]} />);
    rowEl("src").focus();

    await userEvent.keyboard("{ArrowDown}");
    expect(focused()).toBe("components");
    await userEvent.keyboard("{ArrowDown}");
    // Past the rows of a closed row, which aren't there.
    expect(focused()).toBe("index");
    await userEvent.keyboard("{ArrowUp}{ArrowUp}{ArrowUp}");
    expect(focused()).toBe("src");
  });

  test("they stop at a disabled row, so it can be read", async () => {
    await render(<Files />);
    rowEl("test").focus();

    await userEvent.keyboard("{ArrowDown}");

    expect(focused()).toBe("notes");
  });

  test("Right opens a closed row, then goes into it", async () => {
    await render(<Files />);
    rowEl("src").focus();

    await userEvent.keyboard("{ArrowRight}");
    await expect
      .poll(() => rowEl("src").getAttribute("aria-expanded"))
      .toBe("true");
    expect(focused()).toBe("src");

    await userEvent.keyboard("{ArrowRight}");
    expect(focused()).toBe("components");
  });

  test("Right does nothing on a row that doesn't open", async () => {
    await render(<Files />);
    rowEl("README.md").focus();

    await userEvent.keyboard("{ArrowRight}");

    expect(focused()).toBe("readme");
  });

  test("Left closes an open row, and from a row inside goes to the row it's in", async () => {
    await render(<Files defaultExpanded={["src", "components"]} />);
    rowEl("tree.tsx").focus();

    await userEvent.keyboard("{ArrowLeft}");
    expect(focused()).toBe("components");

    await userEvent.keyboard("{ArrowLeft}");
    await expect
      .poll(() => rowEl("components").getAttribute("aria-expanded"))
      .toBe("false");
    expect(focused()).toBe("components");

    await userEvent.keyboard("{ArrowLeft}");
    expect(focused()).toBe("src");
  });

  test("Home and End go to the first and the last row shown", async () => {
    await render(<Files defaultExpanded={["test"]} />);
    rowEl("test").focus();

    await userEvent.keyboard("{End}");
    expect(focused()).toBe("readme");
    await userEvent.keyboard("{Home}");
    expect(focused()).toBe("src");
  });

  test("in a right-to-left page Left opens and Right closes", async () => {
    await render(
      <div dir="rtl">
        <Files />
      </div>,
    );
    rowEl("src").focus();

    await userEvent.keyboard("{ArrowLeft}");
    await expect
      .poll(() => rowEl("src").getAttribute("aria-expanded"))
      .toBe("true");
    await userEvent.keyboard("{ArrowLeft}");
    expect(focused()).toBe("components");
    await userEvent.keyboard("{ArrowRight}");
    expect(focused()).toBe("src");
    await userEvent.keyboard("{ArrowRight}");
    await expect
      .poll(() => rowEl("src").getAttribute("aria-expanded"))
      .toBe("false");
  });

  test("a star opens every row beside this one", async () => {
    const onExpandedChange = vi.fn();
    await render(<Files onExpandedChange={onExpandedChange} />);
    rowEl("README.md").focus();

    await userEvent.keyboard("*");

    await expect
      .poll(shown)
      .toEqual([
        "src",
        "components",
        "index",
        "test",
        "setup",
        "notes",
        "readme",
      ]);
    expect(onExpandedChange).toHaveBeenLastCalledWith(["src", "test"]);
  });

  test("a key the tree has no use for is left alone", async () => {
    const onKeyDown = vi.fn();
    await render(
      // biome-ignore lint/a11y/noStaticElementInteractions: it listens for what the tree let through
      <div onKeyDown={(event) => onKeyDown(event.key, event.defaultPrevented)}>
        <Files />
      </div>,
    );
    rowEl("src").focus();

    await userEvent.keyboard("{ArrowDown}{F2}");

    expect(onKeyDown.mock.calls).toEqual([
      ["ArrowDown", true],
      ["F2", false],
    ]);
  });

  test("a key you handle yourself is left to you", async () => {
    await render(<Files onKeyDown={(event) => event.preventDefault()} />);
    rowEl("src").focus();

    await userEvent.keyboard("{ArrowDown}");

    expect(focused()).toBe("src");
  });
});

describe("typing", () => {
  test("a letter goes to the next row that starts with it, and round again", async () => {
    await render(<Files defaultExpanded={["src", "components"]} />);
    rowEl("src").focus();

    await userEvent.keyboard("t");
    expect(focused()).toBe("tree");
    // The same letter again, straight away, goes on to the next.
    await userEvent.keyboard("t");
    expect(focused()).toBe("test");
    await userEvent.keyboard("t");
    expect(focused()).toBe("tree");
  });

  test("letters typed quickly make a word", async () => {
    await render(<Files defaultExpanded={["src", "components"]} />);
    rowEl("src").focus();

    await userEvent.keyboard("te");

    expect(focused()).toBe("test");
  });

  test("it goes by textValue when a row has one", async () => {
    await render(
      <Tree aria-label="Mail">
        <TreeItem value="drafts" label="Drafts" />
        <TreeItem value="inbox" label="12 Inbox" textValue="Inbox" />
      </Tree>,
    );
    (
      page.getByRole("treeitem", { name: "Drafts" }).element() as HTMLElement
    ).focus();

    await userEvent.keyboard("i");

    expect(focused()).toBe("inbox");
  });
});

describe("opening and closing", () => {
  test("a press on a row opens it, and another closes it", async () => {
    await render(<Files />);

    await press("src");
    await expect.poll(shown).toContain("components");
    expect(focused()).toBe("src");

    await press("src");
    await expect.poll(shown).not.toContain("components");
  });

  test("Enter and Space do the same, when there's nothing to select", async () => {
    await render(<Files />);
    rowEl("src").focus();

    await userEvent.keyboard("{Enter}");
    await expect.poll(shown).toContain("components");
    await userEvent.keyboard(" ");
    await expect.poll(shown).not.toContain("components");
  });

  test("you can keep which rows are open yourself", async () => {
    const onExpandedChange = vi.fn();
    await render(
      <Files expanded={["test"]} onExpandedChange={onExpandedChange} />,
    );

    await press("src");

    expect(onExpandedChange).toHaveBeenCalledWith(["test", "src"]);
    // Nothing changed, because nothing was done about it.
    expect(shown()).not.toContain("components");
  });

  test("a disabled row doesn't open", async () => {
    await render(
      <Tree aria-label="Files">
        <TreeItem value="locked" label="locked" disabled>
          <TreeItem value="secret" label="secret.txt" />
        </TreeItem>
      </Tree>,
    );
    const locked = page.getByRole("treeitem", { name: "locked" });

    await userEvent.click(
      locked.element().querySelector(".nuv-tree__row") as Element,
    );
    await userEvent.keyboard("{ArrowRight}{Enter} ");

    expect(locked.element().getAttribute("aria-expanded")).toBe("false");
  });
});

describe("selecting one", () => {
  test("a press selects the row, and the one before it lets go", async () => {
    const onValueChange = vi.fn();
    await render(
      <Files
        selectionMode="single"
        defaultExpanded={["src"]}
        onValueChange={onValueChange}
      />,
    );

    await press("index.ts");
    await expect.poll(selected).toEqual(["index"]);
    await press("README.md");
    await expect.poll(selected).toEqual(["readme"]);
    expect(onValueChange.mock.calls).toEqual([[["index"]], [["readme"]]]);
  });

  test("a press on a row that opens selects it and opens it", async () => {
    await render(<Files selectionMode="single" />);

    await press("src");

    await expect.poll(selected).toEqual(["src"]);
    expect(shown()).toContain("components");
  });

  test("a press on the chevron opens the row and selects nothing", async () => {
    await render(<Files selectionMode="single" />);

    await userEvent.click(
      rowEl("src").querySelector(".nuv-tree__chevron") as Element,
    );

    await expect.poll(shown).toContain("components");
    expect(selected()).toEqual([]);
  });

  test("Space selects without opening, and Enter does both", async () => {
    await render(<Files selectionMode="single" />);
    rowEl("src").focus();

    await userEvent.keyboard(" ");
    await expect.poll(selected).toEqual(["src"]);
    expect(shown()).not.toContain("components");

    rowEl("test").focus();
    await userEvent.keyboard("{Enter}");
    await expect.poll(selected).toEqual(["test"]);
    expect(shown()).toContain("setup");
  });

  test("moving with the arrow keys selects nothing", async () => {
    await render(<Files selectionMode="single" defaultValue={["src"]} />);
    rowEl("src").focus();

    await userEvent.keyboard("{ArrowDown}{ArrowDown}");

    expect(selected()).toEqual(["src"]);
  });

  test("a disabled row can't be selected", async () => {
    const onValueChange = vi.fn();
    await render(
      <Files selectionMode="single" onValueChange={onValueChange} />,
    );

    await press("notes.md");
    await userEvent.keyboard(" {Enter}");

    expect(onValueChange).not.toHaveBeenCalled();
    // The press still put focus there.
    expect(focused()).toBe("notes");
  });

  test("you can keep what's selected yourself", async () => {
    const onValueChange = vi.fn();
    await render(
      <Files
        selectionMode="single"
        value={["readme"]}
        onValueChange={onValueChange}
      />,
    );

    await press("test");

    expect(onValueChange).toHaveBeenCalledWith(["test"]);
    expect(selected()).toEqual(["readme"]);
  });
});

describe("selecting several", () => {
  test("a press adds a row, and a press on a selected row takes it out", async () => {
    await render(<Files selectionMode="multiple" defaultExpanded={["src"]} />);

    await press("index.ts");
    await press("README.md");
    await expect.poll(selected).toEqual(["index", "readme"]);

    await press("index.ts");
    await expect.poll(selected).toEqual(["readme"]);
  });

  test("Shift and a press selects every row from the last one pressed, but for disabled ones", async () => {
    await render(<Files selectionMode="multiple" defaultExpanded={["src"]} />);

    await press("index.ts");
    await press("README.md", { shift: true });

    await expect.poll(selected).toEqual(["index", "test", "readme"]);
    // And it didn't open the row it passed over.
    expect(shown()).not.toContain("setup");
  });

  test("Shift and an arrow selects the row it arrives at", async () => {
    await render(<Files selectionMode="multiple" defaultExpanded={["src"]} />);
    rowEl("components").focus();

    await userEvent.keyboard(" {Shift>}{ArrowDown}{ArrowDown}{/Shift}");

    await expect.poll(selected).toEqual(["components", "index", "test"]);
  });

  test("Ctrl and A selects every row shown that can be", async () => {
    await render(<Files selectionMode="multiple" defaultExpanded={["test"]} />);
    rowEl("src").focus();

    await userEvent.keyboard("{Control>}a{/Control}");

    await expect.poll(selected).toEqual(["src", "test", "setup", "readme"]);
  });

  test("Ctrl and A is the browser's when rows can't be selected, or only one can", async () => {
    const onKeyDown = vi.fn();
    await render(
      // biome-ignore lint/a11y/noStaticElementInteractions: it listens for what the tree let through
      <div onKeyDown={(event) => onKeyDown(event.defaultPrevented)}>
        <Files selectionMode="single" />
      </div>,
    );
    rowEl("src").focus();

    await userEvent.keyboard("{Control>}a{/Control}");

    expect(onKeyDown.mock.calls.at(-1)).toEqual([false]);
    expect(selected()).toEqual([]);
  });
});

describe("layout", () => {
  test("a row is 32px tall with a mouse, and its label is cut short when there's no room", async () => {
    await setViewport("desktop");
    await render(
      <div style={{ width: 160 }}>
        <Tree aria-label="Files">
          <TreeItem
            value="long"
            label="a-file-with-a-very-long-name-indeed.tsx"
          />
        </Tree>
      </div>,
    );
    const item = page.getByRole("treeitem").element();
    const box = item.querySelector(".nuv-tree__row") as HTMLElement;
    const label = item.querySelector(".nuv-tree__label") as HTMLElement;

    expect(rect(box).height).toBe(32);
    expect(rect(box).width).toBe(160);
    expect(label.scrollWidth).toBeGreaterThan(label.clientWidth);
    expect(style(label).textOverflow).toBe("ellipsis");
  });

  test("the rows inside a row are set in from it, with a line down their side", async () => {
    await render(<Files defaultExpanded={["src"]} />);
    const group = rowEl("src").querySelector(
      ":scope > .nuv-tree__group",
    ) as HTMLElement;

    expect(rect(rowBox("components")).left).toBeGreaterThan(
      rect(rowBox("src")).left,
    );
    expect(style(group).borderInlineStartWidth).toBe("1px");
    expect(style(group).borderInlineStartStyle).toBe("solid");
  });

  test("labels line up, whether or not their rows open", async () => {
    await render(<Files />);
    const label = (name: string) =>
      rect(rowEl(name).querySelector(".nuv-tree__label") as Element).left;

    expect(label("src")).toBe(label("README.md"));
    // The chevron's place is kept, with nothing drawn in it.
    expect(rowEl("README.md").querySelector(".nuv-tree__chevron svg")).toBe(
      null,
    );
    expect(rowEl("src").querySelector(".nuv-tree__chevron svg")).not.toBe(null);
  });

  test("the chevron turns when its row opens", async () => {
    await emulateMedia({ reducedMotion: "reduce" });
    await render(<Files defaultExpanded={["src"]} />);
    const chevron = (name: string) =>
      style(rowEl(name).querySelector(".nuv-tree__chevron") as Element)
        .transform;

    expect(chevron("src")).toBe("matrix(0, 1, -1, 0, 0, 0)");
    expect(chevron("test")).toBe("none");
  });

  test("a selected row has a background, heavier text and a bar at its start", async () => {
    await render(<Files selectionMode="single" defaultValue={["readme"]} />);
    const box = rowBox("README.md");
    const bar = getComputedStyle(box, "::before");

    expect(style(box).backgroundColor).not.toBe("rgba(0, 0, 0, 0)");
    expect(Number(style(box).fontWeight)).toBeGreaterThan(
      Number(style(rowBox("test")).fontWeight),
    );
    expect(bar.borderInlineStartWidth).toBe("2px");
    expect(bar.borderInlineStartStyle).toBe("solid");
    expect(
      contrast(bar.borderInlineStartColor, style(box).backgroundColor),
    ).toBeGreaterThanOrEqual(3);
  });

  test("the focus ring is on the row, not around the rows inside it", async () => {
    await render(<Files defaultExpanded={["src"]} />);

    await userEvent.tab();

    expect(focused()).toBe("src");
    expect(style(rowEl("src")).outlineStyle).toBe("none");
    expect(style(rowBox("src")).outlineStyle).toBe("solid");
    expect(style(rowBox("src")).outlineWidth).toBe("2px");
    expect(style(rowBox("components")).outlineStyle).toBe("none");
  });

  test("a disabled row is faded", async () => {
    await render(<Files />);

    expect(Number(style(rowBox("notes.md")).opacity)).toBeLessThan(1);
    expect(style(rowBox("README.md")).opacity).toBe("1");
  });
});

describe("theming", () => {
  test("its variables change its look", async () => {
    await setViewport("desktop");
    await render(
      <div
        style={
          {
            "--nuv-tree-row-height": "50px",
            "--nuv-tree-radius": "3px",
            "--nuv-tree-fg": "rgb(10, 20, 30)",
            "--nuv-tree-selected-bg": "rgb(200, 210, 220)",
            "--nuv-tree-selected-line": "rgb(1, 2, 3)",
            "--nuv-tree-selected-line-width": "4px",
            "--nuv-tree-chevron": "rgb(40, 50, 60)",
            "--nuv-tree-line": "rgb(70, 80, 90)",
            "--nuv-tree-gap": "5px",
          } as never
        }
      >
        <Files
          selectionMode="single"
          defaultValue={["src"]}
          defaultExpanded={["src"]}
        />
      </div>,
    );
    const box = rowBox("src");
    const bar = getComputedStyle(box, "::before");
    const group = rowEl("src").querySelector(".nuv-tree__group") as Element;

    expect(rect(box).height).toBe(50);
    expect(style(box).borderTopLeftRadius).toBe("3px");
    expect(style(box).color).toBe("rgb(10, 20, 30)");
    expect(style(box).backgroundColor).toBe("rgb(200, 210, 220)");
    expect(bar.borderInlineStartColor).toBe("rgb(1, 2, 3)");
    expect(bar.borderInlineStartWidth).toBe("4px");
    expect(
      style(box.querySelector(".nuv-tree__chevron") as Element).color,
    ).toBe("rgb(40, 50, 60)");
    expect(style(group).borderInlineStartColor).toBe("rgb(70, 80, 90)");
    expect(style(tree().element()).rowGap).toBe("5px");
  });

  test("the indent can be changed", async () => {
    const left = async (indent?: string) => {
      const screen = await render(
        <div style={indent ? ({ "--nuv-tree-indent": indent } as never) : {}}>
          <Files defaultExpanded={["src"]} />
        </div>,
      );
      const by = rect(rowBox("components")).left - rect(rowBox("src")).left;
      await screen.unmount();
      return by;
    };

    expect(await left()).toBe(16);
    expect(await left("40px")).toBe(40);
  });

  test("a hover color of your own is used, and not on a disabled row", async () => {
    await setViewport("desktop");
    await render(
      <div style={{ "--nuv-tree-hover-bg": "rgb(9, 8, 7)" } as never}>
        <Files />
      </div>,
    );

    await userEvent.hover(rowBox("README.md"));
    await expect
      .poll(() => style(rowBox("README.md")).backgroundColor)
      .toBe("rgb(9, 8, 7)");

    await userEvent.hover(rowBox("notes.md"));
    await expect
      .poll(() => style(rowBox("notes.md")).backgroundColor)
      .toBe("rgba(0, 0, 0, 0)");
  });

  test.each(themes)(
    "a selected row's text and bar can be read in %s",
    async (theme) => {
      await renderThemed(
        theme,
        <Files selectionMode="single" defaultValue={["readme"]} />,
      );
      const box = rowBox("README.md");
      const bar = getComputedStyle(box, "::before");

      expect(
        contrast(style(box).color, style(box).backgroundColor),
      ).toBeGreaterThanOrEqual(4.5);
      expect(
        contrast(bar.borderInlineStartColor, style(box).backgroundColor),
      ).toBeGreaterThanOrEqual(3);
    },
  );
});

describe.each(themes)("accessibility in %s", (theme) => {
  test("passes axe with rows open, selected and not", async () => {
    const screen = await renderThemed(
      theme,
      <>
        <Files defaultExpanded={["src", "components"]} />
        <Tree
          aria-label="Teams"
          selectionMode="multiple"
          defaultValue={["design"]}
          defaultExpanded={["company"]}
        >
          <TreeItem value="company" label="Acme">
            <TreeItem value="design" label="Design" />
            <TreeItem value="sales" label="Sales" />
          </TreeItem>
        </Tree>
      </>,
    );

    await expectNoViolations(screen.container);
  });
});
