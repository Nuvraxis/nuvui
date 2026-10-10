import "../../styles/index.scss";
import { emulateMedia } from "@nuvui/tooling/test/media";
import {
  expectNoViolations,
  renderThemed,
  themes,
} from "@nuvui/tooling/test/themed";
import { Component, createRef, type ReactNode, useState } from "react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
import { Button } from "../button";
import {
  ActionBar,
  type ActionBarProps,
  ActionBarSelection,
} from "./action-bar";

function Example({
  count = 3,
  ...props
}: { count?: number } & Partial<ActionBarProps>) {
  return (
    <ActionBar open={count > 0} aria-label="Selected messages" {...props}>
      <ActionBarSelection>{count} selected</ActionBarSelection>
      <Button intent="secondary" size="sm">
        Archive
      </Button>
      <Button intent="danger" size="sm">
        Delete
      </Button>
    </ActionBar>
  );
}

const bar = () => page.getByRole("group", { name: "Selected messages" });
const status = () => page.getByRole("status").first().element();
const root = () => status().parentElement as HTMLElement;
const style = (element: Element) => getComputedStyle(element);
const rect = (element: Element) => element.getBoundingClientRect();

describe("closed", () => {
  test("only what a screen reader listens to is in the page, and it's empty", async () => {
    await render(<Example count={0} />);

    expect(root().className).toBe("nuv-action-bar nuv-action-bar--fixed");
    expect(root().dataset.state).toBe("closed");
    expect(root().children).toHaveLength(1);
    expect(status().textContent).toBe("");
    expect(page.getByRole("group").elements()).toHaveLength(0);
    expect(page.getByRole("button").elements()).toHaveLength(0);
  });

  test("it takes no room", async () => {
    await render(
      <div data-testid="around" style={{ display: "flow-root" }}>
        <Example count={0} position="sticky" />
      </div>,
    );

    expect(rect(page.getByTestId("around").element()).height).toBe(0);
  });
});

describe("open", () => {
  test("is a named group of your buttons", async () => {
    await render(<Example />);

    await expect.element(bar()).toBeVisible();
    expect(bar().element().className).toBe("nuv-action-bar__content");
    expect(root().dataset.state).toBe("open");
    expect(
      bar()
        .getByRole("button")
        .elements()
        .map((button) => button.textContent),
    ).toEqual(["Archive", "Delete"]);
  });

  test("how much is selected is said to a screen reader once, and describes the group", async () => {
    await render(<Example />);
    const seen = bar()
      .element()
      .querySelector(".nuv-action-bar__selection") as Element;

    // The words that are drawn are hidden, and the ones that are listened
    // to are not drawn.
    expect(seen.textContent).toBe("3 selected");
    expect(seen.getAttribute("aria-hidden")).toBe("true");
    await expect.poll(() => status().textContent).toBe("3 selected");
    expect(rect(status()).width).toBeLessThanOrEqual(1);
    await expect.element(bar()).toHaveAccessibleDescription("3 selected");
  });

  test("a change in the count is said", async () => {
    const screen = await render(<Example count={3} />);
    await expect.poll(() => status().textContent).toBe("3 selected");
    const listening = status();

    await screen.rerender(<Example count={4} />);

    await expect.poll(() => status().textContent).toBe("4 selected");
    // The same element all along, which is why the change is read out.
    expect(status()).toBe(listening);
  });

  test("opening and closing keep the element that's listened to", async () => {
    function Toggled() {
      const [count, setCount] = useState(0);
      return (
        <>
          <button type="button" onClick={() => setCount(count === 0 ? 2 : 0)}>
            Toggle
          </button>
          <Example count={count} />
        </>
      );
    }
    await render(<Toggled />);
    const listening = status();

    await page.getByRole("button", { name: "Toggle" }).click();
    await expect.poll(() => status().textContent).toBe("2 selected");
    expect(status()).toBe(listening);

    await page.getByRole("button", { name: "Toggle" }).click();
    await expect.poll(() => status().textContent).toBe("");
    expect(status()).toBe(listening);
    expect(page.getByRole("group").elements()).toHaveLength(0);
  });

  test("the ref, a className and other props go on the bar", async () => {
    const ref = createRef<HTMLDivElement>();
    await render(
      <>
        <ActionBar
          ref={ref}
          open
          aria-label="Selected messages"
          className="mine"
          id="actions"
          data-thing="yes"
          aria-describedby="more"
        >
          <ActionBarSelection>3 selected</ActionBarSelection>
        </ActionBar>
        <p id="more">Messages in the inbox.</p>
      </>,
    );

    expect(ref.current).toBe(bar().element());
    expect(ref.current?.className).toBe("nuv-action-bar__content mine");
    expect(ref.current?.id).toBe("actions");
    expect(ref.current?.dataset.thing).toBe("yes");
    await expect
      .element(bar())
      .toHaveAccessibleDescription("Messages in the inbox. 3 selected");
  });

  test("ActionBarSelection forwards its ref, a className and other props", async () => {
    const ref = createRef<HTMLSpanElement>();
    await render(
      <ActionBar open aria-label="Selected messages">
        <ActionBarSelection ref={ref} className="mine" id="count">
          1 selected
        </ActionBarSelection>
      </ActionBar>,
    );

    expect(ref.current?.className).toBe("nuv-action-bar__selection mine");
    expect(ref.current?.id).toBe("count");
  });

  test("ActionBarSelection outside a bar says where it belongs", async () => {
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
        <ActionBarSelection>Lost</ActionBarSelection>
      </Boundary>,
    );

    await expect
      .poll(() => page.getByRole("alert").element().textContent)
      .toBe("ActionBarSelection has to be inside an ActionBar.");
    quiet.mockRestore();
  });
});

