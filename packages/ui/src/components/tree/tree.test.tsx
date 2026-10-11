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
import { Tree, TreeItem, type TreeMove, type TreeProps } from "./tree";

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

// Rows that really move: the data changes when the tree says it should.
interface Entry {
  id: string;
  inside?: Entry[];
}

const outline: Entry[] = [
  { id: "a", inside: [{ id: "a1" }, { id: "a2" }] },
  { id: "b", inside: [{ id: "b1" }] },
  { id: "c" },
];

function moved(entries: Entry[], move: TreeMove): Entry[] {
  const taken: Entry[] = [];
  const take = (from: Entry[]): Entry[] =>
    from.flatMap((entry) => {
      if (move.values.includes(entry.id)) {
        taken.push(entry);
        return [];
      }
      return [entry.inside ? { ...entry, inside: take(entry.inside) } : entry];
    });
  const put = (into: Entry[]): Entry[] =>
    into.flatMap((entry) => {
      if (entry.id !== move.target) {
        return [entry.inside ? { ...entry, inside: put(entry.inside) } : entry];
      }
      if (move.position === "before") return [...taken, entry];
      if (move.position === "after") return [entry, ...taken];
      return [{ ...entry, inside: [...(entry.inside ?? []), ...taken] }];
    });
  return put(take(entries));
}

function Outline(props: Partial<TreeProps>) {
  const [entries, setEntries] = useState(outline);
  const draw = (list: Entry[]): ReactNode =>
    list.map((entry) => (
      <TreeItem key={entry.id} value={entry.id} label={entry.id}>
        {entry.inside && entry.inside.length > 0 ? draw(entry.inside) : null}
      </TreeItem>
    ));
  return (
    <Tree
      aria-label="Files"
      defaultExpanded={["a"]}
      onMove={(move) => setEntries((now) => moved(now, move))}
      {...props}
    >
      {draw(entries)}
    </Tree>
  );
}

// Every row shown, with a dash for each row it's inside.
const shape = () =>
  Array.from(
    tree().element().querySelectorAll<HTMLElement>('[role="treeitem"]'),
  ).map((item) => {
    let depth = 0;
    for (
      let at = item.parentElement;
      at && at !== tree().element();
      at = at.parentElement
    ) {
      if (at.getAttribute("role") === "group") depth += 1;
    }
    return "-".repeat(depth) + item.dataset.value;
  });
const status = () => document.querySelector(".nuv-tree__status");

// A pointer, as the events one sends. `part` is how far down the row.
interface Point {
  x: number;
  y: number;
}
const pointOn = (name: string, part = 0.5): Point => {
  const box = rect(rowBox(name));
  return { x: box.left + box.width / 2, y: box.top + box.height * part };
};
const send = (type: string, at: Point, pointerType = "mouse") =>
  (document.elementFromPoint(at.x, at.y) ?? document.body).dispatchEvent(
    new PointerEvent(type, {
      bubbles: true,
      cancelable: true,
      pointerId: 1,
      pointerType,
      isPrimary: true,
      button: 0,
      clientX: at.x,
      clientY: at.y,
    }),
  );
// Picks a row up with a mouse and carries it to another, without letting go.
const carry = (from: string, to: string, part: number, x?: number) => {
  const start = pointOn(from);
  send("pointerdown", start);
  send("pointermove", { x: start.x, y: start.y + 6 });
  const end = pointOn(to, part);
  if (x !== undefined) end.x = x;
  send("pointermove", end);
  return end;
};
const drag = (from: string, to: string, part: number, x?: number) =>
  send("pointerup", carry(from, to, part, x));
const marked = () =>
  Array.from(tree().element().querySelectorAll<HTMLElement>("[data-drop]")).map(
    (item) => `${item.dataset.drop} ${item.dataset.value}`,
  );
const dragging = () =>
  Array.from(
    tree().element().querySelectorAll<HTMLElement>("li[data-dragging]"),
  ).map((item) => item.dataset.value);

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

