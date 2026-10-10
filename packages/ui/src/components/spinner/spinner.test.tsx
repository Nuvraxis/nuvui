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
import { Button } from "../button";
import { Spinner } from "./spinner";

const spinner = () => page.getByRole("status");
const ring = () =>
  spinner().element().querySelector(".nuv-spinner__ring") as Element;
const rect = (element: Element) => element.getBoundingClientRect();
const style = (element: Element) => getComputedStyle(element);

describe("rendering", () => {
  test("is a status that says Loading", async () => {
    await render(<Spinner />);

    await expect.element(spinner()).toHaveTextContent("Loading");
    await expect
      .element(spinner())
      .toHaveClass("nuv-spinner", "nuv-spinner--md");
    expect(ring().getAttribute("aria-hidden")).toBe("true");
  });

  test("label changes what it says", async () => {
    await render(<Spinner label="Saving the report" />);

    await expect.element(spinner()).toHaveTextContent("Saving the report");
  });

  test("with an empty label it's decoration: no role, no text, hidden from screen readers", async () => {
    await render(
      <p>
        <Spinner label="" data-testid="spinner" /> Fetching the orders
      </p>,
    );
    const element = page.getByTestId("spinner").element();

    expect(page.getByRole("status").elements()).toHaveLength(0);
    expect(element.getAttribute("aria-hidden")).toBe("true");
    expect(element.textContent).toBe("");
    expect(element.querySelector(".nuv-spinner__ring")).not.toBeNull();
  });

  test("the label is in the page and takes no room", async () => {
    await render(<Spinner />);
    const label = page.getByText("Loading").element();

    expect(rect(label).width).toBeLessThanOrEqual(1);
    expect(style(label).position).toBe("absolute");
    expect(rect(spinner().element()).width).toBe(20);
  });

  test("forwards its ref, a className and other props", async () => {
    const ref = createRef<HTMLSpanElement>();
    await render(<Spinner ref={ref} className="mine" data-state="busy" />);

    expect(ref.current?.className).toBe("nuv-spinner nuv-spinner--md mine");
    expect(ref.current?.dataset.state).toBe("busy");
  });
});

describe("layout", () => {
  test.each([
    ["sm", 16],
    ["md", 20],
    ["lg", 32],
  ] as const)("size %s is %ipx each way", async (size, pixels) => {
    // Standing still. A ring that's part way through a turn is measured
    // across its corners, which is wider than it is.
    await emulateMedia({ reducedMotion: "reduce" });
    await render(<Spinner size={size} />);

    expect(rect(spinner().element()).width).toBe(pixels);
    expect(rect(spinner().element()).height).toBe(pixels);
    expect(rect(ring()).width).toBe(pixels);
  });

  test("doesn't shrink in a row that's short of room", async () => {
    await render(
      <div style={{ display: "flex", width: 40 }}>
        <Spinner />
        <span>{"a long line of text ".repeat(4)}</span>
      </div>,
    );

    expect(rect(spinner().element()).width).toBe(20);
  });
});

describe("styles", () => {
  test("turns when motion is fine", async () => {
    await emulateMedia({ reducedMotion: "no-preference" });
    await render(<Spinner />);

    expect(style(ring()).animationName).toBe("nuv-spinner-turn");
    expect(style(ring()).animationIterationCount).toBe("infinite");
  });

  test("stands still when reduced motion is on, and is still drawn", async () => {
    await emulateMedia({ reducedMotion: "reduce" });
    await render(<Spinner />);

    expect(style(ring()).animationName).toBe("none");
    expect(rect(ring()).width).toBe(20);
  });

  test("takes the color of the text around it", async () => {
    await render(
      <div style={{ color: "rgb(10, 20, 30)" }}>
        <Spinner />
      </div>,
    );

    expect(style(ring()).stroke).toBe("rgb(10, 20, 30)");
  });

  test("inside a button it has the button's text color", async () => {
    await render(
      <Button disabled>
        <Spinner size="sm" label="Saving" />
        Save
      </Button>,
    );

    expect(style(ring()).stroke).toBe(
      style(page.getByRole("button").element()).color,
    );
  });

  test("component variables change the look", async () => {
    // WebKit on Linux reports reduced motion unless told otherwise, and the
    // ring only has a duration while it turns.
    await emulateMedia({ reducedMotion: "no-preference" });
    await render(
      <Spinner
        style={
          {
            "--nuv-spinner-size": "48px",
            "--nuv-spinner-color": "rgb(1, 2, 3)",
            "--nuv-spinner-track-opacity": "0.6",
            "--nuv-spinner-duration": "2s",
          } as never
        }
      />,
    );

    expect(rect(spinner().element()).width).toBe(48);
    expect(style(ring()).stroke).toBe("rgb(1, 2, 3)");
    expect(
      style(ring().querySelector(".nuv-spinner__track") as Element).opacity,
    ).toBe("0.6");
    expect(style(ring()).animationDuration).toBe("2s");
  });
});

describe.each(themes)("accessibility in %s", (theme) => {
  test("passes axe", async () => {
    const screen = await renderThemed(theme, <Spinner />);

    await expectNoViolations(screen.container);
  });
});
