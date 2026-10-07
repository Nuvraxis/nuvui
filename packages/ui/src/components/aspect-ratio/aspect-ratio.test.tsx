import "../../styles/index.scss";
import { createRef } from "react";
import { describe, expect, test } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
import { expectNoViolations, renderThemed, themes } from "../../../test/themed";
import { AspectRatio } from "./aspect-ratio";

// A picture four times as wide as it is tall.
const picture =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='100'%3E%3Crect width='400' height='100' fill='%23336'/%3E%3C/svg%3E";

const box = () => page.getByTestId("box").element();
const rect = (element: Element) => element.getBoundingClientRect();
const style = (element: Element) => getComputedStyle(element);

describe("rendering", () => {
  test("is a div, and a square until told otherwise", async () => {
    await render(
      <div style={{ width: 200 }}>
        <AspectRatio data-testid="box" />
      </div>,
    );

    expect(box().tagName).toBe("DIV");
    expect(box().className).toBe("nuv-aspect-ratio");
    expect(rect(box()).width).toBe(200);
    expect(rect(box()).height).toBe(200);
  });

  test.each([
    [16 / 9, 180],
    [4 / 3, 240],
    [2, 160],
    [1 / 2, 640],
  ])("ratio %f makes a 320px box %ipx tall", async (ratio, height) => {
    await render(
      <div style={{ width: 320 }}>
        <AspectRatio ratio={ratio} data-testid="box" />
      </div>,
    );

    expect(rect(box()).width).toBe(320);
    expect(rect(box()).height).toBeCloseTo(height, 0);
  });

  test("keeps its shape as its container changes width", async () => {
    const screen = await render(
      <div style={{ width: 320 }}>
        <AspectRatio ratio={2} data-testid="box" />
      </div>,
    );
    expect(rect(box()).height).toBe(160);

    await screen.rerender(
      <div style={{ width: 100 }}>
        <AspectRatio ratio={2} data-testid="box" />
      </div>,
    );

    expect(rect(box()).height).toBe(50);
  });

  test("forwards its ref, a className and a style", async () => {
    const ref = createRef<HTMLDivElement>();
    await render(
      <AspectRatio
        ref={ref}
        ratio={2}
        className="mine"
        style={{ outline: "1px solid" }}
      />,
    );

    expect(ref.current?.className).toBe("nuv-aspect-ratio mine");
    expect(ref.current?.style.outlineStyle).toBe("solid");
    expect(
      ref.current?.style.getPropertyValue("--nuv-aspect-ratio-value"),
    ).toBe("2");
  });
});

describe("what's inside", () => {
  test("a picture fills the box and is cropped, not stretched", async () => {
    await render(
      <div style={{ width: 200 }}>
        <AspectRatio ratio={1} data-testid="box">
          <img src={picture} alt="A dark blue band" />
        </AspectRatio>
      </div>,
    );
    const image = page.getByRole("img").element();
    await expect.poll(() => (image as HTMLImageElement).complete).toBe(true);

    expect(rect(image).width).toBe(200);
    expect(rect(image).height).toBe(200);
    expect(style(image).objectFit).toBe("cover");
  });

  test("anything else fills the box too", async () => {
    await render(
      <div style={{ width: 200 }}>
        <AspectRatio ratio={2} data-testid="box">
          <div data-testid="inside" />
        </AspectRatio>
      </div>,
    );

    expect(rect(page.getByTestId("inside").element()).width).toBe(200);
    expect(rect(page.getByTestId("inside").element()).height).toBe(100);
  });

  test("content taller than the box is cut off and doesn't stretch it", async () => {
    await render(
      <div style={{ width: 200 }}>
        <AspectRatio ratio={2} data-testid="box">
          <div>{"A line of text. ".repeat(80)}</div>
        </AspectRatio>
      </div>,
    );

    expect(rect(box()).height).toBe(100);
    expect(style(box()).overflow).toBe("hidden");
  });
});

describe("styles", () => {
  test("without the prop, the ratio comes from CSS", async () => {
    await render(
      <div style={{ width: 300, "--nuv-aspect-ratio-value": "3 / 2" } as never}>
        <AspectRatio data-testid="box" />
      </div>,
    );

    expect(box().getAttribute("style")).toBeNull();
    expect(rect(box()).height).toBe(200);
  });

  test("the prop wins over a value set further out", async () => {
    await render(
      <div style={{ width: 300, "--nuv-aspect-ratio-value": "3 / 2" } as never}>
        <AspectRatio ratio={3} data-testid="box" />
      </div>,
    );

    expect(rect(box()).height).toBe(100);
  });

  test("component variables set the corners and how a picture fits", async () => {
    await render(
      <div
        style={
          {
            width: 200,
            "--nuv-aspect-ratio-radius": "12px",
            "--nuv-aspect-ratio-fit": "contain",
          } as never
        }
      >
        <AspectRatio data-testid="box">
          <img src={picture} alt="A dark blue band" />
        </AspectRatio>
      </div>,
    );

    expect(style(box()).borderTopLeftRadius).toBe("12px");
    expect(style(page.getByRole("img").element()).objectFit).toBe("contain");
  });
});

describe.each(themes)("accessibility in %s", (theme) => {
  test("passes axe", async () => {
    const screen = await renderThemed(
      theme,
      <div style={{ width: 200 }}>
        <AspectRatio ratio={16 / 9}>
          <img src={picture} alt="A dark blue band" />
        </AspectRatio>
      </div>,
    );

    await expectNoViolations(screen.container);
  });
});
