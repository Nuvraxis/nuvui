import "../../styles/index.scss";
import { contrast } from "@nuvui/tooling/test/contrast";
import { emulateMedia } from "@nuvui/tooling/test/media";
import {
  expectNoViolations,
  renderThemed,
  themeAttributes,
  themes,
} from "@nuvui/tooling/test/themed";
import { createRef } from "react";
import { describe, expect, test } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
import { TextShimmer } from "./text-shimmer";

const text = () => page.getByText("Thinking").element();
const style = (element: Element) => getComputedStyle(element);
const clear = "rgba(0, 0, 0, 0)";

describe("rendering", () => {
  test("is a span with its text, which a screen reader reads as text", async () => {
    await render(<TextShimmer>Thinking</TextShimmer>);

    expect(text().tagName).toBe("SPAN");
    expect(text().className).toBe("nuv-text-shimmer nuv-text-shimmer--active");
    expect(text().dataset.state).toBe("active");
    expect(text().hasAttribute("aria-hidden")).toBe(false);
    expect(text().hasAttribute("role")).toBe(false);
  });

  test("active={false} is plain text", async () => {
    await render(<TextShimmer active={false}>Thinking</TextShimmer>);

    expect(text().className).toBe("nuv-text-shimmer");
    expect(text().dataset.state).toBe("still");
  });

  test("forwards its ref, a className and other props", async () => {
    const ref = createRef<HTMLSpanElement>();
    await render(
      <TextShimmer ref={ref} className="mine" id="wait" role="status">
        Thinking
      </TextShimmer>,
    );

    expect(ref.current).toBe(text());
    expect(text().className).toBe(
      "nuv-text-shimmer nuv-text-shimmer--active mine",
    );
    expect(text().id).toBe("wait");
    expect(text().getAttribute("role")).toBe("status");
  });
});

describe("with motion", () => {
  test("the text is cut out of a background that moves, for ever", async () => {
    await emulateMedia({ reducedMotion: "no-preference" });
    await render(<TextShimmer>Thinking</TextShimmer>);

    expect(style(text()).animationName).toBe("nuv-text-shimmer-sweep");
    expect(style(text()).animationIterationCount).toBe("infinite");
    expect(style(text()).animationDuration).toBe("2s");
    expect(style(text()).backgroundClip).toBe("text");
    expect(style(text()).backgroundImage).toContain("linear-gradient");
    // The letters show the background through.
    expect(style(text()).color).toBe(clear);
    expect(style(text()).backgroundColor).not.toBe(clear);
  });

  test("the highlight goes the other way where text is read from the right", async () => {
    await emulateMedia({ reducedMotion: "no-preference" });
    await render(
      <div dir="rtl">
        <TextShimmer>Thinking</TextShimmer>
      </div>,
    );

    expect(style(text()).animationDirection).toBe("reverse");
  });

  test("it stops when it's told the wait is over, and keeps its color", async () => {
    await emulateMedia({ reducedMotion: "no-preference" });
    const screen = await render(<TextShimmer>Thinking</TextShimmer>);
    const resting = style(text()).backgroundColor;

    await screen.rerender(<TextShimmer active={false}>Thinking</TextShimmer>);

    expect(style(text()).animationName).toBe("none");
    expect(style(text()).backgroundImage).toBe("none");
    expect(style(text()).color).toBe(resting);
  });

  test("component variables change the colors and the speed", async () => {
    await emulateMedia({ reducedMotion: "no-preference" });
    await render(
      <div
        style={
          {
            "--nuv-text-shimmer-fg": "rgb(10, 20, 30)",
            "--nuv-text-shimmer-highlight": "rgb(200, 210, 220)",
            "--nuv-text-shimmer-duration": "5s",
          } as never
        }
      >
        <TextShimmer>Thinking</TextShimmer>
      </div>,
    );

    expect(style(text()).backgroundColor).toBe("rgb(10, 20, 30)");
    expect(style(text()).backgroundImage).toContain("rgb(200, 210, 220)");
    expect(style(text()).animationDuration).toBe("5s");
  });
});

describe("with less motion", () => {
  test("nothing moves, and the text has its color the ordinary way", async () => {
    await emulateMedia({ reducedMotion: "reduce" });
    await render(<TextShimmer>Thinking</TextShimmer>);

    expect(style(text()).animationName).toBe("none");
    expect(style(text()).backgroundImage).toBe("none");
    expect(style(text()).color).not.toBe(clear);
  });
});

describe.each(themes)("accessibility in %s", (theme) => {
  test("passes axe, moving and still", async () => {
    await emulateMedia({ reducedMotion: "no-preference" });
    const screen = await renderThemed(
      theme,
      <p>
        <TextShimmer>Thinking</TextShimmer>{" "}
        <TextShimmer active={false}>Done</TextShimmer>
      </p>,
    );

    await expectNoViolations(screen.container);
  });

  test("the resting color and the highlight both reach 4.5:1 against the page", async () => {
    await emulateMedia({ reducedMotion: "no-preference" });
    await render(
      <div
        data-testid="page"
        {...themeAttributes(theme)}
        style={{ backgroundColor: "var(--color-background)" }}
      >
        <TextShimmer>Thinking</TextShimmer>
        <span
          data-testid="highlight"
          style={{
            color: "var(--nuv-text-shimmer-highlight, var(--color-foreground))",
          }}
        />
      </div>,
    );
    const background = style(
      page.getByTestId("page").element(),
    ).backgroundColor;

    // The text is never fainter than the first of these, and never
    // stronger than the second.
    expect(
      contrast(style(text()).backgroundColor, background),
    ).toBeGreaterThanOrEqual(4.5);
    expect(
      contrast(
        style(page.getByTestId("highlight").element()).color,
        background,
      ),
    ).toBeGreaterThanOrEqual(4.5);
  });
});
