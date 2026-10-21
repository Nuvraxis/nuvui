import "../../styles/index.scss";
import { emulateMedia } from "@nuvui/tooling/test/media";
import {
  expectNoViolations,
  renderThemed,
  themes,
} from "@nuvui/tooling/test/themed";
import { createRef, useRef } from "react";
import { renderToString } from "react-dom/server";
import { beforeEach, describe, expect, test } from "vitest";
import { render } from "vitest-browser-react";
import { ScrollProgress } from "./scroll-progress";

beforeEach(async () => {
  // Less motion, so the bar is where the scroll is and not on its way.
  await emulateMedia({ reducedMotion: "reduce" });
});

const style = (element: Element) => getComputedStyle(element);
const root = () =>
  document.querySelector(".nuv-scroll-progress") as HTMLElement;
const bar = () =>
  document.querySelector(".nuv-scroll-progress__bar") as HTMLElement;

// How much of its length the bar fills, from its transform.
function filled(axis: "x" | "y" = "x") {
  const matrix = new DOMMatrixReadOnly(style(bar()).transform);
  return axis === "x" ? matrix.a : matrix.d;
}

// A box 100px tall, with 400px in it to scroll through: 300px of travel.
function Box({
  axis,
  orientation,
  dir,
}: {
  axis?: "block" | "inline";
  orientation?: "horizontal" | "vertical";
  dir?: "rtl";
}) {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div dir={dir}>
      <ScrollProgress target={ref} axis={axis} orientation={orientation} />
      <div
        ref={ref}
        data-testid="box"
        style={{ blockSize: 100, inlineSize: 100, overflow: "auto" }}
      >
        <div
          style={
            axis === "inline"
              ? { inlineSize: 400, blockSize: 10 }
              : { blockSize: 400 }
          }
        />
      </div>
    </div>
  );
}

const box = () =>
  document.querySelector('[data-testid="box"]') as HTMLDivElement;

describe("rendering", () => {
  test("a bar the width of where it's put, hidden from screen readers", async () => {
    await render(
      <div style={{ inlineSize: 300 }}>
        <ScrollProgress />
      </div>,
    );

    expect(root().tagName).toBe("DIV");
    expect(root().getAttribute("aria-hidden")).toBe("true");
    expect(root().getBoundingClientRect().width).toBe(300);
    expect(root().getBoundingClientRect().height).toBe(4);
    expect(style(root()).pointerEvents).toBe("none");
  });

  test("forwards its ref, a className and other props", async () => {
    const ref = createRef<HTMLDivElement>();
    await render(<ScrollProgress ref={ref} className="mine" id="reading" />);

    expect(ref.current).toBe(root());
    expect(root().className).toBe("nuv-scroll-progress mine");
    expect(root().id).toBe("reading");
  });

  test("the page from the server has an empty bar", () => {
    const html = renderToString(<ScrollProgress />);

    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain('class="nuv-scroll-progress__bar"');
    expect(html).not.toContain("--nuv-scroll-progress-value");
  });
});

