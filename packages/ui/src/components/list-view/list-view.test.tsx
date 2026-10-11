import "../../styles/index.scss";
import { contrast } from "@nuvui/tooling/test/contrast";
import { setViewport } from "@nuvui/tooling/test/media";
import {
  expectNoViolations,
  renderThemed,
  themes,
} from "@nuvui/tooling/test/themed";
import {
  Component,
  createRef,
  type ReactNode,
  useEffect,
  useState,
} from "react";
import { describe, expect, test, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { Button } from "../button";
import { ListView, ListViewItem, type ListViewProps } from "./list-view";

// Four requests. The first two have buttons, the third can't be used, and
// the last is text alone.
function Requests(props: Partial<ListViewProps>) {
  return (
    <ListView aria-label="Requests" {...props}>
      <ListViewItem value="ada">
        <span>Ada Lovelace</span>
        <button type="button">Approve Ada</button>
        <button type="button">Decline Ada</button>
      </ListViewItem>
      <ListViewItem value="bo">
        <span>Bo Jensen</span>
        <button type="button">Approve Bo</button>
      </ListViewItem>
      <ListViewItem value="cleo" disabled>
        <span>Cleo Park</span>
      </ListViewItem>
      <ListViewItem value="dan">
        <span>Dan Abbott</span>
      </ListViewItem>
    </ListView>
  );
}

const list = () => page.getByRole("grid", { name: "Requests" });
const row = (value: string) =>
  list().element().querySelector(`[data-value="${value}"]`) as HTMLElement;
const button = (name: string) =>
  page.getByRole("button", { name, exact: true }).element() as HTMLElement;
// The row's own text, away from any button in it.
const press = (value: string, options?: { shift?: boolean }) =>
  userEvent.click(
    row(value).querySelector("span") as Element,
    options?.shift ? { modifiers: ["Shift"] } : undefined,
  );
const selected = () =>
  Array.from(
    list().element().querySelectorAll<HTMLElement>('[aria-selected="true"]'),
  ).map((item) => item.dataset.value);
// The row focus is on, or the text of the button it's on.
const focused = () => {
  const element = document.activeElement as HTMLElement;
  return element.dataset.value ?? element.textContent;
};
const stops = () =>
  Array.from(list().element().querySelectorAll<HTMLElement>('[role="row"]'))
    .filter((item) => item.tabIndex === 0)
    .map((item) => item.dataset.value);
const style = (element: Element) => getComputedStyle(element);
const rect = (element: Element) => element.getBoundingClientRect();

describe("rendering", () => {
  test("is a grid of rows, each with one cell that holds what you gave it", async () => {
    await render(<Requests />);

    await expect.element(list()).toBeVisible();
    const rows = list().element().querySelectorAll(':scope > [role="row"]');
    expect(rows).toHaveLength(4);
    const cells = row("ada").querySelectorAll(':scope > [role="gridcell"]');
    expect(cells).toHaveLength(1);
    expect(cells[0]?.contains(button("Approve Ada"))).toBe(true);
  });

  test("without selection no row says whether it's selected", async () => {
    await render(<Requests />);

    expect(row("ada").hasAttribute("aria-selected")).toBe(false);
    expect(list().element().hasAttribute("aria-multiselectable")).toBe(false);
  });

  test("with selection every row says, and a list for several says so", async () => {
    await render(<Requests selectionMode="multiple" defaultValue={["dan"]} />);

    expect(row("ada").getAttribute("aria-selected")).toBe("false");
    expect(row("dan").getAttribute("aria-selected")).toBe("true");
    expect(list().element().getAttribute("aria-multiselectable")).toBe("true");
  });

  test("a disabled row says so", async () => {
    await render(<Requests />);

    expect(row("cleo").getAttribute("aria-disabled")).toBe("true");
    expect(row("dan").hasAttribute("aria-disabled")).toBe(false);
  });

  test("forwards refs, class names and other props, on the list and on a row", async () => {
    const listRef = createRef<HTMLDivElement>();
    const itemRef = createRef<HTMLDivElement>();
    await render(
      <ListView ref={listRef} aria-label="One" className="mine" data-kind="a">
        <ListViewItem ref={itemRef} value="one" className="row" data-kind="b">
          One
        </ListViewItem>
      </ListView>,
    );

    expect(listRef.current?.className).toBe("nuv-list-view mine");
    expect(listRef.current?.dataset.kind).toBe("a");
    expect(itemRef.current?.className).toBe("nuv-list-view__item row");
    expect(itemRef.current?.dataset.kind).toBe("b");
  });

  test("a row outside a list says what's wrong", async () => {
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
        <ListViewItem value="one">One</ListViewItem>
      </Boundary>,
    );

    await expect
      .poll(() => page.getByRole("alert").element().textContent)
      .toBe("ListViewItem has to be inside a ListView.");
    quiet.mockRestore();
  });
});

