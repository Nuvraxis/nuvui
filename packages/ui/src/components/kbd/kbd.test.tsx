import "../../styles/index.scss";
import { createRef } from "react";
import { describe, expect, test } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
import { contrast } from "../../../test/contrast";
import {
  expectNoViolations,
  renderThemed,
  themeAttributes,
  themes,
} from "../../../test/themed";
import { Kbd } from "./kbd";

const key = (name: string) => page.getByText(name, { exact: true }).element();
const rect = (element: Element) => element.getBoundingClientRect();
const style = (element: Element) => getComputedStyle(element);

describe("rendering", () => {
  test("is a kbd element", async () => {
    await render(<Kbd>Esc</Kbd>);

    expect(key("Esc").tagName).toBe("KBD");
    expect(key("Esc").className).toBe("nuv-kbd");
  });

  test("forwards its ref, a className and other props", async () => {
    const ref = createRef<HTMLElement>();
    await render(
      <Kbd ref={ref} className="mine" title="Escape">
        Esc
      </Kbd>,
    );

    expect(ref.current?.className).toBe("nuv-kbd mine");
    expect(ref.current?.title).toBe("Escape");
  });
});

describe("layout", () => {
  test("a single letter is a square, and a word is wider", async () => {
    await render(
      <p style={{ fontSize: 20 }}>
        <Kbd>K</Kbd> <Kbd>Shift</Kbd>
      </p>,
    );

    expect(rect(key("K")).width).toBe(rect(key("K")).height);
    expect(rect(key("Shift")).width).toBeGreaterThan(rect(key("K")).width);
    expect(rect(key("Shift")).height).toBe(rect(key("K")).height);
  });

  test("its size follows the text it sits in", async () => {
    await render(
      <>
        <p style={{ fontSize: 14 }}>
          <Kbd>A</Kbd>
        </p>
        <p style={{ fontSize: 28 }}>
          <Kbd>B</Kbd>
        </p>
      </>,
    );

    expect(rect(key("B")).height).toBeCloseTo(rect(key("A")).height * 2, 0);
    expect(Number.parseFloat(style(key("B")).fontSize)).toBeCloseTo(22.4, 1);
  });

  test.each([1.5, 1.2, "normal"])(
    "doesn't make a line of text taller, at a line height of %s",
    async (lineHeight) => {
      await render(
        <div style={{ lineHeight }}>
          <p data-testid="plain">Press Escape to close.</p>
          <p data-testid="keyed">
            Press <Kbd>Esc</Kbd> to close.
          </p>
        </div>,
      );

      expect(rect(page.getByTestId("keyed").element()).height).toBe(
        rect(page.getByTestId("plain").element()).height,
      );
    },
  );

  test("stays on one line", async () => {
    await render(
      <p style={{ width: 20 }}>
        <Kbd>Page Down</Kbd>
      </p>,
    );

    expect(style(key("Page Down")).whiteSpace).toBe("nowrap");
  });
});

describe("styles", () => {
  test("has an edge that is thicker at the bottom", async () => {
    await render(<Kbd>Esc</Kbd>);
    const look = style(key("Esc"));

    expect(look.borderTopWidth).toBe("1px");
    expect(look.borderBottomWidth).toBe("2px");
    expect(look.borderTopStyle).toBe("solid");
  });

  test("uses the interface's font, not a monospace one", async () => {
    await render(
      <code>
        <Kbd>Esc</Kbd>
      </code>,
    );

    expect(style(key("Esc")).fontFamily).not.toMatch(/monospace/);
  });

  test("component variables change the look", async () => {
    await render(
      <Kbd
        style={
          {
            "--nuv-kbd-bg": "rgb(10, 20, 30)",
            "--nuv-kbd-fg": "rgb(200, 210, 220)",
            "--nuv-kbd-border": "rgb(40, 50, 60)",
            "--nuv-kbd-radius": "1px",
            "--nuv-kbd-size": "40px",
            "--nuv-kbd-padding-inline": "12px",
            "--nuv-kbd-font": "monospace",
            "--nuv-kbd-font-size": "18px",
          } as never
        }
      >
        Esc
      </Kbd>,
    );
    const look = style(key("Esc"));

    expect(look.backgroundColor).toBe("rgb(10, 20, 30)");
    expect(look.color).toBe("rgb(200, 210, 220)");
    expect(look.borderTopColor).toBe("rgb(40, 50, 60)");
    expect(look.borderTopLeftRadius).toBe("1px");
    expect(rect(key("Esc")).height).toBe(40);
    expect(look.paddingInlineStart).toBe("12px");
    expect(look.fontFamily).toBe("monospace");
    expect(look.fontSize).toBe("18px");
  });
});

describe.each(themes)("accessibility in %s", (theme) => {
  test("passes axe", async () => {
    const screen = await renderThemed(
      theme,
      <p>
        Press <Kbd>Ctrl</Kbd> and <Kbd>K</Kbd> to search.
      </p>,
    );

    await expectNoViolations(screen.container);
  });

  test("the edge reaches 3:1 against the page", async () => {
    await render(
      <div
        {...themeAttributes(theme)}
        data-testid="page"
        style={{ backgroundColor: "var(--color-background)" }}
      >
        <Kbd>Esc</Kbd>
      </div>,
    );

    expect(
      contrast(
        style(key("Esc")).borderTopColor,
        style(page.getByTestId("page").element()).backgroundColor,
      ),
    ).toBeGreaterThanOrEqual(3);
  });
});
