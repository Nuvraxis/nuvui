import "../../styles/index.scss";
import { emulateMedia } from "@nuvui/tooling/test/media";
import {
  expectNoViolations,
  renderThemed,
  themes,
} from "@nuvui/tooling/test/themed";
import { createRef, useState } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, test, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { Compare, type CompareProps } from "./compare";

// Two blocks of color in place of pictures, so nothing is fetched and what
// shows at a point can be told by its test id.
function Pictures(props: Partial<CompareProps>) {
  return (
    <div style={{ inlineSize: 400 }}>
      <Compare
        before={
          <div
            data-testid="before"
            style={{ blockSize: 200, backgroundColor: "rgb(200, 40, 40)" }}
          />
        }
        after={
          <div
            data-testid="after"
            style={{ blockSize: 200, backgroundColor: "rgb(40, 40, 200)" }}
          />
        }
        {...props}
      />
    </div>
  );
}

const divider = () => page.getByRole("slider");
const dividerEl = () => divider().element() as HTMLElement;
const frame = () =>
  document.querySelector(".nuv-compare__frame") as HTMLElement;
const layer = (side: "before" | "after") =>
  document.querySelector(`.nuv-compare__layer--${side}`) as HTMLElement;
const now = () => Number(dividerEl().getAttribute("aria-valuenow"));
const style = (element: Element) => getComputedStyle(element);
const rect = (element: Element) => element.getBoundingClientRect();

// Which one is seen at this share of the way across, or down, the frame.
// The labels take no pointer, so what's under them is what's drawn.
function seenAt(share: number, axis: "x" | "y" = "x") {
  const box = rect(frame());
  const x = axis === "x" ? box.left + box.width * share : box.left + 4;
  const y = axis === "y" ? box.top + box.height * share : box.top + 4;
  return document
    .elementFromPoint(x, y)
    ?.closest("[data-testid]")
    ?.getAttribute("data-testid");
}

// The middle of the divider's line, as a share of the frame.
function lineAt(axis: "x" | "y" = "x") {
  const box = rect(frame());
  const line = rect(dividerEl());
  return axis === "x"
    ? (line.left + line.width / 2 - box.left) / box.width
    : (line.top + line.height / 2 - box.top) / box.height;
}

describe("the divider", () => {
  test("is a slider, named, at the middle at first", async () => {
    await render(<Pictures />);

    await expect.element(divider()).toHaveAccessibleName("Before and after");
    expect(dividerEl().getAttribute("aria-orientation")).toBe("horizontal");
    expect(dividerEl().getAttribute("aria-valuemin")).toBe("0");
    expect(dividerEl().getAttribute("aria-valuemax")).toBe("100");
    expect(now()).toBe(50);
    expect(dividerEl().getAttribute("aria-valuetext")).toBe(
      "50% Before, 50% After",
    );
    expect(lineAt()).toBeCloseTo(0.5, 2);
  });

  test("shows before up to it and after past it", async () => {
    await render(<Pictures defaultPosition={30} />);

    expect(seenAt(0.1)).toBe("before");
    expect(seenAt(0.2)).toBe("before");
    expect(seenAt(0.4)).toBe("after");
    expect(seenAt(0.9)).toBe("after");
    expect(lineAt()).toBeCloseTo(0.3, 2);
  });

  test("a position outside 0 to 100 is taken as the end it's past", async () => {
    await render(<Pictures defaultPosition={150} />);
    expect(now()).toBe(100);
    expect(seenAt(0.9)).toBe("before");
  });

  test("the handle is as large as a finger, and the line can be taken along its whole length", async () => {
    await render(<Pictures />);
    const handle = dividerEl().querySelector(".nuv-compare__handle") as Element;

    expect(rect(handle).width).toBe(44);
    expect(rect(handle).height).toBe(44);
    expect(rect(dividerEl()).width).toBe(44);
    expect(rect(dividerEl()).height).toBe(rect(frame()).height);
  });

  test("only the divider takes a drag from the page; the rest of the picture scrolls it", async () => {
    await render(<Pictures />);

    expect(style(dividerEl()).touchAction).toBe("none");
    expect(style(frame()).touchAction).toBe("auto");
    expect(style(layer("after")).touchAction).toBe("auto");
  });
});