describe("Tab", () => {
  test("stops at one row: the first, until focus has been somewhere else", async () => {
    await render(<Requests />);

    await expect.poll(stops).toEqual(["ada"]);

    await userEvent.tab();
    expect(focused()).toBe("ada");
    await userEvent.keyboard("{ArrowDown}");
    expect(focused()).toBe("bo");
    await expect.poll(stops).toEqual(["bo"]);
  });

  test("goes from a row to its buttons, and then out of the list", async () => {
    await render(
      <>
        <button type="button">Before</button>
        <Requests />
        <button type="button">After</button>
      </>,
    );
    button("Before").focus();

    await userEvent.tab();
    expect(focused()).toBe("ada");
    await userEvent.tab();
    expect(focused()).toBe("Approve Ada");
    await userEvent.tab();
    expect(focused()).toBe("Decline Ada");
    // Not to Bo's button, which is in a row Tab isn't at.
    await userEvent.tab();
    expect(focused()).toBe("After");
  });

  test("with Shift goes back through the row's buttons to the row, and then out", async () => {
    await render(
      <>
        <button type="button">Before</button>
        <Requests />
        <button type="button">After</button>
      </>,
    );
    row("bo").focus();
    await expect.poll(stops).toEqual(["bo"]);
    button("After").focus();

    await userEvent.tab({ shift: true });
    expect(focused()).toBe("Approve Bo");
    await userEvent.tab({ shift: true });
    expect(focused()).toBe("bo");
    // Not to Ada's buttons, which come before it in the page.
    await userEvent.tab({ shift: true });
    expect(focused()).toBe("Before");
  });

  test("only the buttons of the row it's at are in its order", async () => {
    await render(<Requests />);

    await expect.poll(() => button("Approve Bo").tabIndex).toBe(-1);
    expect(button("Approve Ada").tabIndex).toBe(0);

    row("bo").focus();

    await expect.poll(() => button("Approve Bo").tabIndex).toBe(0);
    expect(button("Approve Ada").tabIndex).toBe(-1);
    expect(button("Decline Ada").tabIndex).toBe(-1);
    // Given back as it was: a button has no tabindex of its own.
    expect(button("Approve Bo").hasAttribute("tabindex")).toBe(false);
  });

  test("a press on a button in another row makes that the row Tab is at", async () => {
    await render(<Requests />);
    await expect.poll(() => button("Approve Bo").tabIndex).toBe(-1);

    await userEvent.click(button("Approve Bo"));

    await expect.poll(stops).toEqual(["bo"]);
    expect(button("Approve Bo").tabIndex).toBe(0);
  });

  test("a tabindex you set yourself is given back, and one that kept Tab away stays", async () => {
    await render(
      <ListView aria-label="Requests">
        <ListViewItem value="one">One</ListViewItem>
        <ListViewItem value="two">
          {/* biome-ignore lint/a11y/noNoninteractiveTabindex: what's tested is a tabindex of the page's own */}
          <span tabIndex={0} data-testid="mine">
            Two
          </span>
          <button type="button" tabIndex={-1}>
            Never
          </button>
        </ListViewItem>
      </ListView>,
    );
    const mine = page.getByTestId("mine").element() as HTMLElement;
    await expect.poll(() => mine.tabIndex).toBe(-1);

    row("two").focus();

    await expect.poll(() => mine.getAttribute("tabindex")).toBe("0");
    expect(button("Never").tabIndex).toBe(-1);
  });

  test("a button a row draws later is taken out of the order too", async () => {
    // Drawn from the button's own state, so the list isn't drawn again
    // and has to notice by itself.
    let show = () => {};
    function LateButton() {
      const [shown, setShown] = useState(false);
      useEffect(() => {
        show = () => setShown(true);
      }, []);
      return shown ? <button type="button">Late</button> : null;
    }
    await render(
      <ListView aria-label="Requests">
        <ListViewItem value="one">One</ListViewItem>
        <ListViewItem value="two">
          Two
          <LateButton />
        </ListViewItem>
      </ListView>,
    );
    await expect.poll(stops).toEqual(["one"]);

    show();

    await expect.poll(() => button("Late").tabIndex).toBe(-1);
  });

  test("goes to the first row when the row it was at is taken away", async () => {
    function Removable() {
      const [gone, setGone] = useState(false);
      return (
        <>
          <button type="button" onClick={() => setGone(true)}>
            Remove
          </button>
          <ListView aria-label="Requests">
            <ListViewItem value="one">One</ListViewItem>
            {gone ? null : <ListViewItem value="two">Two</ListViewItem>}
          </ListView>
        </>
      );
    }
    await render(<Removable />);
    row("two").focus();
    await expect.poll(stops).toEqual(["two"]);

    await userEvent.click(button("Remove"));

    await expect.poll(stops).toEqual(["one"]);
  });
});