describe("where it is", () => {
  // The bar slides up into its place. Measured on the way, it's still a
  // few pixels low.
  beforeEach(async () => {
    await emulateMedia({ reducedMotion: "reduce" });
  });

  test("fixed, it's along the bottom of the window, in the middle", async () => {
    await render(<Example />);
    const box = rect(bar().element());

    expect(style(root()).position).toBe("fixed");
    expect(Math.round(rect(root()).bottom)).toBe(window.innerHeight);
    expect(Math.round(rect(root()).width)).toBe(
      document.documentElement.clientWidth,
    );
    // Sixteen pixels clear of the bottom edge.
    expect(Math.round(window.innerHeight - box.bottom)).toBe(16);
    expect(
      Math.abs(
        box.left + box.width / 2 - document.documentElement.clientWidth / 2,
      ),
    ).toBeLessThanOrEqual(1);
  });

  test("fixed, it's under a dialog and over the page", async () => {
    await render(<Example />);

    expect(style(root()).zIndex).toBe("999");
  });

  test("a press beside the bar goes through to the page", async () => {
    await render(<Example />);

    expect(style(root()).pointerEvents).toBe("none");
    expect(style(bar().element()).pointerEvents).toBe("auto");
  });

  test("sticky, it stays at the bottom of what scrolls around it", async () => {
    await render(
      <div
        data-testid="scroller"
        style={{ height: 200, overflow: "auto", position: "relative" }}
      >
        <div style={{ height: 600 }} />
        <Example position="sticky" />
      </div>,
    );
    const scroller = rect(page.getByTestId("scroller").element());

    expect(root().className).toBe("nuv-action-bar nuv-action-bar--sticky");
    expect(style(root()).position).toBe("sticky");
    // Not scrolled to, and in view all the same.
    expect(Math.round(rect(root()).bottom)).toBe(Math.round(scroller.bottom));
    expect(style(root()).paddingBottom).toBe("16px");
  });

  test("static, it's where it was put, at the start, with no shadow", async () => {
    await render(
      <div data-testid="around" style={{ padding: 20 }}>
        <Example position="static" />
      </div>,
    );
    const around = rect(page.getByTestId("around").element());

    expect(root().className).toBe("nuv-action-bar nuv-action-bar--static");
    expect(style(root()).position).toBe("static");
    expect(rect(bar().element()).left).toBe(around.left + 20);
    expect(rect(bar().element()).top).toBe(around.top + 20);
    expect(style(bar().element()).boxShadow).toBe("none");
  });
});

