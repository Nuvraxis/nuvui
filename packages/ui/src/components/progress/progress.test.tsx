import "../../styles/index.scss";
import { createRef } from "react";
import { describe, expect, test } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
import { contrast } from "../../../test/contrast";
import { emulateMedia } from "../../../test/media";
import {
  expectNoViolations,
  renderThemed,
  themeAttributes,
  themes,
} from "../../../test/themed";
import { Progress } from "./progress";

const bar = () => page.getByRole("progressbar");
const indicator = () =>
  bar().element().querySelector(".nuv-progress__indicator") as HTMLElement;
const rect = (element: Element) => element.getBoundingClientRect();
const style = (element: Element) => getComputedStyle(element);

describe("rendering", () => {
  test("is a progress bar with its value, from 0 to 100", async () => {
    await render(<Progress aria-label="Upload" value={40} />);

    await expect.element(bar()).toHaveAccessibleName("Upload");
    await expect.element(bar()).toHaveAttribute("aria-valuenow", "40");
    await expect.element(bar()).toHaveAttribute("aria-valuemin", "0");
    await expect.element(bar()).toHaveAttribute("aria-valuemax", "100");
    await expect.element(bar()).toHaveAttribute("aria-valuetext", "40%");
    await expect.element(bar()).toHaveAttribute("data-state", "loading");
    await expect.element(bar()).toHaveClass("nuv-progress", "nuv-progress--md");
  });

  test("max changes the scale, and the text stays a percentage", async () => {
    await render(<Progress aria-label="Steps" value={3} max={12} />);

    await expect.element(bar()).toHaveAttribute("aria-valuenow", "3");
    await expect.element(bar()).toHaveAttribute("aria-valuemax", "12");
    await expect.element(bar()).toHaveAttribute("aria-valuetext", "25%");
  });

  test("getValueLabel sets what a screen reader says", async () => {
    await render(
      <Progress
        aria-label="Steps"
        value={3}
        max={12}
        getValueLabel={(value, max) => `Step ${value} of ${max}`}
      />,
    );

    await expect
      .element(bar())
      .toHaveAttribute("aria-valuetext", "Step 3 of 12");
  });

  test("a full bar says it's complete", async () => {
    await render(<Progress aria-label="Upload" value={100} />);

    await expect.element(bar()).toHaveAttribute("data-state", "complete");
  });

  test.each([
    ["no value", undefined],
    ["null", null],
    ["something that isn't a number", Number.NaN],
  ])(
    "with %s it has no value, which means the amount isn't known",
    async (_name, value) => {
      await render(<Progress aria-label="Upload" value={value} />);

      await expect.element(bar()).not.toHaveAttribute("aria-valuenow");
      await expect
        .element(bar())
        .toHaveAttribute("data-state", "indeterminate");
      expect(indicator().getAttribute("style")).toBeNull();
    },
  );

  test.each([
    [140, "100"],
    [-20, "0"],
  ])("a value of %i is held to %s", async (value, held) => {
    await render(<Progress aria-label="Upload" value={value} />);

    await expect.element(bar()).toHaveAttribute("aria-valuenow", held);
  });

  test("forwards its ref, a className and other props", async () => {
    const ref = createRef<HTMLDivElement>();
    await render(
      <Progress ref={ref} className="mine" aria-label="Upload" id="upload" />,
    );

    expect(ref.current?.className).toBe("nuv-progress nuv-progress--md mine");
    expect(ref.current?.id).toBe("upload");
  });
});

describe("layout", () => {
  test.each([
    ["sm", 6],
    ["md", 8],
    ["lg", 12],
  ] as const)("size %s is %ipx tall", async (size, pixels) => {
    await render(<Progress aria-label="Upload" value={40} size={size} />);

    expect(rect(bar().element()).height).toBe(pixels);
  });

  test("the filled part is the value's share of the width, from the start", async () => {
    await emulateMedia({ reducedMotion: "reduce" });
    await render(
      <div style={{ width: 202 }}>
        <Progress aria-label="Upload" value={25} />
      </div>,
    );
    const track = rect(bar().element());

    // 200px inside the 1px edges.
    expect(rect(indicator()).width).toBe(50);
    expect(rect(indicator()).left).toBe(track.left + 1);
  });

  test("it grows when the value does", async () => {
    await emulateMedia({ reducedMotion: "reduce" });
    const screen = await render(
      <div style={{ width: 202 }}>
        <Progress aria-label="Upload" value={25} />
      </div>,
    );
    await screen.rerender(
      <div style={{ width: 202 }}>
        <Progress aria-label="Upload" value={75} />
      </div>,
    );

    expect(rect(indicator()).width).toBe(150);
  });

  test("it fills from the right in a right-to-left layout", async () => {
    await emulateMedia({ reducedMotion: "reduce" });
    await render(
      <div dir="rtl" style={{ width: 202 }}>
        <Progress aria-label="Upload" value={25} />
      </div>,
    );

    expect(rect(indicator()).right).toBe(rect(bar().element()).right - 1);
    expect(rect(indicator()).width).toBe(50);
  });
});