describe("the arrow keys", () => {
  test("Down and Up move between rows, and stop at the ends", async () => {
    await render(<Requests />);
    row("ada").focus();

    await userEvent.keyboard("{ArrowUp}");
    expect(focused()).toBe("ada");
    await userEvent.keyboard("{ArrowDown}");
    expect(focused()).toBe("bo");
    await userEvent.keyboard("{ArrowDown}{ArrowDown}{ArrowDown}");
    expect(focused()).toBe("dan");
  });

  test("they stop at a disabled row, so it can be read", async () => {
    await render(<Requests />);
    row("bo").focus();

    await userEvent.keyboard("{ArrowDown}");

    expect(focused()).toBe("cleo");
  });

  test("Home and End go to the first and the last row", async () => {
    await render(<Requests />);
    row("bo").focus();

    await userEvent.keyboard("{End}");
    expect(focused()).toBe("dan");
    await userEvent.keyboard("{Home}");
    expect(focused()).toBe("ada");
  });

  test("a key pressed on a button or in a field inside a row is that control's", async () => {
    await render(
      <ListView aria-label="Requests">
        <ListViewItem value="one">
          <input aria-label="Note" />
        </ListViewItem>
        <ListViewItem value="two">Two</ListViewItem>
      </ListView>,
    );
    const field = page.getByRole("textbox", { name: "Note" });
    (field.element() as HTMLElement).focus();

    await userEvent.keyboard("t{ArrowDown}{Home}");

    expect(document.activeElement).toBe(field.element());
    await expect.element(field).toHaveValue("t");
  });

  test("a key the list has no use for is left alone", async () => {
    const onKeyDown = vi.fn();
    await render(
      // biome-ignore lint/a11y/noStaticElementInteractions: it listens for what the list let through
      <div onKeyDown={(event) => onKeyDown(event.key, event.defaultPrevented)}>
        <Requests />
      </div>,
    );
    row("ada").focus();

    await userEvent.keyboard("{ArrowDown}{F2}");

    expect(onKeyDown.mock.calls).toEqual([
      ["ArrowDown", true],
      ["F2", false],
    ]);
  });

  test("a key you handle yourself is left to you", async () => {
    await render(<Requests onKeyDown={(event) => event.preventDefault()} />);
    row("ada").focus();

    await userEvent.keyboard("{ArrowDown}");

    expect(focused()).toBe("ada");
  });
});

describe("typing", () => {
  test("a letter goes to the next row that starts with it, and round again", async () => {
    await render(
      <ListView aria-label="Requests">
        <ListViewItem value="ada">Ada</ListViewItem>
        <ListViewItem value="bo">Bo</ListViewItem>
        <ListViewItem value="bea">Bea</ListViewItem>
      </ListView>,
    );
    row("ada").focus();

    await userEvent.keyboard("b");
    expect(focused()).toBe("bo");
    // The same letter again, straight away, goes on to the next.
    await userEvent.keyboard("b");
    expect(focused()).toBe("bea");
    await userEvent.keyboard("b");
    expect(focused()).toBe("bo");
  });

  test("letters typed quickly make a word", async () => {
    await render(
      <ListView aria-label="Requests">
        <ListViewItem value="ada">Ada</ListViewItem>
        <ListViewItem value="bo">Bo</ListViewItem>
        <ListViewItem value="bea">Bea</ListViewItem>
      </ListView>,
    );
    row("ada").focus();

    await userEvent.keyboard("be");

    expect(focused()).toBe("bea");
  });

  test("it goes by textValue when a row has one", async () => {
    await render(
      <ListView aria-label="Requests">
        <ListViewItem value="one">One</ListViewItem>
        <ListViewItem value="invoice" textValue="Invoice">
          12 Invoice
        </ListViewItem>
      </ListView>,
    );
    row("one").focus();

    await userEvent.keyboard("i");

    expect(focused()).toBe("invoice");
  });
});

