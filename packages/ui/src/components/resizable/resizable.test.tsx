import "../../styles/index.scss";
import { contrast } from "@nuvui/tooling/test/contrast";
import {
  expectNoViolations,
  renderThemed,
  themes,
} from "@nuvui/tooling/test/themed";
import { createRef, useState } from "react";
import { afterEach, describe, expect, test, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import type { ResizablePanelRef } from "./index";
import {
  Resizable,
  ResizableHandle,
  type ResizableHandleProps,
  ResizablePanel,
  type ResizablePanelProps,
  type ResizableProps,
  type ResizableStorage,
  useResizableLayout,
} from "./resizable";

// Two panels in a box 400 by 200, the first at 40 in 100. Each can go
// down to 20.
function Panes({
  handle,
  first,
  ...props
}: Partial<ResizableProps> & {
  handle?: Partial<ResizableHandleProps>;
  first?: Partial<ResizablePanelProps>;
}) {
  return (
    <div data-testid="box" style={{ width: 400, height: 200 }}>
      <Resizable {...props}>
        <ResizablePanel id="one" defaultSize="40%" minSize="20%" {...first}>
          {first?.children ?? "One"}
        </ResizablePanel>
        <ResizableHandle aria-label="Resize one" {...handle} />
        <ResizablePanel id="two" minSize="20%">
          Two
        </ResizablePanel>
      </Resizable>
    </div>
  );
}

const handle = () => page.getByRole("separator");
const handleEl = () => handle().element() as HTMLElement;
// The size of the panel before the handle, from 0 to 100, as it says it.
const size = () => Number(handleEl().getAttribute("aria-valuenow"));
const group = () => document.querySelector(".nuv-resizable") as HTMLElement;
// A panel is two boxes: the one that's sized, and the one round its content.
const outer = (id: string) => document.getElementById(id) as HTMLElement;
const inner = (id: string) => outer(id).firstElementChild as HTMLElement;
const style = (element: Element) => getComputedStyle(element);
const rect = (element: Element) => element.getBoundingClientRect();

afterEach(() => {
  localStorage.clear();
});

describe("rendering", () => {
  test("is two panels with a separator between them that says the first one's size", async () => {
    await render(<Panes />);

    await expect.element(handle()).toHaveAccessibleName("Resize one");
    await expect.poll(size).toBe(40);
    expect(handleEl().getAttribute("aria-valuemin")).toBe("20");
    expect(handleEl().getAttribute("aria-valuemax")).toBe("80");
    expect(handleEl().getAttribute("aria-controls")).toBe("one");
    expect(handleEl().tabIndex).toBe(0);
    // Between panels side by side, the line itself stands up.
    expect(handleEl().getAttribute("aria-orientation")).toBe("vertical");
    expect(rect(outer("one")).width).toBeCloseTo(399 * 0.4, 0);
    expect(rect(outer("two")).width).toBeCloseTo(399 * 0.6, 0);
  });

  test("a handle is called Resize until it's given a name, and a label elsewhere replaces that", async () => {
    const first = await render(<Panes handle={{ "aria-label": undefined }} />);
    await expect.element(handle()).toHaveAccessibleName("Resize");
    await first.unmount();

    await render(
      <>
        <span id="its-name">Width of the list</span>
        <Panes
          handle={{ "aria-label": undefined, "aria-labelledby": "its-name" }}
        />
      </>,
    );
    await expect.element(handle()).toHaveAccessibleName("Width of the list");
    expect(handleEl().hasAttribute("aria-label")).toBe(false);
  });

  test("forwards refs, class names and other props to each part", async () => {
    const groupRef = createRef<HTMLDivElement>();
    const panelRef = createRef<HTMLDivElement>();
    const handleRef = createRef<HTMLDivElement>();
    await render(
      <div style={{ width: 400, height: 200 }}>
        <Resizable ref={groupRef} className="mine" data-kind="a">
          <ResizablePanel
            ref={panelRef}
            id="one"
            className="pane"
            data-kind="b"
          >
            One
          </ResizablePanel>
          <ResizableHandle ref={handleRef} className="line" data-kind="c" />
          <ResizablePanel id="two">Two</ResizablePanel>
        </Resizable>
      </div>,
    );

    expect(groupRef.current?.className).toBe("nuv-resizable mine");
    expect(groupRef.current?.dataset.kind).toBe("a");
    // The ref and the rest are on the box that's sized, and the class on
    // the box round the content.
    expect(panelRef.current).toBe(outer("one"));
    expect(panelRef.current?.dataset.kind).toBe("b");
    expect(inner("one").className).toBe("nuv-resizable__panel pane");
    expect(handleRef.current?.className).toBe("nuv-resizable__handle line");
    expect(handleRef.current?.dataset.kind).toBe("c");
  });

  test("one above another, the line lies flat and the panels share the height", async () => {
    await render(<Panes orientation="vertical" />);

    await expect.poll(size).toBe(40);
    expect(handleEl().getAttribute("aria-orientation")).toBe("horizontal");
    expect(rect(outer("one")).height).toBeCloseTo(199 * 0.4, 0);
    expect(rect(outer("one")).width).toBe(400);
  });

  test("the grip is drawn when asked for, hidden from screen readers, and gives way to yours", async () => {
    const first = await render(<Panes />);
    expect(handleEl().querySelector(".nuv-resizable__grip")).toBe(null);
    await first.unmount();

    const second = await render(<Panes handle={{ withGrip: true }} />);
    const grip = handleEl().querySelector(".nuv-resizable__grip");
    expect(grip?.getAttribute("aria-hidden")).toBe("true");
    expect(grip?.querySelector("svg")).not.toBe(null);
    await second.unmount();

    await render(
      <Panes
        handle={{ withGrip: true, children: <i data-testid="own">::</i> }}
      />,
    );
    expect(handleEl().querySelector(".nuv-resizable__grip")).toBe(null);
    await expect.element(page.getByTestId("own")).toBeInTheDocument();
  });
});

describe("the keys", () => {
  test("Right and Left move the handle by 5 in 100", async () => {
    await render(<Panes />);
    await expect.poll(size).toBe(40);
    handleEl().focus();
    const before = rect(handleEl()).left;

    await userEvent.keyboard("{ArrowRight}");
    await expect.poll(size).toBe(45);
    expect(rect(handleEl()).left).toBeGreaterThan(before);

    await userEvent.keyboard("{ArrowLeft}{ArrowLeft}");
    await expect.poll(size).toBe(35);
  });

  test("Home and End go as far as the panels allow", async () => {
    await render(<Panes />);
    await expect.poll(size).toBe(40);
    handleEl().focus();

    await userEvent.keyboard("{Home}");
    await expect.poll(size).toBe(20);
    await userEvent.keyboard("{End}");
    await expect.poll(size).toBe(80);
    // And no further.
    await userEvent.keyboard("{ArrowRight}");
    expect(size()).toBe(80);
  });

  test("between panels one above another it's Down and Up", async () => {
    await render(<Panes orientation="vertical" />);
    await expect.poll(size).toBe(40);
    handleEl().focus();

    await userEvent.keyboard("{ArrowDown}");
    await expect.poll(size).toBe(45);
    await userEvent.keyboard("{ArrowUp}{ArrowUp}");
    await expect.poll(size).toBe(35);
    // The other two do nothing there.
    await userEvent.keyboard("{ArrowRight}{ArrowLeft}{ArrowLeft}");
    expect(size()).toBe(35);
  });

  test("in a right-to-left page the keys still move the handle the way they point", async () => {
    await render(
      <div dir="rtl">
        <Panes />
      </div>,
    );
    // The first panel is on the right there, and the handle says the size
    // of the panel on its left, which is the second.
    await expect.poll(size).toBe(60);
    expect(rect(outer("one")).left).toBeGreaterThan(rect(outer("two")).left);
    expect(handleEl().getAttribute("aria-controls")).toBe("two");
    handleEl().focus();
    const before = rect(handleEl()).left;

    await userEvent.keyboard("{ArrowRight}");
    await expect.poll(size).toBe(65);
    expect(rect(handleEl()).left).toBeGreaterThan(before);

    await userEvent.keyboard("{ArrowLeft}{ArrowLeft}");
    await expect.poll(size).toBe(55);
    expect(rect(handleEl()).left).toBeLessThan(before);
  });

  test("and Down and Up are left as they are there", async () => {
    await render(
      <div dir="rtl">
        <Panes orientation="vertical" />
      </div>,
    );
    await expect.poll(size).toBe(40);
    handleEl().focus();

    await userEvent.keyboard("{ArrowDown}");

    await expect.poll(size).toBe(45);
  });

  test("F6 goes to the next handle, and round to the first", async () => {
    await render(
      <div style={{ width: 400, height: 200 }}>
        <Resizable>
          <ResizablePanel>One</ResizablePanel>
          <ResizableHandle aria-label="First" />
          <ResizablePanel>Two</ResizablePanel>
          <ResizableHandle aria-label="Second" />
          <ResizablePanel>Three</ResizablePanel>
        </Resizable>
      </div>,
    );
    const first = page.getByRole("separator", { name: "First" });
    const second = page.getByRole("separator", { name: "Second" });
    (first.element() as HTMLElement).focus();

    await userEvent.keyboard("{F6}");
    await expect.element(second).toHaveFocus();
    await userEvent.keyboard("{F6}");
    await expect.element(first).toHaveFocus();
  });
});

describe("dragging", () => {
  test("a drag on the handle moves it to where the pointer is let go", async () => {
    await render(<Panes />);
    await expect.poll(size).toBe(40);

    await userEvent.dragAndDrop(handle(), page.getByTestId("box"), {
      targetPosition: { x: 300, y: 100 },
      steps: 5,
    });

    await expect.poll(size).toBeGreaterThan(70);
    expect(size()).toBeLessThanOrEqual(80);
    expect(rect(handleEl()).left - rect(group()).left).toBeCloseTo(300, -1);
  });

  test("it stops at what the panels allow", async () => {
    await render(<Panes />);
    await expect.poll(size).toBe(40);

    await userEvent.dragAndDrop(handle(), page.getByTestId("box"), {
      targetPosition: { x: 10, y: 100 },
      steps: 5,
    });

    await expect.poll(size).toBe(20);
  });

  test("in a right-to-left page the handle still follows the pointer", async () => {
    await render(
      <div dir="rtl">
        <Panes />
      </div>,
    );
    await expect.poll(size).toBe(60);

    // To 100 from the left. The handle says the size of the panel on its
    // left, which is a quarter of the whole there.
    await userEvent.dragAndDrop(handle(), page.getByTestId("box"), {
      targetPosition: { x: 100, y: 100 },
      steps: 5,
    });

    await expect.poll(size).toBeLessThan(30);
    expect(size()).toBeGreaterThanOrEqual(20);
    expect(rect(handleEl()).left - rect(group()).left).toBeCloseTo(100, -1);
  });
});

describe("what it tells you", () => {
  test("onLayoutChanged is called with every panel's size once a key has moved one", async () => {
    const onLayoutChange = vi.fn();
    const onLayoutChanged = vi.fn();
    await render(
      <Panes
        onLayoutChange={onLayoutChange}
        onLayoutChanged={onLayoutChanged}
      />,
    );
    await expect.poll(size).toBe(40);
    handleEl().focus();

    await userEvent.keyboard("{ArrowRight}");

    await expect
      .poll(() => onLayoutChanged.mock.calls.at(-1)?.[0])
      .toEqual({ one: 45, two: 55 });
    expect(onLayoutChanged.mock.calls.at(-1)?.[1].isUserInteraction).toBe(true);
    expect(onLayoutChange).toHaveBeenLastCalledWith({ one: 45, two: 55 });
  });

  test("a panel's onResize is called with its size in pixels and as a share", async () => {
    const onResize = vi.fn();
    await render(<Panes first={{ onResize }} />);
    await expect.poll(size).toBe(40);
    handleEl().focus();

    await userEvent.keyboard("{ArrowRight}");

    // Not 45 to the last place: the pixels are whole ones.
    await expect
      .poll(() => Math.round(onResize.mock.calls.at(-1)?.[0].asPercentage))
      .toBe(45);
    expect(
      Math.abs(onResize.mock.calls.at(-1)?.[0].inPixels - 399 * 0.45),
    ).toBeLessThan(1);
    expect(onResize.mock.calls.at(-1)?.[1]).toBe("one");
  });

  test("defaultLayout sets the sizes to start with, over each panel's own", async () => {
    await render(<Panes defaultLayout={{ one: 30, two: 70 }} />);

    await expect.poll(size).toBe(30);
  });
});

describe("sizes that arrive late", () => {
  function Late({ onLayoutChanged }: Partial<ResizableProps>) {
    const [layout, setLayout] = useState<Record<string, number>>();
    return (
      <>
        <button type="button" onClick={() => setLayout({ one: 70, two: 30 })}>
          Arrive
        </button>
        <button type="button" onClick={() => setLayout({ one: 25, two: 75 })}>
          Again
        </button>
        <Panes defaultLayout={layout} onLayoutChanged={onLayoutChanged} />
      </>
    );
  }

  test("are put in place the once", async () => {
    await render(<Late />);
    await expect.poll(size).toBe(40);

    await page.getByRole("button", { name: "Arrive" }).click();
    await expect.poll(size).toBe(70);

    // They're where the panels start, not where they're kept.
    await page.getByRole("button", { name: "Again" }).click();
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(size()).toBe(70);
  });

  test("are left out when someone has resized the panels first", async () => {
    await render(<Late />);
    await expect.poll(size).toBe(40);
    handleEl().focus();
    await userEvent.keyboard("{ArrowRight}");
    await expect.poll(size).toBe(45);

    await page.getByRole("button", { name: "Arrive" }).click();
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(size()).toBe(45);
  });
});

describe("disabled", () => {
  test("a disabled Resizable's handle can't be reached or moved", async () => {
    await render(<Panes disabled />);
    await expect.poll(size).toBe(40);

    expect(handleEl().getAttribute("aria-disabled")).toBe("true");
    expect(handleEl().tabIndex).toBe(-1);
    expect(handleEl().dataset.separator).toBe("disabled");

    await userEvent.dragAndDrop(handle(), page.getByTestId("box"), {
      targetPosition: { x: 300, y: 100 },
      steps: 5,
    });
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(size()).toBe(40);
  });

  test("so is a disabled handle, by itself", async () => {
    await render(<Panes handle={{ disabled: true }} />);
    await expect.poll(size).toBe(40);

    expect(handleEl().getAttribute("aria-disabled")).toBe("true");
    expect(handleEl().tabIndex).toBe(-1);
  });
});

describe("a panel that folds away", () => {
  const folding = { collapsible: true };

  test("Enter on the handle folds it to nothing, and Enter again opens it to what it was", async () => {
    await render(<Panes first={folding} />);
    await expect.poll(size).toBe(40);
    handleEl().focus();

    await userEvent.keyboard("{Enter}");
    await expect.poll(size).toBe(0);
    expect(rect(outer("one")).width).toBe(0);

    await userEvent.keyboard("{Enter}");
    await expect.poll(size).toBe(40);
  });

  test("Enter does nothing to a panel that doesn't fold", async () => {
    await render(<Panes />);
    await expect.poll(size).toBe(40);
    handleEl().focus();

    await userEvent.keyboard("{Enter}");

    expect(size()).toBe(40);
  });

  test("folded, what's in it is out of reach, and open again it's back", async () => {
    await render(
      <Panes
        first={{ ...folding, children: <button type="button">Inside</button> }}
      />,
    );
    await expect.poll(size).toBe(40);
    expect(inner("one").hasAttribute("inert")).toBe(false);
    handleEl().focus();

    await userEvent.keyboard("{Enter}");
    await expect.poll(() => inner("one").hasAttribute("inert")).toBe(true);

    await userEvent.keyboard("{Enter}");
    await expect.poll(() => inner("one").hasAttribute("inert")).toBe(false);
  });

  test("a panel folded to a rail keeps what's in it within reach", async () => {
    await render(
      <Panes
        first={{
          ...folding,
          collapsedSize: "10%",
          children: <button type="button">Inside</button>,
        }}
      />,
    );
    await expect.poll(size).toBe(40);
    handleEl().focus();

    await userEvent.keyboard("{Enter}");

    await expect.poll(size).toBe(10);
    expect(inner("one").hasAttribute("inert")).toBe(false);
  });

  test("panelRef folds it, opens it and says which it is", async () => {
    const panelRef = createRef<ResizablePanelRef>();
    await render(<Panes first={{ ...folding, panelRef }} />);
    await expect.poll(size).toBe(40);

    panelRef.current?.collapse();
    await expect.poll(size).toBe(0);
    expect(panelRef.current?.isCollapsed()).toBe(true);

    panelRef.current?.expand();
    await expect.poll(size).toBe(40);
    expect(panelRef.current?.isCollapsed()).toBe(false);
  });
});

describe("a panel that scrolls", () => {
  const tall = <div style={{ height: 600 }}>A long way down</div>;

  test("takes focus itself when nothing in it can, with a name of yours", async () => {
    await render(<Panes first={{ children: tall, "aria-label": "Folders" }} />);

    await expect.poll(() => inner("one").tabIndex).toBe(0);
    expect(inner("one").getAttribute("role")).toBe("group");
    expect(inner("one").getAttribute("aria-label")).toBe("Folders");
    // The name is on the box with the role, and not on the one without.
    expect(outer("one").hasAttribute("aria-label")).toBe(false);
    // The other panel fits, and is left alone.
    expect(inner("two").hasAttribute("tabindex")).toBe(false);
    expect(inner("two").hasAttribute("role")).toBe(false);
  });

  test("doesn't when something in it can", async () => {
    await render(
      <Panes
        first={{
          children: (
            <div style={{ height: 600 }}>
              <button type="button">Inside</button>
            </div>
          ),
        }}
      />,
    );
    await expect
      .element(page.getByRole("button", { name: "Inside" }))
      .toBeVisible();
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(inner("one").hasAttribute("tabindex")).toBe(false);
  });

  test("and doesn't while it's folded away", async () => {
    await render(<Panes first={{ children: tall, collapsible: true }} />);
    await expect.poll(() => inner("one").tabIndex).toBe(0);
    handleEl().focus();

    await userEvent.keyboard("{Enter}");

    await expect.poll(() => inner("one").hasAttribute("tabindex")).toBe(false);
    expect(inner("one").hasAttribute("role")).toBe(false);
  });

  test("shows a ring inside itself when it has focus from the keyboard", async () => {
    await render(<Panes first={{ children: tall }} />);
    await expect.poll(() => inner("one").tabIndex).toBe(0);

    await userEvent.tab();

    expect(document.activeElement).toBe(inner("one"));
    expect(style(inner("one")).outlineStyle).toBe("solid");
    expect(style(inner("one")).outlineOffset).toBe("-2px");
  });
});

describe("remembering the sizes", () => {
  function Saved({ storage }: { storage?: ResizableStorage }) {
    const layout = useResizableLayout({ id: "test", storage });
    return <Panes {...layout} />;
  }
  const store = (start: Record<string, string> = {}) => {
    const kept = new Map(Object.entries(start));
    return {
      kept,
      getItem: vi.fn((key: string) => kept.get(key) ?? null),
      setItem: vi.fn((key: string, value: string) => {
        kept.set(key, value);
      }),
    };
  };

  test("the sizes are kept under the name when a panel is resized", async () => {
    const storage = store();
    await render(<Saved storage={storage} />);
    await expect.poll(size).toBe(40);
    handleEl().focus();

    await userEvent.keyboard("{ArrowRight}");

    await expect
      .poll(() => JSON.parse(storage.kept.get("nuv-resizable:test") ?? "{}"))
      .toEqual({ one: 45, two: 55 });
  });

  test("and the panels start from what was kept", async () => {
    await render(
      <Saved
        storage={store({ "nuv-resizable:test": '{"one":65,"two":35}' })}
      />,
    );

    await expect.poll(size).toBe(65);
  });

  test("the browser's own storage is used when none is given", async () => {
    localStorage.setItem("nuv-resizable:test", '{"one":25,"two":75}');
    await render(<Saved />);
    await expect.poll(size).toBe(25);
    handleEl().focus();

    await userEvent.keyboard("{ArrowRight}");

    await expect
      .poll(() => JSON.parse(localStorage.getItem("nuv-resizable:test") ?? ""))
      .toEqual({ one: 30, two: 70 });
  });

  test.each([
    ["isn't JSON", "{one:"],
    ["isn't sizes", '{"one":"wide"}'],
    ["isn't an object", "12"],
  ])("something kept that %s is passed over", async (_, kept) => {
    await render(<Saved storage={store({ "nuv-resizable:test": kept })} />);

    await expect.poll(size).toBe(40);
  });

  test("the sizes the panels start with aren't kept over ones they haven't caught up with", async () => {
    // What a page drawn on a server goes through: the panels say their
    // sizes before they've been given the kept ones.
    const storage = store({ "nuv-resizable:test": '{"one":65,"two":35}' });
    let said: ReturnType<typeof useResizableLayout> | undefined;
    function Hook() {
      said = useResizableLayout({ id: "test", storage });
      return null;
    }
    await render(<Hook />);
    const kept = () => JSON.parse(storage.kept.get("nuv-resizable:test") ?? "");
    const drawn = { isUserInteraction: false };

    said?.onLayoutChanged({ one: 40, two: 60 }, drawn);
    expect(kept()).toEqual({ one: 65, two: 35 });

    // Given the kept sizes, they say so, and from then on anything is kept:
    // a panel folded from a button isn't someone dragging either.
    said?.onLayoutChanged({ one: 65, two: 35 }, drawn);
    said?.onLayoutChanged({ one: 0, two: 100 }, drawn);
    expect(kept()).toEqual({ one: 0, two: 100 });
  });

  test("someone resizing is kept whether or not the panels had caught up", async () => {
    const storage = store({ "nuv-resizable:test": '{"one":65,"two":35}' });
    let said: ReturnType<typeof useResizableLayout> | undefined;
    function Hook() {
      said = useResizableLayout({ id: "test", storage });
      return null;
    }
    await render(<Hook />);

    said?.onLayoutChanged({ one: 50, two: 50 }, { isUserInteraction: true });

    expect(JSON.parse(storage.kept.get("nuv-resizable:test") ?? "")).toEqual({
      one: 50,
      two: 50,
    });
  });

  test("what was asked for is kept, not what a narrow window squeezed it to", async () => {
    const storage = store();
    let said: ReturnType<typeof useResizableLayout> | undefined;
    function Hook() {
      said = useResizableLayout({ id: "test", storage });
      return null;
    }
    await render(<Hook />);

    said?.onLayoutChanged(
      { one: 50, two: 50 },
      { isUserInteraction: true, requestedLayout: { one: 30, two: 70 } },
    );

    expect(JSON.parse(storage.kept.get("nuv-resizable:test") ?? "")).toEqual({
      one: 30,
      two: 70,
    });
  });

  test("storage that refuses is done without", async () => {
    const storage: ResizableStorage = {
      getItem: () => {
        throw new Error("no");
      },
      setItem: () => {
        throw new Error("no");
      },
    };
    await render(<Saved storage={storage} />);
    await expect.poll(size).toBe(40);
    handleEl().focus();

    await userEvent.keyboard("{ArrowRight}");

    await expect.poll(size).toBe(45);
  });
});

describe("layout", () => {
  test("the line is a border one pixel thick, and takes no more room than that", async () => {
    await render(<Panes />);
    await expect.poll(size).toBe(40);

    expect(rect(handleEl()).width).toBe(1);
    expect(rect(handleEl()).height).toBe(200);
    expect(style(handleEl()).borderInlineStartWidth).toBe("1px");
    expect(style(handleEl()).borderInlineStartStyle).toBe("solid");
    expect(rect(outer("one")).width + rect(outer("two")).width + 1).toBeCloseTo(
      400,
      0,
    );
  });

  test("lying flat it's a border along the top", async () => {
    await render(<Panes orientation="vertical" />);
    await expect.poll(size).toBe(40);

    expect(rect(handleEl()).height).toBe(1);
    expect(rect(handleEl()).width).toBe(400);
    expect(style(handleEl()).borderBlockStartWidth).toBe("1px");
  });

  test("the grip sits over the middle of the line, and turns with it", async () => {
    const first = await render(<Panes handle={{ withGrip: true }} />);
    await expect.poll(size).toBe(40);
    const grip = () =>
      handleEl().querySelector(".nuv-resizable__grip") as HTMLElement;
    const middle = (box: DOMRect) => ({
      x: box.left + box.width / 2,
      y: box.top + box.height / 2,
    });

    expect(middle(rect(grip())).x).toBeCloseTo(middle(rect(handleEl())).x, 0);
    expect(middle(rect(grip())).y).toBeCloseTo(middle(rect(handleEl())).y, 0);
    expect(rect(grip()).height).toBeGreaterThan(rect(grip()).width);
    // It's wider than the line and takes nothing from the panels.
    expect(rect(handleEl()).width).toBe(1);
    await first.unmount();

    await render(<Panes orientation="vertical" handle={{ withGrip: true }} />);
    await expect.poll(size).toBe(40);
    expect(rect(grip()).width).toBeGreaterThan(rect(grip()).height);
  });

  test("the handle shows a ring when it has focus from the keyboard", async () => {
    await render(<Panes />);
    await expect.poll(size).toBe(40);

    await userEvent.tab();

    expect(document.activeElement).toBe(handleEl());
    expect(style(handleEl()).outlineStyle).toBe("solid");
    expect(style(handleEl()).outlineWidth).toBe("2px");
  });

  test("a panel scrolls what doesn't fit, and the page doesn't grow", async () => {
    await render(
      <Panes first={{ children: <div style={{ height: 600 }}>Tall</div> }} />,
    );
    await expect.poll(size).toBe(40);

    expect(inner("one").scrollHeight).toBeGreaterThan(
      inner("one").clientHeight,
    );
    expect(rect(group()).height).toBe(200);
  });
});

describe("theming", () => {
  test("its variables change its look", async () => {
    await render(
      <div
        style={
          {
            "--nuv-resizable-fg": "rgb(10, 20, 30)",
            "--nuv-resizable-line": "rgb(40, 50, 60)",
            "--nuv-resizable-line-width": "3px",
            "--nuv-resizable-line-active": "rgb(1, 2, 3)",
            "--nuv-resizable-grip-bg": "rgb(200, 210, 220)",
            "--nuv-resizable-grip-fg": "rgb(70, 80, 90)",
          } as never
        }
      >
        <Panes handle={{ withGrip: true }} />
      </div>,
    );
    await expect.poll(size).toBe(40);
    const grip = handleEl().querySelector(".nuv-resizable__grip") as Element;

    expect(style(inner("one")).color).toBe("rgb(10, 20, 30)");
    expect(style(handleEl()).borderInlineStartColor).toBe("rgb(40, 50, 60)");
    expect(rect(handleEl()).width).toBe(3);
    expect(style(grip).backgroundColor).toBe("rgb(200, 210, 220)");
    expect(style(grip).color).toBe("rgb(70, 80, 90)");

    // Under the pointer, as the handle says it is.
    await userEvent.hover(handle());
    await expect
      .poll(() => style(handleEl()).borderInlineStartColor)
      .toBe("rgb(1, 2, 3)");
  });

  test.each(themes)(
    "the grip and the line under the pointer can be seen in %s",
    async (theme) => {
      const screen = await renderThemed(
        theme,
        <Panes handle={{ withGrip: true }} />,
      );
      await expect.poll(size).toBe(40);
      const ground = style(
        screen.container.querySelector("main") as Element,
      ).backgroundColor;
      const grip = handleEl().querySelector(".nuv-resizable__grip") as Element;

      expect(
        contrast(style(grip).color, style(grip).backgroundColor),
      ).toBeGreaterThanOrEqual(3);

      await userEvent.hover(handle());
      await expect
        .poll(() => contrast(style(handleEl()).borderInlineStartColor, ground))
        .toBeGreaterThanOrEqual(3);
    },
  );
});

describe.each(themes)("accessibility in %s", (theme) => {
  test("passes axe side by side, one above another, with a grip and with a panel that scrolls", async () => {
    const screen = await renderThemed(
      theme,
      <>
        <Panes handle={{ withGrip: true }} />
        <div style={{ width: 400, height: 200 }}>
          <Resizable orientation="vertical">
            <ResizablePanel aria-label="Notes" minSize="20%">
              <div style={{ height: 600 }}>A long way down</div>
            </ResizablePanel>
            <ResizableHandle aria-label="Resize notes" />
            <ResizablePanel minSize="20%">Below</ResizablePanel>
          </Resizable>
        </div>
      </>,
    );
    await expect
      .poll(() => document.querySelectorAll('[role="group"]').length)
      .toBe(1);

    await expectNoViolations(screen.container);
  });
});