describe("rows that can be moved", () => {
  test("without onMove nothing says they can, and Alt and an arrow is left alone", async () => {
    const onKeyDown = vi.fn();
    await render(
      // biome-ignore lint/a11y/noStaticElementInteractions: it listens for what the tree let through
      <div onKeyDown={(event) => onKeyDown(event.defaultPrevented)}>
        <Files />
      </div>,
    );
    rowEl("src").focus();

    await userEvent.keyboard("{Alt>}{ArrowDown}{/Alt}");

    expect(status()).toBe(null);
    expect(rowEl("src").hasAttribute("aria-keyshortcuts")).toBe(false);
    expect(onKeyDown.mock.calls.at(-1)).toEqual([false]);
    expect(focused()).toBe("src");
  });

  test("with onMove a row says its keys, but not a disabled row", async () => {
    await render(<Files onMove={() => {}} />);

    expect(rowEl("src").getAttribute("aria-keyshortcuts")).toBe(
      "Alt+ArrowUp Alt+ArrowDown",
    );
    expect(rowEl("notes.md").hasAttribute("aria-keyshortcuts")).toBe(false);
  });

  test("what a screen reader is told is beside the tree, not in it, and drawn for nobody", async () => {
    await render(<Files onMove={() => {}} />);
    const said = status() as HTMLElement;

    expect(said.getAttribute("role")).toBe("status");
    expect(tree().element().contains(said)).toBe(false);
    expect(tree().element().nextElementSibling).toBe(said);
    expect(rect(said).width).toBe(1);
    expect(style(said).position).toBe("absolute");
  });
});