describe("acting on a row", () => {
  test("Enter calls onAction with the row's value", async () => {
    const onAction = vi.fn();
    await render(<Requests onAction={onAction} />);
    row("bo").focus();

    await userEvent.keyboard("{Enter}");

    expect(onAction.mock.calls).toEqual([["bo"]]);
  });

  test("where rows can't be selected, a press and Space call it too", async () => {
    const onAction = vi.fn();
    await render(<Requests onAction={onAction} />);

    await press("dan");
    await userEvent.keyboard(" ");

    expect(onAction.mock.calls).toEqual([["dan"], ["dan"]]);
  });

  test("a press on a button inside a row is the button's, and not the row's", async () => {
    const onAction = vi.fn();
    const onValueChange = vi.fn();
    await render(<Requests onAction={onAction} />);
    await userEvent.click(button("Approve Ada"));
    expect(onAction).not.toHaveBeenCalled();

    await render(
      <ListView
        aria-label="Others"
        selectionMode="single"
        onValueChange={onValueChange}
      >
        <ListViewItem value="one">
          <button type="button">Open one</button>
        </ListViewItem>
      </ListView>,
    );
    await userEvent.click(button("Open one"));
    expect(onValueChange).not.toHaveBeenCalled();
  });

  test("a disabled row isn't acted on", async () => {
    const onAction = vi.fn();
    await render(<Requests onAction={onAction} />);

    await press("cleo");
    await userEvent.keyboard("{Enter}");

    expect(focused()).toBe("cleo");
    expect(onAction).not.toHaveBeenCalled();
  });

  test("where rows can be selected, a press selects and Enter acts", async () => {
    const onAction = vi.fn();
    await render(<Requests selectionMode="single" onAction={onAction} />);

    await press("dan");
    await expect.poll(selected).toEqual(["dan"]);
    expect(onAction).not.toHaveBeenCalled();

    await userEvent.keyboard("{Enter}");
    expect(onAction.mock.calls).toEqual([["dan"]]);
  });

  test("with nothing to call, Enter selects", async () => {
    await render(<Requests selectionMode="single" />);
    row("bo").focus();

    await userEvent.keyboard("{Enter}");

    await expect.poll(selected).toEqual(["bo"]);
  });
});

describe("selecting one", () => {
  test("a press selects the row, and the one before it lets go", async () => {
    const onValueChange = vi.fn();
    await render(
      <Requests selectionMode="single" onValueChange={onValueChange} />,
    );

    await press("ada");
    await expect.poll(selected).toEqual(["ada"]);
    await press("dan");
    await expect.poll(selected).toEqual(["dan"]);

    expect(onValueChange.mock.calls).toEqual([[["ada"]], [["dan"]]]);
    expect(focused()).toBe("dan");
  });

  test("Space selects the row focus is on", async () => {
    await render(<Requests selectionMode="single" />);
    row("bo").focus();

    await userEvent.keyboard(" ");

    await expect.poll(selected).toEqual(["bo"]);
  });

  test("moving with the arrow keys selects nothing", async () => {
    await render(<Requests selectionMode="single" defaultValue={["ada"]} />);
    row("ada").focus();

    await userEvent.keyboard("{ArrowDown}{ArrowDown}");

    expect(selected()).toEqual(["ada"]);
  });

  test("a disabled row can't be selected", async () => {
    await render(<Requests selectionMode="single" />);

    await press("cleo");
    await userEvent.keyboard(" ");

    expect(selected()).toEqual([]);
  });

  test("you can keep what's selected yourself", async () => {
    function Kept() {
      const [value, setValue] = useState(["ada"]);
      return (
        <>
          <button type="button" onClick={() => setValue(["dan"])}>
            Pick Dan
          </button>
          <Requests
            selectionMode="single"
            value={value}
            // Bo can't be chosen.
            onValueChange={(next) => {
              if (!next.includes("bo")) setValue(next);
            }}
          />
        </>
      );
    }
    await render(<Kept />);

    await press("bo");
    expect(selected()).toEqual(["ada"]);
    await userEvent.click(button("Pick Dan"));
    await expect.poll(selected).toEqual(["dan"]);
  });
});