describe("styles", () => {
  test("it has an edge, a background and a shadow, and the count comes first", async () => {
    await render(<Example />);
    const box = style(bar().element());
    const seen = bar()
      .element()
      .querySelector(".nuv-action-bar__selection") as Element;
    const first = bar().getByRole("button").elements()[0] as Element;

    expect(box.borderTopWidth).toBe("1px");
    expect(box.borderTopStyle).toBe("solid");
    expect(box.boxShadow).not.toBe("none");
    expect(box.backgroundColor).not.toBe("rgba(0, 0, 0, 0)");
    expect(rect(seen).right).toBeLessThanOrEqual(rect(first).left);
    expect(style(seen).fontVariantNumeric).toBe("tabular-nums");
  });

  test("on a narrow screen the buttons wrap and nothing is cut off", async () => {
    await render(
      <div style={{ width: 200 }}>
        <Example position="static" />
      </div>,
    );
    const box = bar().element();

    expect(rect(box).width).toBeLessThanOrEqual(200);
    expect(box.scrollWidth).toBeLessThanOrEqual(box.clientWidth);
    expect(rect(box).height).toBeGreaterThan(60);
  });

  test("it comes in with a movement, and without one for someone who asked for less", async () => {
    await emulateMedia({ reducedMotion: "no-preference" });
    const screen = await render(<Example />);
    expect(style(bar().element()).animationName).toBe("nuv-action-bar-in");

    screen.unmount();
    await emulateMedia({ reducedMotion: "reduce" });
    await render(<Example />);
    expect(style(bar().element()).animationName).toBe("none");
  });

  test("component variables change the look", async () => {
    await render(
      <div
        style={
          {
            "--nuv-action-bar-offset": "30px",
            "--nuv-action-bar-z": "5",
            "--nuv-action-bar-gap": "11px",
            "--nuv-action-bar-padding": "7px",
            "--nuv-action-bar-border": "rgb(40, 50, 60)",
            "--nuv-action-bar-radius": "3px",
            "--nuv-action-bar-bg": "rgb(10, 20, 30)",
            "--nuv-action-bar-fg": "rgb(200, 210, 220)",
            "--nuv-action-bar-shadow": "none",
          } as never
        }
      >
        <Example />
      </div>,
    );
    const box = style(bar().element());

    expect(style(root()).paddingBottom).toBe("30px");
    expect(style(root()).zIndex).toBe("5");
    expect(box.columnGap).toBe("11px");
    expect(box.paddingTop).toBe("7px");
    expect(box.borderTopColor).toBe("rgb(40, 50, 60)");
    expect(box.borderTopLeftRadius).toBe("3px");
    expect(box.backgroundColor).toBe("rgb(10, 20, 30)");
    expect(box.color).toBe("rgb(200, 210, 220)");
    expect(box.boxShadow).toBe("none");
  });
});

describe.each(themes)("accessibility in %s", (theme) => {
  test("passes axe, open and closed", async () => {
    // The bar fades in. Looked at part way through, its colors are faint
    // ones it never rests at.
    await emulateMedia({ reducedMotion: "reduce" });
    const screen = await renderThemed(
      theme,
      <>
        <Example position="static" />
        <ActionBar open={false} position="static" aria-label="Selected files">
          <ActionBarSelection>0 selected</ActionBarSelection>
        </ActionBar>
      </>,
    );
    await expect.poll(() => status().textContent).toBe("3 selected");

    await expectNoViolations(screen.container);
  });
});