describe("moving with the keys", () => {
  test("Alt and Down says the next place down, which is inside the row below", async () => {
    const onMove = vi.fn();
    await render(
      <Files defaultExpanded={["src", "components"]} onMove={onMove} />,
    );
    rowEl("button.tsx").focus();

    await userEvent.keyboard("{Alt>}{ArrowDown}{/Alt}");

    expect(onMove.mock.calls).toEqual([
      [{ values: ["button"], target: "tree", position: "inside" }],
    ]);
    // The tree moves nothing itself.
    expect(shown().slice(0, 4)).toEqual([
      "src",
      "components",
      "button",
      "tree",
    ]);
  });

  test("a place canDrop refuses is passed by", async () => {
    const onMove = vi.fn();
    const canDrop = vi.fn((move: TreeMove) => move.position !== "inside");
    await render(
      <Files
        defaultExpanded={["src", "components"]}
        onMove={onMove}
        canDrop={canDrop}
      />,
    );
    rowEl("button.tsx").focus();

    await userEvent.keyboard("{Alt>}{ArrowDown}{/Alt}");

    expect(canDrop).toHaveBeenCalledWith({
      values: ["button"],
      target: "tree",
      position: "inside",
    });
    expect(onMove.mock.calls).toEqual([
      [{ values: ["button"], target: "tree", position: "after" }],
    ]);
  });

  test("with nowhere it may go, nothing is said", async () => {
    const onMove = vi.fn();
    await render(<Files onMove={onMove} canDrop={() => false} />);
    rowEl("src").focus();

    await userEvent.keyboard("{Alt>}{ArrowDown}{ArrowUp}{/Alt}");

    expect(onMove).not.toHaveBeenCalled();
  });

  test("a row walks down through every place, and focus goes with it", async () => {
    await render(
      // Only b can be given rows.
      <Outline
        canDrop={(move) => move.position !== "inside" || move.target === "b"}
      />,
    );
    rowEl("a1").focus();
    const down = () => userEvent.keyboard("{Alt>}{ArrowDown}{/Alt}");

    await down();
    await expect.poll(shape).toEqual(["a", "-a2", "-a1", "b", "c"]);
    await expect.element(row("a1")).toHaveFocus();

    // Out of the end of the row it was in.
    await down();
    await expect.poll(shape).toEqual(["a", "-a2", "a1", "b", "c"]);
    await expect.element(row("a1")).toHaveFocus();

    // Into a closed row, which opens to show it.
    await down();
    await expect.poll(shape).toEqual(["a", "-a2", "b", "-b1", "-a1", "c"]);
    await expect.element(row("a1")).toHaveFocus();
    expect(rowEl("b").getAttribute("aria-expanded")).toBe("true");

    await down();
    await expect.poll(shape).toEqual(["a", "-a2", "b", "-b1", "a1", "c"]);
    await down();
    await expect.poll(shape).toEqual(["a", "-a2", "b", "-b1", "c", "a1"]);
    await expect.element(row("a1")).toHaveFocus();

    // And at the end there's nowhere further.
    await down();
    expect(shape()).toEqual(["a", "-a2", "b", "-b1", "c", "a1"]);
  });

  test("and up again the same way", async () => {
    await render(
      <Outline
        canDrop={(move) => move.position !== "inside" || move.target === "b"}
      />,
    );
    rowEl("c").focus();
    const up = () => userEvent.keyboard("{Alt>}{ArrowUp}{/Alt}");

    // b is closed, so the place above c is inside it.
    await up();
    await expect.poll(shape).toEqual(["a", "-a1", "-a2", "b", "-b1", "-c"]);
    await expect.element(row("c")).toHaveFocus();
    await up();
    await expect.poll(shape).toEqual(["a", "-a1", "-a2", "b", "-c", "-b1"]);
    await up();
    await expect.poll(shape).toEqual(["a", "-a1", "-a2", "c", "b", "-b1"]);
    await up();
    await expect.poll(shape).toEqual(["a", "-a1", "-a2", "-c", "b", "-b1"]);
    await expect.element(row("c")).toHaveFocus();
  });

  test("a row with nothing in it can be given a row, and opens", async () => {
    await render(<Outline />);
    rowEl("a1").focus();

    await userEvent.keyboard("{Alt>}{ArrowDown}{/Alt}");

    await expect.poll(shape).toEqual(["a", "-a2", "--a1", "b", "c"]);
    await expect.element(row("a1")).toHaveFocus();
  });

  test("a screen reader is told where the row went", async () => {
    await render(<Outline />);
    rowEl("a2").focus();

    await userEvent.keyboard("{Alt>}{ArrowUp}{/Alt}");
    await expect.poll(() => status()?.textContent).toBe("Moved a2 into a1");

    await userEvent.keyboard("{Alt>}{ArrowUp}{/Alt}");
    await expect.poll(() => status()?.textContent).toBe("Moved a2 before a1");
  });

  test("in words of yours, with getMoveText", async () => {
    await render(
      <Outline
        getMoveText={(move) =>
          `${move.values.join()} ${move.position} ${move.target}`
        }
      />,
    );
    rowEl("c").focus();

    await userEvent.keyboard("{Alt>}{ArrowUp}{/Alt}");

    await expect.poll(() => status()?.textContent).toBe("c inside b");
  });

  test("a disabled row doesn't move, and nothing goes inside one", async () => {
    const onMove = vi.fn();
    await render(<Files onMove={onMove} />);

    rowEl("notes.md").focus();
    await userEvent.keyboard("{Alt>}{ArrowDown}{/Alt}");
    expect(onMove).not.toHaveBeenCalled();

    // From the end, the place above is inside the disabled row. It's
    // passed by for the one above that.
    rowEl("README.md").focus();
    await userEvent.keyboard("{Alt>}{ArrowUp}{/Alt}");
    expect(onMove.mock.calls).toEqual([
      [{ values: ["readme"], target: "notes", position: "before" }],
    ]);
  });

  test("a selected row takes every selected row with it, but for those inside one that's going", async () => {
    const onMove = vi.fn();
    await render(
      <Files
        selectionMode="multiple"
        defaultValue={["src", "index", "readme"]}
        defaultExpanded={["src"]}
        onMove={onMove}
      />,
    );
    rowEl("README.md").focus();

    await userEvent.keyboard("{Alt>}{ArrowUp}{/Alt}");

    expect(onMove.mock.calls).toEqual([
      [{ values: ["src", "readme"], target: "notes", position: "before" }],
    ]);
  });

  test("a row that isn't selected goes by itself", async () => {
    const onMove = vi.fn();
    await render(
      <Files selectionMode="multiple" defaultValue={["src"]} onMove={onMove} />,
    );
    rowEl("README.md").focus();

    await userEvent.keyboard("{Alt>}{ArrowUp}{/Alt}");

    expect(onMove.mock.calls[0]?.[0].values).toEqual(["readme"]);
  });

  test("the arrow keys alone still only move focus", async () => {
    const onMove = vi.fn();
    await render(<Files onMove={onMove} />);
    rowEl("src").focus();

    await userEvent.keyboard("{ArrowDown}");

    expect(focused()).toBe("test");
    expect(onMove).not.toHaveBeenCalled();
  });
});