describe("selecting several", () => {
  test("a press adds a row, and a press on a selected row takes it out", async () => {
    await render(<Requests selectionMode="multiple" />);

    await press("ada");
    await press("dan");
    await expect.poll(selected).toEqual(["ada", "dan"]);

    await press("ada");
    await expect.poll(selected).toEqual(["dan"]);
  });

  test("Shift and a press selects every row from the last one pressed, but for disabled ones", async () => {
    await render(<Requests selectionMode="multiple" />);

    await press("ada");
    await press("dan", { shift: true });

    await expect.poll(selected).toEqual(["ada", "bo", "dan"]);
  });

  test("Shift and an arrow selects the row it arrives at", async () => {
    await render(<Requests selectionMode="multiple" />);
    row("ada").focus();

    await userEvent.keyboard("{Shift>}{ArrowDown}{/Shift}");

    await expect.poll(selected).toEqual(["bo"]);
    expect(focused()).toBe("bo");
  });

  test("Ctrl and A selects every row that can be", async () => {
    await render(<Requests selectionMode="multiple" />);
    row("ada").focus();

    await userEvent.keyboard("{Control>}a{/Control}");

    await expect.poll(selected).toEqual(["ada", "bo", "dan"]);
  });

  test("Ctrl and A is the browser's when rows can't be selected, or only one can", async () => {
    const onKeyDown = vi.fn();
    await render(
      // biome-ignore lint/a11y/noStaticElementInteractions: it listens for what the list let through
      <div onKeyDown={(event) => onKeyDown(event.defaultPrevented)}>
        <Requests selectionMode="single" />
      </div>,
    );
    row("ada").focus();

    await userEvent.keyboard("{Control>}a{/Control}");

    expect(onKeyDown.mock.calls.at(-1)).toEqual([false]);
    expect(selected()).toEqual([]);
  });
});

describe("layout", () => {
  test("a row is at least 44px tall, as wide as the list, and taller when what's in it is", async () => {
    await setViewport("desktop");
    await render(
      <div style={{ width: 320 }}>
        <ListView aria-label="Requests">
          <ListViewItem value="short">Short</ListViewItem>
          <ListViewItem value="tall">
            <div style={{ height: 80 }}>Tall</div>
          </ListViewItem>
        </ListView>
      </div>,
    );

    expect(rect(row("short")).height).toBe(44);
    expect(rect(row("short")).width).toBe(320);
    expect(rect(row("tall")).height).toBeGreaterThan(80);
  });

  test("what's in a row is side by side, centered on one line", async () => {
    await render(<Requests />);
    const name = rect(row("ada").querySelector("span") as Element);
    const first = rect(button("Approve Ada"));
    const second = rect(button("Decline Ada"));

    expect(first.left).toBeGreaterThan(name.right);
    expect(second.left).toBeGreaterThan(first.right);
    expect(
      Math.abs(name.top + name.height / 2 - (first.top + first.height / 2)),
    ).toBeLessThan(1);
  });

  test("there's a line between rows, and none above the first", async () => {
    await render(<Requests />);

    expect(style(row("ada")).borderTopStyle).toBe("none");
    expect(style(row("bo")).borderTopStyle).toBe("solid");
    expect(style(row("bo")).borderTopWidth).toBe("1px");
  });

  test("a selected row has a background and a bar at its start", async () => {
    await render(<Requests selectionMode="single" defaultValue={["dan"]} />);
    const bar = getComputedStyle(row("dan"), "::before");

    expect(style(row("dan")).backgroundColor).not.toBe("rgba(0, 0, 0, 0)");
    expect(style(row("ada")).backgroundColor).toBe("rgba(0, 0, 0, 0)");
    expect(bar.borderInlineStartWidth).toBe("2px");
    expect(bar.borderInlineStartStyle).toBe("solid");
    expect(
      contrast(bar.borderInlineStartColor, style(row("dan")).backgroundColor),
    ).toBeGreaterThanOrEqual(3);
    expect(getComputedStyle(row("ada"), "::before").content).toBe("none");
  });

  test("a secondary button in a selected row isn't the row's color", async () => {
    await render(
      <>
        <Button intent="secondary">Outside</Button>
        <ListView
          aria-label="Requests"
          selectionMode="single"
          defaultValue={["one"]}
        >
          <ListViewItem value="one">
            One
            <Button intent="secondary">Inside</Button>
            <Button>Primary</Button>
          </ListViewItem>
        </ListView>
      </>,
    );
    const item = style(row("one")).backgroundColor;

    // Outside a list it is that color, which is why it's changed in one.
    expect(style(button("Outside")).backgroundColor).toBe(item);
    expect(style(button("Inside")).backgroundColor).not.toBe(item);
    // Other buttons keep their own.
    expect(style(button("Primary")).backgroundColor).not.toBe(
      style(button("Inside")).backgroundColor,
    );
  });

  test("the focus ring is on the row, inside its edges", async () => {
    await render(<Requests />);

    await userEvent.tab();

    expect(focused()).toBe("ada");
    expect(style(row("ada")).outlineStyle).toBe("solid");
    expect(style(row("ada")).outlineWidth).toBe("2px");
    expect(style(row("ada")).outlineOffset).toBe("-2px");
    expect(style(row("bo")).outlineStyle).toBe("none");
  });

  test("a disabled row is faded", async () => {
    await render(<Requests />);

    expect(Number(style(row("cleo")).opacity)).toBeLessThan(1);
    expect(style(row("dan")).opacity).toBe("1");
  });
});

