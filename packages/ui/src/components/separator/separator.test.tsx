import "../../styles/index.scss";
import {
  expectNoViolations,
  renderThemed,
  themes,
} from "@nuvui/tooling/test/themed";
import { createRef } from "react";
import { describe, expect, test } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
import { Separator } from "./separator";

const line = () => page.getByTestId("line").element();
const rect = (element: Element) => element.getBoundingClientRect();
const style = (element: Element) => getComputedStyle(element);

describe("rendering", () => {
  test("is decorative by default, so screen readers skip it", async () => {
    await render(<Separator data-testid="line" />);

    expect(line().className).toBe("nuv-separator");
    expect(line().getAttribute("role")).toBe("none");
    expect(line().getAttribute("data-orientation")).toBe("horizontal");
    expect(page.getByRole("separator").elements()).toHaveLength(0);
  });

  test("decorative={false} makes it a separator screen readers announce", async () => {
    await render(<Separator decorative={false} />);

    await expect.element(page.getByRole("separator")).toBeInTheDocument();
    // Horizontal is what the role means unless it says otherwise.
    expect(
      page.getByRole("separator").element().getAttribute("aria-orientation"),
    ).toBeNull();
  });

  test("a vertical one that isn't decorative says which way it runs", async () => {
    await render(<Separator orientation="vertical" decorative={false} />);

    await expect
      .element(page.getByRole("separator"))
      .toHaveAttribute("aria-orientation", "vertical");
  });

  test("forwards its ref, a className and other props", async () => {
    const ref = createRef<HTMLDivElement>();
    await render(<Separator ref={ref} className="mine" id="rule" />);

    expect(ref.current?.className).toBe("nuv-separator mine");
    expect(ref.current?.id).toBe("rule");
  });
});

describe("layout", () => {
  test("a horizontal one is a line across its container", async () => {
    await render(
      <div style={{ width: 200 }}>
        <Separator data-testid="line" />
      </div>,
    );

    expect(rect(line()).width).toBe(200);
    expect(rect(line()).height).toBe(1);
  });

  test("a vertical one is as tall as the row it's in", async () => {
    await render(
      <div style={{ display: "flex", height: 40, gap: 8 }}>
        <span>Edit</span>
        <Separator orientation="vertical" data-testid="line" />
        <span>View</span>
      </div>,
    );

    expect(rect(line()).width).toBe(1);
    expect(rect(line()).height).toBe(40);
  });

  test("a vertical one outside a row is still as tall as a letter", async () => {
    await render(
      <div style={{ fontSize: 20 }}>
        <Separator orientation="vertical" data-testid="line" />
      </div>,
    );

    expect(rect(line()).height).toBe(20);
  });

  test("keeps its thickness in a row that's short of room", async () => {
    await render(
      <div style={{ display: "flex", width: 30 }}>
        <span>{"a long word ".repeat(5)}</span>
        <Separator orientation="vertical" data-testid="line" />
      </div>,
    );

    expect(rect(line()).width).toBe(1);
  });
});

describe("styles", () => {
  test("the line is a border, which is still drawn in forced colors", async () => {
    await render(<Separator data-testid="line" />);

    expect(style(line()).borderTopStyle).toBe("solid");
    expect(style(line()).borderTopWidth).toBe("1px");
    expect(style(line()).backgroundColor).toBe("rgba(0, 0, 0, 0)");
  });

  test("component variables set the color and the thickness, both ways", async () => {
    const variables = {
      "--nuv-separator-color": "rgb(10, 20, 30)",
      "--nuv-separator-size": "3px",
    } as never;
    await render(
      <div style={{ display: "flex", height: 40 }}>
        <Separator data-testid="line" style={variables} />
        <Separator
          orientation="vertical"
          data-testid="upright"
          style={variables}
        />
      </div>,
    );
    const upright = page.getByTestId("upright").element();

    expect(style(line()).borderTopColor).toBe("rgb(10, 20, 30)");
    expect(rect(line()).height).toBe(3);
    expect(style(upright).borderInlineStartColor).toBe("rgb(10, 20, 30)");
    expect(rect(upright).width).toBe(3);
  });
});

describe.each(themes)("accessibility in %s", (theme) => {
  test("passes axe, decorative and not", async () => {
    const screen = await renderThemed(
      theme,
      <>
        <p>Above</p>
        <Separator />
        <p>Between</p>
        <Separator decorative={false} />
        <p>Below</p>
      </>,
    );

    await expectNoViolations(screen.container);
  });
});