describe("dragging with a mouse", () => {
  test("the top of a row is before it", async () => {
    const onMove = vi.fn();
    await render(<Files onMove={onMove} />);

    drag("README.md", "test", 0.1);

    expect(onMove.mock.calls).toEqual([
      [{ values: ["readme"], target: "test", position: "before" }],
    ]);
  });

  test("the bottom is after it, and the middle inside it", async () => {
    const onMove = vi.fn();
    await render(<Files onMove={onMove} />);

    drag("README.md", "test", 0.9);
    drag("README.md", "test", 0.5);

    expect(onMove.mock.calls).toEqual([
      [{ values: ["readme"], target: "test", position: "after" }],
      [{ values: ["readme"], target: "test", position: "inside" }],
    ]);
  });

  test("under an open row is above the first row inside it", async () => {
    const onMove = vi.fn();
    await render(<Files defaultExpanded={["src"]} onMove={onMove} />);

    drag("README.md", "src", 0.9);

    expect(onMove.mock.calls).toEqual([
      [{ values: ["readme"], target: "components", position: "before" }],
    ]);
  });

  test("under the last row inside a row: in line with it stays inside, further out goes out", async () => {
    const onMove = vi.fn();
    await render(<Files defaultExpanded={["src"]} onMove={onMove} />);

    drag("README.md", "index.ts", 0.9);
    drag("README.md", "index.ts", 0.9, rect(rowBox("src")).left + 2);

    expect(onMove.mock.calls).toEqual([
      [{ values: ["readme"], target: "index", position: "after" }],
      [{ values: ["readme"], target: "src", position: "after" }],
    ]);
  });

  test("the same in a right-to-left page, where further out is to the right", async () => {
    const onMove = vi.fn();
    await render(
      <div dir="rtl">
        <Files defaultExpanded={["src"]} onMove={onMove} />
      </div>,
    );

    drag("README.md", "index.ts", 0.9, rect(rowBox("src")).right - 2);

    expect(onMove.mock.calls).toEqual([
      [{ values: ["readme"], target: "src", position: "after" }],
    ]);
  });

  test("the rows going and the place they'd go are marked while it lasts", async () => {
    await render(<Files defaultExpanded={["src"]} onMove={() => {}} />);

    const at = carry("src", "README.md", 0.1);

    // The row, and with it every row inside.
    expect(dragging()).toEqual(["src"]);
    expect(tree().element().hasAttribute("data-dragging")).toBe(true);
    expect(marked()).toEqual(["before readme"]);

    send("pointermove", pointOn("README.md", 0.5));
    expect(marked()).toEqual(["inside readme"]);

    send("pointerup", at);
    expect(dragging()).toEqual([]);
    expect(marked()).toEqual([]);
    expect(tree().element().hasAttribute("data-dragging")).toBe(false);
  });

  test("a place canDrop refuses isn't marked, and the next nearest is", async () => {
    const onMove = vi.fn();
    await render(
      <Files onMove={onMove} canDrop={(move) => move.position !== "inside"} />,
    );

    const at = carry("README.md", "test", 0.4);
    expect(marked()).toEqual(["before test"]);
    send("pointermove", pointOn("test", 0.6));
    expect(marked()).toEqual(["after test"]);
    send("pointerup", at);
  });

  test("where the row already is isn't a place, and neither is inside itself", async () => {
    const onMove = vi.fn();
    await render(<Files defaultExpanded={["src"]} onMove={onMove} />);

    // After the disabled row is where README.md is, and nothing goes
    // inside a disabled row.
    const at = carry("README.md", "notes.md", 0.9);
    expect(marked()).toEqual([]);
    send("pointerup", at);

    drag("src", "components", 0.5);

    expect(onMove).not.toHaveBeenCalled();
  });

  test("off the tree there's no place, and letting go there moves nothing", async () => {
    const onMove = vi.fn();
    await render(
      <div style={{ paddingBlockEnd: 200 }}>
        <Files onMove={onMove} />
      </div>,
    );

    carry("src", "README.md", 0.1);
    const away = {
      x: pointOn("README.md").x,
      y: rect(rowBox("README.md")).bottom + 120,
    };
    send("pointermove", away);
    expect(marked()).toEqual([]);
    send("pointerup", away);

    expect(onMove).not.toHaveBeenCalled();
    expect(dragging()).toEqual([]);
  });

  test("Escape puts the rows back, and nothing around the tree hears it", async () => {
    const onMove = vi.fn();
    const onKeyDown = vi.fn();
    await render(
      // biome-ignore lint/a11y/noStaticElementInteractions: it stands for a dialog that would close
      <div onKeyDown={onKeyDown}>
        <Files onMove={onMove} />
      </div>,
    );
    rowEl("README.md").focus();

    const at = carry("README.md", "test", 0.1);
    await userEvent.keyboard("{Escape}");

    expect(marked()).toEqual([]);
    expect(dragging()).toEqual([]);
    send("pointerup", at);
    expect(onMove).not.toHaveBeenCalled();
    expect(onKeyDown).not.toHaveBeenCalled();
  });

  test("a drag that's called off by the browser moves nothing", async () => {
    const onMove = vi.fn();
    await render(<Files onMove={onMove} />);

    const at = carry("README.md", "test", 0.1);
    send("pointercancel", at);

    expect(marked()).toEqual([]);
    expect(dragging()).toEqual([]);
    expect(onMove).not.toHaveBeenCalled();
  });

  test("a press that doesn't go anywhere is still a press", async () => {
    const onMove = vi.fn();
    await render(<Files selectionMode="single" onMove={onMove} />);

    await press("src");

    await expect.poll(shown).toContain("components");
    expect(selected()).toEqual(["src"]);
    expect(onMove).not.toHaveBeenCalled();
    expect(dragging()).toEqual([]);
  });

  test("letting go at the end of a drag isn't a press on the row under it", async () => {
    await render(<Files selectionMode="single" onMove={() => {}} />);

    const at = carry("README.md", "src", 0.1);
    send("pointerup", at);
    // The browser follows the release with a click when both ends of the
    // press were on the same thing.
    rowBox("src").click();

    expect(selected()).toEqual([]);
    expect(shown()).not.toContain("components");

    // A moment later a press is a press again.
    await press("src");
    await expect.poll(selected).toEqual(["src"]);
  });

  test("held over a closed row, a drag opens it", async () => {
    await render(<Files onMove={() => {}} />);

    const at = carry("README.md", "test", 0.5);

    expect(shown()).not.toContain("setup");
    await expect.poll(shown, { timeout: 3000 }).toContain("setup");
    send("pointerup", at);
  });

  test("a disabled row can't be picked up, and neither can a row with another button", async () => {
    await render(<Files onMove={() => {}} />);

    carry("notes.md", "test", 0.1);
    expect(dragging()).toEqual([]);

    const start = pointOn("README.md");
    rowBox("README.md").dispatchEvent(
      new PointerEvent("pointerdown", {
        bubbles: true,
        pointerId: 1,
        isPrimary: true,
        button: 2,
        clientX: start.x,
        clientY: start.y,
      }),
    );
    send("pointermove", pointOn("test", 0.1));
    expect(dragging()).toEqual([]);
    send("pointerup", pointOn("test", 0.1));
  });

  test("a press you handle yourself doesn't start a drag", async () => {
    await render(
      <Files
        onMove={() => {}}
        onPointerDown={(event) => event.preventDefault()}
      />,
    );

    const at = carry("README.md", "test", 0.1);

    expect(dragging()).toEqual([]);
    send("pointerup", at);
  });

  test("a selected row takes every selected row with it", async () => {
    const onMove = vi.fn();
    await render(
      <Files
        selectionMode="multiple"
        defaultValue={["src", "index", "readme"]}
        defaultExpanded={["src"]}
        onMove={onMove}
      />,
    );

    const at = carry("README.md", "test", 0.1);
    expect(dragging()).toEqual(["src", "readme"]);
    send("pointerup", at);

    expect(onMove.mock.calls).toEqual([
      [{ values: ["src", "readme"], target: "test", position: "before" }],
    ]);
  });

  test("the rows move, and the row that was dragged has focus after", async () => {
    await render(<Outline />);

    drag("c", "a2", 0.1);

    await expect.poll(shape).toEqual(["a", "-a1", "-c", "-a2", "b"]);
    await expect.element(row("c")).toHaveFocus();
    await expect.poll(() => status()?.textContent).toBe("Moved c before a2");
  });

  test("a tree taken away in the middle of a drag leaves nothing behind", async () => {
    const onMove = vi.fn();
    const screen = await render(<Files onMove={onMove} />);

    const at = carry("README.md", "test", 0.1);
    await screen.unmount();
    send("pointermove", at);
    send("pointerup", at);

    expect(onMove).not.toHaveBeenCalled();
  });
});