describe("dragging", () => {
  test("a drag on the divider moves it to the pointer, and says where", async () => {
    const onPositionChange = vi.fn();
    await render(<Pictures onPositionChange={onPositionChange} />);

    await userEvent.dragAndDrop(divider(), page.getByTestId("after"), {
      targetPosition: { x: 300, y: 100 },
      steps: 5,
    });

    await expect.poll(now).toBeCloseTo(75, -1);
    expect(lineAt()).toBeCloseTo(0.75, 1);
    expect(onPositionChange).toHaveBeenCalled();
    expect(onPositionChange.mock.lastCall?.[0]).toBe(now());
    expect(seenAt(0.6)).toBe("before");
  });

  test("a drag anywhere else on the picture leaves it where it is", async () => {
    const onPositionChange = vi.fn();
    await render(<Pictures onPositionChange={onPositionChange} />);

    await userEvent.dragAndDrop(
      page.getByTestId("after"),
      page.getByTestId("after"),
      {
        // Where after is the one seen, so the press lands on it.
        sourcePosition: { x: 300, y: 100 },
        targetPosition: { x: 250, y: 100 },
        steps: 5,
      },
    );

    expect(now()).toBe(50);
    expect(onPositionChange).not.toHaveBeenCalled();
  });

  test("it stops at the edges", async () => {
    await render(<Pictures />);

    await userEvent.dragAndDrop(divider(), page.getByTestId("after"), {
      targetPosition: { x: 399, y: 100 },
      steps: 5,
    });

    await expect.poll(now).toBeGreaterThan(95);
    expect(now()).toBeLessThanOrEqual(100);
  });

  test("on a right-to-left page before is on the right, and the divider still follows the pointer", async () => {
    await render(
      <div dir="rtl">
        <Pictures />
      </div>,
    );
    expect(seenAt(0.9)).toBe("before");
    expect(seenAt(0.1)).toBe("after");

    // A quarter of the way from the left is three quarters of before.
    await userEvent.dragAndDrop(divider(), page.getByTestId("after"), {
      targetPosition: { x: 100, y: 100 },
      steps: 5,
    });

    await expect.poll(now).toBeCloseTo(75, -1);
    expect(lineAt()).toBeCloseTo(0.25, 1);
    expect(seenAt(0.4)).toBe("before");
  });

  test("vertical: before is on top, and the divider follows the pointer down", async () => {
    await render(<Pictures orientation="vertical" />);
    expect(dividerEl().getAttribute("aria-orientation")).toBe("vertical");
    expect(seenAt(0.1, "y")).toBe("before");
    expect(seenAt(0.9, "y")).toBe("after");
    expect(lineAt("y")).toBeCloseTo(0.5, 2);
    expect(rect(dividerEl()).height).toBe(44);
    expect(rect(dividerEl()).width).toBe(rect(frame()).width);

    await userEvent.dragAndDrop(divider(), page.getByTestId("after"), {
      targetPosition: { x: 200, y: 150 },
      steps: 5,
    });

    await expect.poll(now).toBeCloseTo(75, -1);
    expect(lineAt("y")).toBeCloseTo(0.75, 1);
  });
});

