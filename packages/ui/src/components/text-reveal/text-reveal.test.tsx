import "../../styles/index.scss";
import { emulateMedia } from "@nuvui/tooling/test/media";
import {
  expectNoViolations,
  renderThemed,
  themes,
} from "@nuvui/tooling/test/themed";
import { createRef } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, test } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
import { TextReveal } from "./text-reveal";

const style = (element: Element) => getComputedStyle(element);
const root = () => document.querySelector(".nuv-text-reveal") as HTMLElement;
const texts = () =>
  Array.from(document.querySelectorAll(".nuv-text-reveal__text"));
const lines = ["Ship the report", "your team asked for"];
// How far a line is from where it sits, in pixels.
const lowered = (element: Element) =>
  new DOMMatrixReadOnly(style(element).transform).m42;

describe("rendering", () => {
  test("a span with each line in it, one under the other", async () => {
    await render(<TextReveal lines={lines} />);

    expect(root().tagName).toBe("SPAN");
    expect(root().className).toBe("nuv-text-reveal");
    expect(style(root()).display).toBe("block");
    expect(texts().map((each) => each.textContent)).toEqual(lines);
    const [first, second] = texts() as [Element, Element];
    expect(second.getBoundingClientRect().top).toBeGreaterThan(
      first.getBoundingClientRect().top,
    );
  });

  test("the lines are spaced as they would be without it, however tight the line height", async () => {
    // Short lines, so neither wraps in the test's narrow frame whatever the
    // font is.
    await render(
      <p style={{ fontSize: 40, lineHeight: 1 }}>
        <TextReveal lines={["Ship", "today"]} />
      </p>,
    );
    const [first, second] = texts().map((each) =>
      each.getBoundingClientRect(),
    ) as [DOMRect, DOMRect];

    expect(first.height).toBeCloseTo(40, 0);
    expect(second.top - first.bottom).toBeCloseTo(0, 1);
    expect(root().getBoundingClientRect().height).toBeCloseTo(80, 0);
  });

  test("the lines read and copy as words, with a space between them", async () => {
    await render(
      <h1>
        <TextReveal lines={lines} />
      </h1>,
    );

    expect(root().textContent).toBe("Ship the report your team asked for");
    await expect
      .element(
        page.getByRole("heading", {
          name: "Ship the report your team asked for",
        }),
      )
      .toBeInTheDocument();
  });

  test("a line can hold markup", async () => {
    await render(
      <TextReveal
        lines={[
          "Ship the report",
          <>
            your team <em>asked</em> for
          </>,
        ]}
      />,
    );

    expect(root().querySelector("em")?.textContent).toBe("asked");
  });

  test("forwards its ref, a className and other props", async () => {
    const ref = createRef<HTMLSpanElement>();
    await render(
      <TextReveal ref={ref} lines={lines} className="mine" id="headline" />,
    );

    expect(ref.current).toBe(root());
    expect(root().className).toBe("nuv-text-reveal mine");
    expect(root().id).toBe("headline");
  });

  test("the page from the server has every word, and hides none", () => {
    const rising = renderToString(<TextReveal lines={lines} />);
    const waiting = renderToString(<TextReveal lines={lines} trigger="view" />);

    for (const html of [rising, waiting]) {
      for (const line of lines) expect(html).toContain(line);
      expect(html).not.toContain('data-state="waiting"');
    }
    expect(rising).toContain('data-state="rising"');
    expect(waiting).toContain('data-state="shown"');
  });
});

describe("with motion", () => {
  test("each line rises into place a moment after the one before", async () => {
    await emulateMedia({ reducedMotion: "no-preference" });
    await render(<TextReveal lines={lines} />);
    const [first, second] = texts() as [Element, Element];

    expect(root().dataset.state).toBe("rising");
    expect(style(first).animationName).toBe("nuv-text-reveal-rise");
    expect(style(first).animationDelay).toBe("0s");
    expect(style(second).animationDelay).toBe("0.12s");
    // Each is cut to its own line, so it comes up from under an edge.
    expect(style(first.parentElement as Element).overflow).toBe("clip");

    await expect.poll(() => lowered(second), { timeout: 3000 }).toBe(0);
  });

  test("component variables change the timing", async () => {
    await emulateMedia({ reducedMotion: "no-preference" });
    await render(
      <div
        style={
          {
            "--nuv-text-reveal-duration": "1s",
            "--nuv-text-reveal-stagger": "300ms",
          } as never
        }
      >
        <TextReveal lines={lines} />
      </div>,
    );
    const [, second] = texts() as [Element, Element];

    expect(style(second).animationDuration).toBe("1s");
    expect(style(second).animationDelay).toBe("0.3s");
  });

  test('trigger="view": text out of view waits under its edge, and rises when it comes into view', async () => {
    await emulateMedia({ reducedMotion: "no-preference" });
    await render(
      <div>
        <div style={{ blockSize: "300vh" }} />
        <TextReveal lines={lines} trigger="view" />
      </div>,
    );
    const [first] = texts() as [Element];

    expect(root().dataset.state).toBe("waiting");
    expect(lowered(first)).toBeGreaterThan(0);

    root().scrollIntoView({ block: "center" });

    await expect.poll(() => root().dataset.state).toBe("rising");
    await expect.poll(() => lowered(first), { timeout: 3000 }).toBe(0);
  });

  test('trigger="view": text already in view when it opens is shown as it is', async () => {
    await emulateMedia({ reducedMotion: "no-preference" });
    await render(<TextReveal lines={lines} trigger="view" />);
    const [first] = texts() as [Element];

    expect(root().dataset.state).toBe("shown");
    expect(style(first).animationName).toBe("none");
    expect(lowered(first)).toBe(0);
  });
});

describe("with less motion", () => {
  test("every line is in place from the start", async () => {
    await emulateMedia({ reducedMotion: "reduce" });
    await render(<TextReveal lines={lines} />);

    for (const text of texts()) {
      expect(style(text).animationName).toBe("none");
      expect(lowered(text)).toBe(0);
    }
  });

  test('trigger="view": text out of view isn\'t hidden while it waits', async () => {
    await emulateMedia({ reducedMotion: "reduce" });
    await render(
      <div>
        <div style={{ blockSize: "300vh" }} />
        <TextReveal lines={lines} trigger="view" />
      </div>,
    );

    expect(root().dataset.state).toBe("waiting");
    for (const text of texts()) expect(lowered(text)).toBe(0);
  });
});

describe.each(themes)("accessibility in %s", (theme) => {
  test("passes axe in a heading", async () => {
    await emulateMedia({ reducedMotion: "reduce" });
    const screen = await renderThemed(
      theme,
      <h1>
        <TextReveal lines={lines} />
      </h1>,
    );

    await expectNoViolations(screen.container);
  });
});
