import "../../styles/index.scss";
import { emulateMedia } from "@nuvui/tooling/test/media";
import {
  expectNoViolations,
  renderThemed,
  themes,
} from "@nuvui/tooling/test/themed";
import { createRef } from "react";
import { describe, expect, test } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
import { Skeleton } from "./skeleton";

const skeleton = (id = "skeleton") => page.getByTestId(id).element();
const rect = (element: Element) => element.getBoundingClientRect();
const style = (element: Element) => getComputedStyle(element);

describe("rendering", () => {
  test("is a block, hidden from screen readers", async () => {
    await render(<Skeleton data-testid="skeleton" />);

    expect(skeleton().tagName).toBe("DIV");
    expect(skeleton().className).toBe("nuv-skeleton nuv-skeleton--block");
    expect(skeleton().getAttribute("aria-hidden")).toBe("true");
  });

  test("forwards its ref, a className and a style", async () => {
    const ref = createRef<HTMLDivElement>();
    await render(<Skeleton ref={ref} className="mine" style={{ width: 80 }} />);

    expect(ref.current?.className).toBe(
      "nuv-skeleton nuv-skeleton--block mine",
    );
    expect(rect(ref.current as Element).width).toBe(80);
  });
});

describe("layout", () => {
  test("a block is as wide as its container and one line tall until told otherwise", async () => {
    await render(
      <div style={{ width: 200 }}>
        <Skeleton data-testid="skeleton" />
        <Skeleton data-testid="sized" style={{ width: 120, height: 80 }} />
      </div>,
    );

    expect(rect(skeleton()).width).toBe(200);
    expect(rect(skeleton()).height).toBe(16);
    expect(rect(skeleton("sized")).width).toBe(120);
    expect(rect(skeleton("sized")).height).toBe(80);
  });

  test("a text one is as tall as the letters around it, and takes up a line", async () => {
    await render(
      <div style={{ fontSize: 20, lineHeight: 1.5 }}>
        <Skeleton shape="text" data-testid="skeleton" />
        <Skeleton shape="text" data-testid="second" />
      </div>,
    );

    expect(getComputedStyle(skeleton(), "::before").height).toBe("20px");
    // The element itself is one line of the text, so rows of them are
    // spaced like lines.
    expect(rect(skeleton()).height).toBe(30);
    expect(rect(skeleton("second")).top - rect(skeleton()).top).toBe(30);
  });

  test("a circle is as wide as it is tall, and round", async () => {
    await render(<Skeleton shape="circle" data-testid="skeleton" />);

    expect(rect(skeleton()).width).toBe(40);
    expect(rect(skeleton()).height).toBe(40);
    expect(
      Number.parseFloat(style(skeleton()).borderTopLeftRadius),
    ).toBeGreaterThan(20);
  });
});

describe("styles", () => {
  test("pulses when motion is fine", async () => {
    await emulateMedia({ reducedMotion: "no-preference" });
    await render(<Skeleton data-testid="skeleton" />);

    expect(style(skeleton()).animationName).toBe("nuv-skeleton-pulse");
    expect(style(skeleton()).animationIterationCount).toBe("infinite");
  });

  test("stands still when reduced motion is on", async () => {
    await emulateMedia({ reducedMotion: "reduce" });
    await render(<Skeleton data-testid="skeleton" />);

    expect(style(skeleton()).animationName).toBe("none");
  });

  test("component variables change the look", async () => {
    await render(
      <Skeleton
        data-testid="skeleton"
        style={
          {
            "--nuv-skeleton-bg": "rgb(10, 20, 30)",
            "--nuv-skeleton-radius": "2px",
            "--nuv-skeleton-width": "90px",
            "--nuv-skeleton-height": "30px",
          } as never
        }
      />,
    );

    expect(style(skeleton()).backgroundColor).toBe("rgb(10, 20, 30)");
    expect(style(skeleton()).borderTopLeftRadius).toBe("2px");
    expect(rect(skeleton()).width).toBe(90);
    expect(rect(skeleton()).height).toBe(30);
  });
});

describe.each(themes)("accessibility in %s", (theme) => {
  test("passes axe inside a region that says it's loading", async () => {
    const screen = await renderThemed(
      theme,
      <section aria-label="Profile" aria-busy="true">
        <Skeleton shape="circle" />
        <Skeleton shape="text" />
        <Skeleton />
      </section>,
    );

    await expectNoViolations(screen.container);
  });
});