describe("dragging with a finger", () => {
  // What stops the page scrolling under a drag: whether the tree refused a
  // touch that moved.
  const refused = () => {
    const event = new Event("touchmove", { bubbles: true, cancelable: true });
    rowEl("README.md").dispatchEvent(event);
    return event.defaultPrevented;
  };

  test("held for a moment, a row is picked up, and the page stops scrolling under it", async () => {
    const onMove = vi.fn();
    await render(<Files onMove={onMove} />);

    send("pointerdown", pointOn("README.md"), "touch");
    expect(dragging()).toEqual([]);
    expect(refused()).toBe(false);

    await expect.poll(dragging, { timeout: 3000 }).toEqual(["readme"]);
    expect(refused()).toBe(true);

    send("pointermove", pointOn("test", 0.1), "touch");
    expect(marked()).toEqual(["before test"]);
    send("pointerup", pointOn("test", 0.1), "touch");

    expect(onMove.mock.calls).toEqual([
      [{ values: ["readme"], target: "test", position: "before" }],
    ]);
    expect(refused()).toBe(false);
  });

  test("a finger that moves first is scrolling, and picks nothing up", async () => {
    const onMove = vi.fn();
    await render(<Files onMove={onMove} />);
    const start = pointOn("README.md");

    send("pointerdown", start, "touch");
    send("pointermove", { x: start.x, y: start.y - 20 }, "touch");
    await new Promise((resolve) => setTimeout(resolve, 600));

    expect(dragging()).toEqual([]);
    expect(refused()).toBe(false);
    send("pointerup", pointOn("test", 0.1), "touch");
    expect(onMove).not.toHaveBeenCalled();
  });

  test("a finger held down isn't asking for a menu, and a mouse still can", async () => {
    await render(<Files onMove={() => {}} />);
    const menu = () => {
      const event = new MouseEvent("contextmenu", {
        bubbles: true,
        cancelable: true,
      });
      rowBox("README.md").dispatchEvent(event);
      return event.defaultPrevented;
    };

    expect(menu()).toBe(false);
    send("pointerdown", pointOn("README.md"), "touch");
    expect(menu()).toBe(true);
    send("pointerup", pointOn("README.md"), "touch");
    expect(menu()).toBe(false);
  });

  test("without onMove the tree refuses no touch", async () => {
    await render(<Files />);

    send("pointerdown", pointOn("README.md"), "touch");
    await new Promise((resolve) => setTimeout(resolve, 600));

    expect(dragging()).toEqual([]);
    expect(refused()).toBe(false);
    send("pointerup", pointOn("README.md"), "touch");
  });
});