describe("styles", () => {
  test("the filled part moves smoothly when motion is fine", async () => {
    await emulateMedia({ reducedMotion: "no-preference" });
    await render(<Progress aria-label="Upload" value={40} />);

    expect(style(indicator()).transitionProperty).toBe("inline-size");
  });

  test("it jumps when reduced motion is on", async () => {
    await emulateMedia({ reducedMotion: "reduce" });
    await render(<Progress aria-label="Upload" value={40} />);

    expect(style(indicator()).transitionDuration).toBe("0s");
  });

  test("with no value, a short bar slides from side to side", async () => {
    await emulateMedia({ reducedMotion: "no-preference" });
    await render(
      <div style={{ width: 202 }}>
        <Progress aria-label="Upload" />
      </div>,
    );

    expect(style(indicator()).animationName).toBe("nuv-progress-slide");
    expect(style(indicator()).animationIterationCount).toBe("infinite");
    expect(rect(indicator()).width).toBe(80);
  });

  test("it slides the other way in a right-to-left layout", async () => {
    await emulateMedia({ reducedMotion: "no-preference" });
    await render(
      <div dir="rtl">
        <Progress aria-label="Upload" />
      </div>,
    );

    expect(style(indicator()).animationName).toBe("nuv-progress-slide-rtl");
  });

  test("with no value and reduced motion, it's a full, paler bar that stands still", async () => {
    await emulateMedia({ reducedMotion: "reduce" });
    await render(
      <div style={{ width: 202 }}>
        <Progress aria-label="Upload" />
      </div>,
    );

    expect(style(indicator()).animationName).toBe("none");
    expect(rect(indicator()).width).toBe(200);
    expect(style(indicator()).opacity).toBe("0.5");
  });

  test("the sliding bar doesn't show outside the track", async () => {
    await render(<Progress aria-label="Upload" />);

    expect(style(bar().element()).overflow).toBe("hidden");
  });

  test("component variables change the look", async () => {
    await render(
      <Progress
        aria-label="Upload"
        value={50}
        style={
          {
            "--nuv-progress-width": "120px",
            "--nuv-progress-height": "20px",
            "--nuv-progress-radius": "2px",
            "--nuv-progress-track": "rgb(10, 20, 30)",
            "--nuv-progress-border": "rgb(40, 50, 60)",
            "--nuv-progress-indicator": "rgb(200, 210, 220)",
          } as never
        }
      />,
    );
    const track = style(bar().element());

    expect(rect(bar().element()).width).toBe(120);
    expect(rect(bar().element()).height).toBe(20);
    expect(track.borderTopLeftRadius).toBe("2px");
    expect(track.backgroundColor).toBe("rgb(10, 20, 30)");
    expect(track.borderTopColor).toBe("rgb(40, 50, 60)");
    expect(style(indicator()).backgroundColor).toBe("rgb(200, 210, 220)");
  });
});

describe.each(themes)("accessibility in %s", (theme) => {
  test("passes axe, with a value and without", async () => {
    await emulateMedia({ reducedMotion: "reduce" });
    const screen = await renderThemed(
      theme,
      <>
        <Progress aria-label="Upload" value={40} />
        <Progress aria-label="Import" />
      </>,
    );

    await expectNoViolations(screen.container);
  });

  test("the edge and the filled part reach 3:1 against what's next to them", async () => {
    await render(
      <div
        {...themeAttributes(theme)}
        data-testid="page"
        style={{ backgroundColor: "var(--color-background)" }}
      >
        <Progress aria-label="Upload" value={40} />
      </div>,
    );
    const track = style(bar().element());
    const behind = style(page.getByTestId("page").element()).backgroundColor;

    expect(contrast(track.borderTopColor, behind)).toBeGreaterThanOrEqual(3);
    expect(
      contrast(style(indicator()).backgroundColor, track.backgroundColor),
    ).toBeGreaterThanOrEqual(3);
  });
});
