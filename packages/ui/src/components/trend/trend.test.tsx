import "../../styles/index.scss";
import { contrast } from "@nuvui/tooling/test/contrast";
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
import { Trend } from "./trend";

const style = (element: Element) => getComputedStyle(element);
const trend = (id = "trend") => page.getByTestId(id).element();
const arrow = (id = "trend") =>
  trend(id).querySelector("path")?.getAttribute("d");

// What a screen reader gets: every piece of text that isn't hidden from it.
function spoken(element: Element) {
  const copy = element.cloneNode(true) as Element;
  for (const hidden of copy.querySelectorAll('[aria-hidden="true"]')) {
    hidden.remove();
  }
  return copy.textContent?.replace(/\s+/g, " ").trim();
}

describe("rendering", () => {
  test("a rise points up, in the good color, with the direction in words", async () => {
    await render(<Trend data-testid="trend" value={0.125} />);

    expect(trend().tagName).toBe("SPAN");
    expect(trend().className).toBe("nuv-trend nuv-trend--good");
    expect(trend().getAttribute("data-direction")).toBe("up");
    expect(spoken(trend())).toBe("Up 12.5%");
  });

  test("a fall points down, in the bad color, and is written without its sign", async () => {
    await render(<Trend data-testid="trend" value={-0.04} />);

    expect(trend().className).toBe("nuv-trend nuv-trend--bad");
    expect(trend().getAttribute("data-direction")).toBe("down");
    expect(spoken(trend())).toBe("Down 4%");
    expect(trend().textContent).not.toContain("-");
  });

  test("no change is neither, and says so in place of the number", async () => {
    await render(<Trend data-testid="trend" value={0} />);

    expect(trend().className).toBe("nuv-trend nuv-trend--neutral");
    expect(trend().getAttribute("data-direction")).toBe("flat");
    expect(spoken(trend())).toBe("No change");
    // The zero is still there to be seen.
    expect(trend().textContent).toContain("0%");
  });

  test("each direction has an arrow of its own, hidden from screen readers", async () => {
    await render(
      <>
        <Trend data-testid="up" value={1} />
        <Trend data-testid="down" value={-1} />
        <Trend data-testid="flat" value={0} />
      </>,
    );

    expect(new Set([arrow("up"), arrow("down"), arrow("flat")]).size).toBe(3);
    for (const id of ["up", "down", "flat"]) {
      expect(trend(id).querySelector("svg")?.getAttribute("aria-hidden")).toBe(
        "true",
      );
    }
  });

  test('good="down" swaps the colors and leaves the arrows', async () => {
    await render(
      <>
        <Trend data-testid="fall" value={-0.2} good="down" />
        <Trend data-testid="rise" value={0.2} good="down" />
        <Trend data-testid="flat" value={0} good="down" />
      </>,
    );

    expect(trend("fall").classList.contains("nuv-trend--good")).toBe(true);
    expect(trend("fall").getAttribute("data-direction")).toBe("down");
    expect(trend("rise").classList.contains("nuv-trend--bad")).toBe(true);
    expect(trend("rise").getAttribute("data-direction")).toBe("up");
    expect(trend("flat").classList.contains("nuv-trend--neutral")).toBe(true);
  });

  test("rounds to one decimal unless told otherwise", async () => {
    await render(
      <>
        <Trend data-testid="default" value={0.12345} />
        <Trend
          data-testid="two"
          value={0.12345}
          format={{ maximumFractionDigits: 2 }}
        />
        <Trend
          data-testid="points"
          value={3.2}
          format={{ format: "decimal", locale: "de-DE" }}
        />
      </>,
    );

    expect(spoken(trend("default"))).toBe("Up 12.3%");
    expect(spoken(trend("two"))).toBe("Up 12.35%");
    expect(spoken(trend("points"))).toBe("Up 3,2");
  });

  test("children replace the amount, and the direction still comes from the value", async () => {
    await render(
      <Trend data-testid="trend" value={-3}>
        3 fewer than last week
      </Trend>,
    );

    expect(trend().getAttribute("data-direction")).toBe("down");
    expect(spoken(trend())).toBe("Down 3 fewer than last week");
  });

  test("the words can be translated", async () => {
    await render(
      <>
        <Trend data-testid="up" value={0.1} upLabel="Gestiegen um" />
        <Trend data-testid="down" value={-0.1} downLabel="Gefallen um" />
        <Trend data-testid="flat" value={0} flatLabel="Unverändert" />
      </>,
    );

    expect(spoken(trend("up"))).toBe("Gestiegen um 10%");
    expect(spoken(trend("down"))).toBe("Gefallen um 10%");
    expect(spoken(trend("flat"))).toBe("Unverändert");
  });

  test("an empty label leaves the amount to say everything", async () => {
    await render(
      <>
        <Trend data-testid="up" value={0.1} upLabel="" />
        <Trend data-testid="flat" value={0} flatLabel="" />
      </>,
    );

    expect(trend("up").querySelector(".nuv-trend__label")).toBeNull();
    expect(spoken(trend("up"))).toBe("10%");
    // With no words for it, the zero is what's read.
    expect(spoken(trend("flat"))).toBe("0%");
  });

  test("forwards its ref, a className and other props", async () => {
    const ref = createRef<HTMLSpanElement>();
    await render(
      <Trend ref={ref} value={0.1} className="mine" title="Since Monday" />,
    );

    expect(ref.current?.className).toBe("nuv-trend nuv-trend--good mine");
    expect(ref.current?.title).toBe("Since Monday");
  });
});