describe("the keyboard", () => {
  test("Tab reaches the divider, and the arrows, Page Up, Page Down, Home and End move it", async () => {
    await render(<Pictures />);

    await userEvent.tab();
    await expect.element(divider()).toHaveFocus();

    await userEvent.keyboard("{ArrowRight}");
    expect(now()).toBe(51);
    await userEvent.keyboard("{ArrowLeft}{ArrowLeft}");
    expect(now()).toBe(49);
    await userEvent.keyboard("{ArrowUp}");
    expect(now()).toBe(50);
    await userEvent.keyboard("{ArrowDown}");
    expect(now()).toBe(49);
    await userEvent.keyboard("{PageUp}");
    expect(now()).toBe(59);
    await userEvent.keyboard("{PageDown}{PageDown}");
    expect(now()).toBe(39);
    await userEvent.keyboard("{Home}");
    expect(now()).toBe(0);
    await userEvent.keyboard("{ArrowLeft}");
    expect(now()).toBe(0);
    await userEvent.keyboard("{End}");
    expect(now()).toBe(100);
    expect(dividerEl().getAttribute("aria-valuetext")).toBe(
      "100% Before, 0% After",
    );
  });

  test("step sets how far a key moves it", async () => {
    await render(<Pictures step={5} />);
    dividerEl().focus();

    await userEvent.keyboard("{ArrowRight}");
    expect(now()).toBe(55);
    await userEvent.keyboard("{PageDown}");
    expect(now()).toBe(5);
  });

  test("on a right-to-left page the left arrow moves it left, which shows more of before", async () => {
    await render(
      <div dir="rtl">
        <Pictures />
      </div>,
    );
    dividerEl().focus();

    await userEvent.keyboard("{ArrowLeft}");
    expect(now()).toBe(51);
    expect(lineAt()).toBeLessThan(0.5);
    await userEvent.keyboard("{ArrowRight}{ArrowRight}");
    expect(now()).toBe(49);
    await userEvent.keyboard("{ArrowUp}");
    expect(now()).toBe(50);
  });

  test("vertical: the down arrow moves it down, which shows more of before", async () => {
    await render(<Pictures orientation="vertical" />);
    dividerEl().focus();

    await userEvent.keyboard("{ArrowDown}");
    expect(now()).toBe(51);
    expect(lineAt("y")).toBeGreaterThan(0.5);
    await userEvent.keyboard("{ArrowUp}{ArrowUp}");
    expect(now()).toBe(49);
  });

  test("other keys are left to the page", async () => {
    await render(<Pictures />);
    dividerEl().focus();
    const seen = vi.fn();
    dividerEl().addEventListener("keydown", (event) =>
      seen(event.key, event.defaultPrevented),
    );

    await userEvent.keyboard("a");
    expect(seen).toHaveBeenLastCalledWith("a", false);
    expect(now()).toBe(50);
  });

  test("a drag leaves the divider focused, with no ring", async () => {
    await render(<Pictures />);

    await userEvent.dragAndDrop(divider(), page.getByTestId("after"), {
      targetPosition: { x: 300, y: 100 },
      steps: 5,
    });
    const handle = dividerEl().querySelector(".nuv-compare__handle") as Element;

    await expect.element(divider()).toHaveFocus();
    expect(style(handle).outlineStyle).toBe("none");
  });

  test("the handle has a ring when the divider has keyboard focus", async () => {
    await render(<Pictures />);
    await userEvent.tab();
    const handle = dividerEl().querySelector(".nuv-compare__handle") as Element;

    expect(style(handle).outlineStyle).toBe("solid");
    expect(style(dividerEl()).outlineStyle).toBe("none");
  });
});

describe("controlled", () => {
  test("follows position, and asks for a new one rather than moving on its own", async () => {
    const onPositionChange = vi.fn();
    await render(
      <Pictures position={30} onPositionChange={onPositionChange} />,
    );
    dividerEl().focus();

    await userEvent.keyboard("{ArrowRight}");
    expect(onPositionChange).toHaveBeenCalledWith(31);
    expect(now()).toBe(30);
  });

  test("moves when the position it's given does", async () => {
    function Controlled() {
      const [position, setPosition] = useState(20);
      return <Pictures position={position} onPositionChange={setPosition} />;
    }
    await render(<Controlled />);
    dividerEl().focus();

    await userEvent.keyboard("{PageUp}");
    expect(now()).toBe(30);
    expect(lineAt()).toBeCloseTo(0.3, 2);
  });

  test("a key that can't move it any further doesn't ask to", async () => {
    const onPositionChange = vi.fn();
    await render(
      <Pictures position={100} onPositionChange={onPositionChange} />,
    );
    dividerEl().focus();

    await userEvent.keyboard("{End}{ArrowRight}");
    expect(onPositionChange).not.toHaveBeenCalled();
  });
});