describe("theming", () => {
  test("its variables change its look", async () => {
    await render(
      <div
        style={
          {
            "--nuv-list-view-row-height": "60px",
            "--nuv-list-view-padding-block": "5px",
            "--nuv-list-view-padding-inline": "7px",
            "--nuv-list-view-radius": "3px",
            "--nuv-list-view-gap": "9px",
            "--nuv-list-view-fg": "rgb(10, 20, 30)",
            "--nuv-list-view-divider": "rgb(40, 50, 60)",
            "--nuv-list-view-selected-bg": "rgb(200, 210, 220)",
            "--nuv-list-view-selected-line": "rgb(1, 2, 3)",
            "--nuv-list-view-selected-line-width": "4px",
            "--nuv-list-view-button-bg": "rgb(11, 12, 13)",
          } as never
        }
      >
        <Requests selectionMode="single" defaultValue={["dan"]} />
      </div>,
    );
    const item = style(row("dan"));
    const bar = getComputedStyle(row("dan"), "::before");
    const cell = row("dan").querySelector(".nuv-list-view__cell") as Element;

    expect(rect(row("dan")).height).toBe(60);
    expect(item.paddingTop).toBe("5px");
    expect(item.paddingLeft).toBe("7px");
    expect(item.borderTopLeftRadius).toBe("3px");
    expect(item.color).toBe("rgb(10, 20, 30)");
    expect(item.borderTopColor).toBe("rgb(40, 50, 60)");
    expect(item.backgroundColor).toBe("rgb(200, 210, 220)");
    expect(bar.borderInlineStartColor).toBe("rgb(1, 2, 3)");
    expect(bar.borderInlineStartWidth).toBe("4px");
    expect(style(cell).columnGap).toBe("9px");
  });

  test("a hover color of your own is used, and not on a disabled row", async () => {
    await setViewport("desktop");
    await render(
      <div style={{ "--nuv-list-view-hover-bg": "rgb(9, 8, 7)" } as never}>
        <Requests />
      </div>,
    );

    await userEvent.hover(row("dan").querySelector("span") as Element);
    await expect
      .poll(() => style(row("dan")).backgroundColor)
      .toBe("rgb(9, 8, 7)");

    await userEvent.hover(row("cleo").querySelector("span") as Element);
    await expect
      .poll(() => style(row("cleo")).backgroundColor)
      .toBe("rgba(0, 0, 0, 0)");
  });

  test.each(themes)(
    "a selected row's text and bar can be read in %s",
    async (theme) => {
      await renderThemed(
        theme,
        <Requests selectionMode="single" defaultValue={["dan"]} />,
      );
      const item = style(row("dan"));
      const bar = getComputedStyle(row("dan"), "::before");

      expect(contrast(item.color, item.backgroundColor)).toBeGreaterThanOrEqual(
        4.5,
      );
      expect(
        contrast(bar.borderInlineStartColor, item.backgroundColor),
      ).toBeGreaterThanOrEqual(3);
    },
  );
});

describe.each(themes)("accessibility in %s", (theme) => {
  test("passes axe with rows selected, disabled and with buttons in them", async () => {
    const screen = await renderThemed(
      theme,
      <>
        <Requests />
        <ListView
          aria-label="Invoices"
          selectionMode="multiple"
          defaultValue={["one"]}
        >
          <ListViewItem value="one">
            <span>INV-2041</span>
            <button type="button">Open INV-2041</button>
          </ListViewItem>
          <ListViewItem value="two">
            <span>INV-2042</span>
          </ListViewItem>
        </ListView>
      </>,
    );

    await expectNoViolations(screen.container);
  });
});