describe("following a box", () => {
  test("starts empty, and fills as the box is scrolled", async () => {
    await render(<Box />);
    expect(filled()).toBe(0);

    box().scrollTop = 150;
    await expect.poll(() => filled()).toBeCloseTo(0.5, 2);

    box().scrollTop = 300;
    await expect.poll(() => filled()).toBe(1);
  });

  test("a box with nothing to scroll leaves it empty", async () => {
    function Short() {
      const ref = useRef<HTMLDivElement>(null);
      return (
        <>
          <ScrollProgress target={ref} />
          <div ref={ref} style={{ blockSize: 100, overflow: "auto" }}>
            Short
          </div>
        </>
      );
    }
    await render(<Short />);

    expect(filled()).toBe(0);
  });

  test("keeps up when what's in the box grows, with no scroll", async () => {
    await render(<Box />);
    box().scrollTop = 300;
    await expect.poll(() => filled()).toBe(1);

    (box().firstElementChild as HTMLElement).style.blockSize = "700px";

    // 300 of 600 now.
    await expect.poll(() => filled()).toBeCloseTo(0.5, 2);
  });

  test('axis="inline" follows scrolling along the line', async () => {
    await render(<Box axis="inline" />);

    box().scrollLeft = 150;
    await expect.poll(() => filled()).toBeCloseTo(0.5, 2);
  });

  test('axis="inline" counts from where a line starts, right to left too', async () => {
    await render(<Box axis="inline" dir="rtl" />);
    expect(filled()).toBe(0);

    // In a box that reads right to left, scrolling toward the end of the
    // line takes scrollLeft below zero.
    box().scrollLeft = -150;
    await expect.poll(() => filled()).toBeCloseTo(0.5, 2);
  });

  test("stops following once it's gone", async () => {
    // Outside what's rendered, so the page can still be scrolled once the
    // bar is gone.
    const spacer = document.createElement("div");
    spacer.style.blockSize = "300vh";
    document.body.append(spacer);
    const screen = await render(<ScrollProgress />);
    const element = root();
    const before = element.style.getPropertyValue(
      "--nuv-scroll-progress-value",
    );
    screen.unmount();

    window.scrollTo(0, 500);
    await new Promise((resolve) => requestAnimationFrame(resolve));
    await new Promise((resolve) => requestAnimationFrame(resolve));

    expect(element.style.getPropertyValue("--nuv-scroll-progress-value")).toBe(
      before,
    );
    window.scrollTo(0, 0);
    spacer.remove();
  });
});

describe("following the page", () => {
  test("fills as the page is scrolled", async () => {
    await render(
      <>
        <ScrollProgress />
        <div style={{ blockSize: "300vh" }} />
      </>,
    );
    const range = document.documentElement.scrollHeight - window.innerHeight;

    window.scrollTo(0, range / 2);
    await expect.poll(() => filled()).toBeCloseTo(0.5, 1);

    window.scrollTo(0, range);
    await expect.poll(() => filled()).toBe(1);
    window.scrollTo(0, 0);
  });
});

describe("the bar", () => {
  test("fills from where a line starts: the left, or the right when the page reads right to left", async () => {
    await render(
      <>
        <ScrollProgress />
        <div dir="rtl">
          <ScrollProgress />
        </div>
      </>,
    );
    const [ltr, rtl] = Array.from(
      document.querySelectorAll(".nuv-scroll-progress__bar"),
    ) as [Element, Element];

    expect(style(ltr).transformOrigin.startsWith("0px")).toBe(true);
    expect(style(rtl).transformOrigin.startsWith("0px")).toBe(false);
  });

  test('orientation="vertical" stands up and fills from the top', async () => {
    await render(
      <div style={{ blockSize: 200 }}>
        <Box orientation="vertical" />
      </div>,
    );

    expect(root().getBoundingClientRect().width).toBe(4);
    box().scrollTop = 150;
    await expect.poll(() => filled("y")).toBeCloseTo(0.5, 2);
    expect(style(bar()).transformOrigin.endsWith(" 0px")).toBe(true);
  });

  test("component variables set its thickness and colors", async () => {
    await render(
      <div
        style={
          {
            "--nuv-scroll-progress-size": "8px",
            "--nuv-scroll-progress-color": "rgb(1, 2, 3)",
            "--nuv-scroll-progress-track": "rgb(4, 5, 6)",
          } as never
        }
      >
        <ScrollProgress />
      </div>,
    );

    expect(root().getBoundingClientRect().height).toBe(8);
    expect(style(bar()).backgroundColor).toBe("rgb(1, 2, 3)");
    expect(style(root()).backgroundColor).toBe("rgb(4, 5, 6)");
  });
});

describe("motion", () => {
  test("glides to a new value where motion is fine", async () => {
    await emulateMedia({ reducedMotion: "no-preference" });
    await render(<ScrollProgress />);

    expect(style(bar()).transitionProperty).toBe("transform");
    expect(Number.parseFloat(style(bar()).transitionDuration)).toBeGreaterThan(
      0,
    );
  });

  test("follows the scroll exactly for less motion", async () => {
    await render(<ScrollProgress />);

    expect(Number.parseFloat(style(bar()).transitionDuration)).toBe(0);
  });
});

describe.each(themes)("accessibility in %s", (theme) => {
  test("passes axe", async () => {
    const screen = await renderThemed(theme, <Box />);

    await expectNoViolations(screen.container);
  });
});