describe("toggle", () => {
  const button = (name: string) => page.getByRole("radio", { name });

  test("shows before, with a switch under it and no divider", async () => {
    await render(<Pictures mode="toggle" />);

    expect(page.getByRole("slider").elements()).toHaveLength(0);
    await expect
      .element(page.getByRole("radiogroup", { name: "Show" }))
      .toBeInTheDocument();
    await expect.element(button("Before")).toBeChecked();
    expect(seenAt(0.5)).toBe("before");
    expect(seenAt(0.95)).toBe("before");
    expect(layer("after").getAttribute("aria-hidden")).toBe("true");
    expect(layer("after").hasAttribute("inert")).toBe(true);
    expect(layer("before").hasAttribute("aria-hidden")).toBe(false);
    expect(layer("before").hasAttribute("inert")).toBe(false);
  });

  test("the switch shows the other, and the one it hides can't be reached", async () => {
    const onShownChange = vi.fn();
    await render(<Pictures mode="toggle" onShownChange={onShownChange} />);

    await userEvent.click(button("After"));
    expect(onShownChange).toHaveBeenCalledWith("after");
    await expect.element(button("After")).toBeChecked();
    await expect.poll(() => seenAt(0.05)).toBe("after");
    expect(layer("before").getAttribute("aria-hidden")).toBe("true");
    expect(layer("before").hasAttribute("inert")).toBe(true);
    expect(layer("after").hasAttribute("inert")).toBe(false);
  });

  test("pressing the one that's shown again leaves it shown", async () => {
    await render(<Pictures mode="toggle" defaultShown="after" />);

    await userEvent.click(button("After"));
    await expect.element(button("After")).toBeChecked();
    expect(layer("after").hasAttribute("inert")).toBe(false);
  });

  test("follows shown when you control it", async () => {
    const onShownChange = vi.fn();
    await render(
      <Pictures mode="toggle" shown="after" onShownChange={onShownChange} />,
    );

    await userEvent.click(button("Before"));
    expect(onShownChange).toHaveBeenCalledWith("before");
    await expect.element(button("After")).toBeChecked();
    expect(seenAt(0.05)).toBe("after");
  });

  test("wipes from one to the other, unless less motion was asked for", async () => {
    await emulateMedia({ reducedMotion: "no-preference" });
    await render(<Pictures mode="toggle" />);
    expect(style(layer("before")).transitionProperty).toBe("clip-path");
    expect(style(layer("before")).transitionDuration).not.toBe("0s");

    await emulateMedia({ reducedMotion: "reduce" });
    expect(style(layer("before")).transitionDuration).toBe("0s");
  });

  test("a dragged divider follows the pointer with no wipe", async () => {
    await emulateMedia({ reducedMotion: "no-preference" });
    await render(<Pictures />);
    expect(style(layer("before")).transitionDuration).toBe("0s");
  });
});