describe("styles", () => {
  test("the words take no room, and the arrow and the amount are a row", async () => {
    await render(<Trend data-testid="trend" value={0.5} />);
    const label = trend().querySelector(".nuv-trend__label") as Element;

    expect(style(trend()).display).toBe("inline-flex");
    expect(style(trend()).whiteSpace).toBe("nowrap");
    expect(label.getBoundingClientRect().width).toBeLessThanOrEqual(1);
    expect(style(label).position).toBe("absolute");
  });

  test("good, bad and no change are three colors", async () => {
    await render(
      <>
        <Trend data-testid="good" value={1} />
        <Trend data-testid="bad" value={-1} />
        <Trend data-testid="neutral" value={0} />
      </>,
    );

    expect(
      new Set(["good", "bad", "neutral"].map((id) => style(trend(id)).color))
        .size,
    ).toBe(3);
  });

  test("outline draws an edge in the text's color, around padding", async () => {
    await render(
      <>
        <Trend data-testid="plain" value={-1} />
        <Trend data-testid="outline" value={-1} variant="outline" />
      </>,
    );
    const outline = style(trend("outline"));

    expect(trend("outline").classList.contains("nuv-trend--outline")).toBe(
      true,
    );
    expect(outline.borderTopColor).toBe(outline.color);
    expect(outline.borderTopWidth).toBe("1px");
    expect(Number.parseFloat(outline.paddingInlineStart)).toBeGreaterThan(0);
    expect(style(trend("plain")).borderTopWidth).toBe("0px");
  });

  test("component variables change the look", async () => {
    await render(
      <Trend
        data-testid="trend"
        value={1}
        variant="outline"
        style={
          {
            "--nuv-trend-fg": "rgb(10, 20, 30)",
            "--nuv-trend-bg": "rgb(200, 210, 220)",
            "--nuv-trend-border": "rgb(40, 50, 60)",
            "--nuv-trend-radius": "2px",
            "--nuv-trend-gap": "9px",
            "--nuv-trend-font-size": "20px",
            "--nuv-trend-padding-inline": "11px",
            "--nuv-trend-padding-block": "5px",
            "--nuv-trend-icon-size": "18px",
          } as never
        }
      />,
    );
    const look = style(trend());

    expect(look.color).toBe("rgb(10, 20, 30)");
    expect(look.backgroundColor).toBe("rgb(200, 210, 220)");
    expect(look.borderTopColor).toBe("rgb(40, 50, 60)");
    expect(look.borderTopLeftRadius).toBe("2px");
    expect(look.columnGap).toBe("9px");
    expect(look.fontSize).toBe("20px");
    expect(look.paddingInlineStart).toBe("11px");
    expect(look.paddingBlockStart).toBe("5px");
    expect(
      (trend().querySelector("svg") as Element).getBoundingClientRect().width,
    ).toBe(18);
  });
});

describe.each(themes)("accessibility in %s", (theme) => {
  const all = (
    <>
      <Trend data-testid="good" value={0.12} />
      <Trend data-testid="bad" value={-0.12} />
      <Trend data-testid="neutral" value={0} />
      <Trend data-testid="good-outline" value={0.12} variant="outline" />
      <Trend data-testid="bad-outline" value={-0.12} variant="outline" />
      <Trend data-testid="neutral-outline" value={0} variant="outline" />
    </>
  );

  test("passes axe, in every color and variant", async () => {
    const screen = await renderThemed(theme, all);

    await expectNoViolations(screen.container);
  });

  test("the text reaches 4.5:1, on the page and on its own fill", async () => {
    await render(
      <div
        data-testid="page"
        {...themeAttributes(theme)}
        style={{ backgroundColor: "var(--color-background)" }}
      >
        {all}
      </div>,
    );
    const background = style(
      page.getByTestId("page").element(),
    ).backgroundColor;

    for (const id of ["good", "bad", "neutral"]) {
      expect(
        contrast(style(trend(id)).color, background),
        id,
      ).toBeGreaterThanOrEqual(4.5);
      const outline = style(trend(`${id}-outline`));
      expect(
        contrast(outline.color, outline.backgroundColor),
        `${id} outline`,
      ).toBeGreaterThanOrEqual(4.5);
    }
  });
});