describe("layout", () => {
  test("where dragged rows would go is a line before or after a row, and a ring round one", async () => {
    await render(<Files onMove={() => {}} />);
    const item = rowEl("test");
    const line = (which: "::before" | "::after") => {
      const drawn = getComputedStyle(item, which);
      return `${drawn.borderTopWidth} ${drawn.borderTopStyle} ${drawn.position}`;
    };

    expect(getComputedStyle(item, "::before").content).toBe("none");

    item.dataset.drop = "before";
    expect(line("::before")).toBe("2px solid absolute");
    expect(getComputedStyle(item, "::after").content).toBe("none");
    // In the space between this row and the one above.
    expect(
      Number.parseFloat(getComputedStyle(item, "::before").top),
    ).toBeLessThan(0);

    item.dataset.drop = "after";
    expect(line("::after")).toBe("2px solid absolute");
    expect(
      Number.parseFloat(getComputedStyle(item, "::after").bottom),
    ).toBeLessThan(0);

    item.dataset.drop = "inside";
    expect(getComputedStyle(item, "::after").content).toBe("none");
    expect(style(rowBox("test")).outlineStyle).toBe("solid");
    expect(style(rowBox("test")).outlineWidth).toBe("2px");
  });

  test("the line starts where its row starts, so it says how deep the rows would be", async () => {
    await render(<Files defaultExpanded={["src"]} onMove={() => {}} />);

    expect(rect(rowEl("components")).left).toBe(
      rect(rowBox("components")).left,
    );
    expect(rect(rowEl("components")).left).toBeGreaterThan(
      rect(rowEl("src")).left,
    );
    expect(style(rowEl("components")).position).toBe("relative");
  });

  test("a row being dragged is faded, and the pointer says it's held", async () => {
    await setViewport("desktop");
    await render(<Files onMove={() => {}} />);

    const at = carry("README.md", "test", 0.1);

    expect(Number(style(rowEl("README.md")).opacity)).toBeLessThan(1);
    expect(style(rowEl("test")).opacity).toBe("1");
    expect(style(rowBox("test")).cursor).toBe("grabbing");
    send("pointerup", at);
    expect(style(rowEl("README.md")).opacity).toBe("1");
    expect(style(rowBox("test")).cursor).toBe("default");
  });

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

  test("the marks of a drag can be changed", async () => {
    await render(
      <div
        style={
          {
            "--nuv-tree-drop-line": "rgb(1, 2, 3)",
            "--nuv-tree-drop-line-width": "4px",
            "--nuv-tree-dragging-opacity": "0.25",
          } as never
        }
      >
        <Files onMove={() => {}} />
      </div>,
    );
    const item = rowEl("test");

    item.dataset.drop = "before";
    expect(getComputedStyle(item, "::before").borderTopColor).toBe(
      "rgb(1, 2, 3)",
    );
    expect(getComputedStyle(item, "::before").borderTopWidth).toBe("4px");
    item.dataset.drop = "inside";
    expect(style(rowBox("test")).outlineColor).toBe("rgb(1, 2, 3)");
    expect(style(rowBox("test")).outlineWidth).toBe("4px");
    item.dataset.dragging = "";
    expect(style(item).opacity).toBe("0.25");
  });

  test.each(themes)(
    "the line where rows would go can be seen in %s",
    async (theme) => {
      const screen = await renderThemed(theme, <Files onMove={() => {}} />);
      const ground = style(
        screen.container.querySelector("main") as Element,
      ).backgroundColor;
      const item = rowEl("test");

      item.dataset.drop = "before";
      expect(
        contrast(getComputedStyle(item, "::before").borderTopColor, ground),
      ).toBeGreaterThanOrEqual(3);
      item.dataset.drop = "inside";
      expect(
        contrast(style(rowBox("test")).outlineColor, ground),
      ).toBeGreaterThanOrEqual(3);
    },
  );

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

  test("passes axe with rows that can be moved, and after one has been", async () => {
    const screen = await renderThemed(theme, <Outline />);
    rowEl("a2").focus();
    await userEvent.keyboard("{Alt>}{ArrowUp}{/Alt}");
    await expect.poll(() => status()?.textContent).toBe("Moved a2 into a1");

    await expectNoViolations(screen.container);
  });
});