describe("the names", () => {
  test("are on the picture, before at the start and after at the end", async () => {
    await render(<Pictures />);
    const before = page.getByText("Before", { exact: true }).element();
    const after = page.getByText("After", { exact: true }).element();

    expect(rect(before).left).toBeLessThan(rect(frame()).left + 40);
    expect(rect(after).right).toBeGreaterThan(rect(frame()).right - 40);
    expect(style(before).pointerEvents).toBe("none");
  });

  test("can be translated, with what a screen reader says", async () => {
    await render(
      <Pictures
        beforeLabel="Vorher"
        afterLabel="Nachher"
        dividerLabel="Vorher und nachher"
        valueLabel={(position) => `${position} Prozent vorher`}
      />,
    );

    await expect
      .element(page.getByText("Vorher", { exact: true }))
      .toBeVisible();
    await expect
      .element(page.getByText("Nachher", { exact: true }))
      .toBeVisible();
    await expect.element(divider()).toHaveAccessibleName("Vorher und nachher");
    expect(dividerEl().getAttribute("aria-valuetext")).toBe(
      "50 Prozent vorher",
    );
  });

  test("labels={false} leaves them off the picture, and not off the switch", async () => {
    await render(<Pictures mode="toggle" labels={false} />);

    expect(document.querySelectorAll(".nuv-compare__label")).toHaveLength(0);
    await expect
      .element(page.getByRole("radio", { name: "Before" }))
      .toBeInTheDocument();
  });

  test("vertical: before at the top and after at the bottom", async () => {
    await render(<Pictures orientation="vertical" />);
    const before = page.getByText("Before", { exact: true }).element();
    const after = page.getByText("After", { exact: true }).element();

    expect(rect(before).top).toBeLessThan(rect(frame()).top + 40);
    expect(rect(after).bottom).toBeGreaterThan(rect(frame()).bottom - 40);
  });
});

describe("the element", () => {
  test("passes the ref, class and other props to the root", async () => {
    const ref = createRef<HTMLDivElement>();
    await render(
      <Compare
        ref={ref}
        before="Before"
        after="After"
        className="mine"
        id="kitchen"
      />,
    );
    const root = document.querySelector(".nuv-compare") as HTMLElement;

    expect(ref.current).toBe(root);
    expect(root.className).toBe("nuv-compare nuv-compare--horizontal mine");
    expect(root.id).toBe("kitchen");
  });

  test("a ratio sets the frame's shape, and the pictures fill it", async () => {
    await render(
      <Pictures style={{ "--nuv-compare-ratio": "4 / 1" } as never} />,
    );

    expect(rect(frame()).height).toBe(100);
    expect(rect(layer("after")).height).toBe(100);
    expect(rect(layer("before")).height).toBe(100);
  });

  test("component variables change the look", async () => {
    await render(
      <Pictures
        style={
          {
            "--nuv-compare-line": "rgb(10, 20, 30)",
            "--nuv-compare-line-width": "4px",
            "--nuv-compare-handle-bg": "rgb(1, 2, 3)",
            "--nuv-compare-label-fg": "rgb(250, 240, 230)",
            "--nuv-compare-radius": "0px",
          } as never
        }
      />,
    );
    const line = getComputedStyle(dividerEl(), "::before");
    const handle = dividerEl().querySelector(".nuv-compare__handle") as Element;

    expect(line.backgroundColor).toBe("rgb(10, 20, 30)");
    expect(line.width).toBe("4px");
    expect(style(handle).backgroundColor).toBe("rgb(1, 2, 3)");
    expect(style(page.getByText("Before").element()).color).toBe(
      "rgb(250, 240, 230)",
    );
    expect(style(frame()).borderRadius).toBe("0px");
  });

  test("the page from the server has both pictures and the divider where it starts", () => {
    const html = renderToString(
      <Compare
        before={<img src="/before.jpg" alt="The kitchen before" />}
        after={<img src="/after.jpg" alt="The kitchen after" />}
        defaultPosition={40}
      />,
    );

    expect(html).toContain("The kitchen before");
    expect(html).toContain("The kitchen after");
    expect(html).toContain("--nuv-compare-position:40%");
    expect(html).toContain('aria-valuenow="40"');
  });
});

describe.each(themes)("accessibility in %s", (theme) => {
  test("passes axe, as a slider and as a switch, both ways", async () => {
    const screen = await renderThemed(
      theme,
      <>
        <Pictures />
        <Pictures orientation="vertical" dividerLabel="Top and bottom" />
        <Pictures mode="toggle" switchLabel="Show the kitchen" />
      </>,
    );

    await expectNoViolations(screen.container);
  });
});
