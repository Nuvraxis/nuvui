import "../../styles/index.scss";
import { setViewport } from "@nuvui/tooling/test/media";
import {
  expectNoViolations,
  renderThemed,
  themes,
} from "@nuvui/tooling/test/themed";
import { createRef } from "react";
import { afterEach, describe, expect, test } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
import { FormattedNumber } from "../formatted-number";
import { Trend } from "../trend";
import {
  Stat,
  StatChart,
  StatDescription,
  StatGroup,
  StatLabel,
  type StatProps,
  StatValue,
} from "./stat";

function Example(props: StatProps) {
  return (
    <Stat data-testid="stat" {...props}>
      <StatLabel data-testid="label">Revenue</StatLabel>
      <StatValue data-testid="value">
        <FormattedNumber value={48250} currency="USD" />
      </StatValue>
      <StatDescription data-testid="description">
        <Trend value={0.125} /> against last month
      </StatDescription>
      <StatChart data-testid="chart" />
    </Stat>
  );
}

const part = (id: string) => page.getByTestId(id).element();
const rect = (element: Element) => element.getBoundingClientRect();
const style = (element: Element) => getComputedStyle(element);

afterEach(async () => {
  await setViewport("desktop");
});

describe("rendering", () => {
  test("every part has its class", async () => {
    await render(
      <StatGroup data-testid="group">
        <Example />
      </StatGroup>,
    );

    expect(part("group").className).toBe("nuv-stat-group");
    expect(part("stat").className).toBe("nuv-stat nuv-stat--card");
    expect(part("label").className).toBe("nuv-stat__label");
    expect(part("value").className).toBe("nuv-stat__value");
    expect(part("description").className).toBe("nuv-stat__description");
    expect(part("description").tagName).toBe("P");
    expect(part("chart").className).toBe("nuv-stat__chart");
  });

  test("reads as the label, the number, then what to make of it", async () => {
    await render(<Example />);

    expect(part("stat").textContent?.replace(/\s+/g, " ").trim()).toBe(
      "Revenue$48,250.00Up 12.5% against last month",
    );
  });

  test("plain has no card class", async () => {
    await render(<Example variant="plain" />);

    expect(part("stat").className).toBe("nuv-stat");
  });

  test("every part forwards its ref, a className and other props", async () => {
    const refs = {
      group: createRef<HTMLDivElement>(),
      stat: createRef<HTMLDivElement>(),
      label: createRef<HTMLDivElement>(),
      value: createRef<HTMLDivElement>(),
      description: createRef<HTMLParagraphElement>(),
      chart: createRef<HTMLDivElement>(),
    };
    await render(
      <StatGroup ref={refs.group} className="mine" id="group">
        <Stat ref={refs.stat} className="mine" id="stat">
          <StatLabel ref={refs.label} className="mine" id="label" />
          <StatValue ref={refs.value} className="mine" id="value" />
          <StatDescription
            ref={refs.description}
            className="mine"
            id="description"
          />
          <StatChart ref={refs.chart} className="mine" id="chart" />
        </Stat>
      </StatGroup>,
    );

    for (const [name, ref] of Object.entries(refs)) {
      expect(ref.current?.id, name).toBe(name);
      expect(ref.current?.classList.contains("mine"), name).toBe(true);
    }
  });
});

describe("layout", () => {
  test("the parts are stacked, with the number the largest", async () => {
    await render(<Example />);

    expect(rect(part("label")).bottom).toBeLessThanOrEqual(
      rect(part("value")).top,
    );
    expect(rect(part("value")).bottom).toBeLessThanOrEqual(
      rect(part("description")).top,
    );
    expect(rect(part("description")).bottom).toBeLessThanOrEqual(
      rect(part("chart")).top,
    );
    expect(Number.parseFloat(style(part("value")).fontSize)).toBeGreaterThan(
      Number.parseFloat(style(part("label")).fontSize),
    );
    expect(style(part("value")).fontVariantNumeric).toBe("tabular-nums");
  });

  test("a card has an edge, a fill and padding, and a plain one has none", async () => {
    await render(
      <>
        <Example />
        <Stat data-testid="plain" variant="plain">
          <StatValue>12</StatValue>
        </Stat>
      </>,
    );

    expect(style(part("stat")).borderTopWidth).toBe("1px");
    expect(Number.parseFloat(style(part("stat")).paddingTop)).toBeGreaterThan(
      0,
    );
    expect(style(part("plain")).borderTopWidth).toBe("0px");
    expect(style(part("plain")).paddingTop).toBe("0px");
    expect(style(part("plain")).backgroundColor).toBe("rgba(0, 0, 0, 0)");
  });

  test("the chart's room is 48 pixels high", async () => {
    await render(<Example />);

    expect(rect(part("chart")).height).toBe(48);
  });

  test("a trend and the words after it are on one line", async () => {
    await render(<Example />);
    const trend = part("description").querySelector(".nuv-trend") as Element;

    expect(
      Math.abs(rect(trend).top - rect(part("description")).top),
    ).toBeLessThan(4);
    expect(rect(part("description")).height).toBeLessThan(28);
  });

  test("a long label wraps inside a narrow card", async () => {
    await render(
      <div style={{ width: 140 }}>
        <Stat data-testid="stat">
          <StatLabel>Averagetimetofirstresponseacrossallqueues</StatLabel>
          <StatValue>4m 12s</StatValue>
        </Stat>
      </div>,
    );

    expect(part("stat").scrollWidth).toBeLessThanOrEqual(
      part("stat").clientWidth,
    );
  });

  test("a group puts as many to a row as fit, each the same width", async () => {
    await render(
      <div style={{ width: 900 }}>
        <StatGroup data-testid="group">
          {["one", "two", "three", "four"].map((id) => (
            <Stat key={id} data-testid={id}>
              <StatValue>1</StatValue>
            </Stat>
          ))}
        </StatGroup>
      </div>,
    );
    const widths = ["one", "two", "three", "four"].map(
      (id) => rect(part(id)).width,
    );

    expect(rect(part("one")).top).toBe(rect(part("four")).top);
    expect(new Set(widths.map(Math.round)).size).toBe(1);
  });

  test("a group in a narrow place is one column, no wider than the place", async () => {
    await render(
      <div style={{ width: 150 }}>
        <StatGroup data-testid="group">
          <Stat data-testid="one">
            <StatValue>1</StatValue>
          </Stat>
          <Stat data-testid="two">
            <StatValue>2</StatValue>
          </Stat>
        </StatGroup>
      </div>,
    );

    expect(rect(part("one")).bottom).toBeLessThanOrEqual(rect(part("two")).top);
    expect(rect(part("one")).width).toBeLessThanOrEqual(150);
    expect(part("group").scrollWidth).toBeLessThanOrEqual(
      part("group").clientWidth,
    );
  });

  test("a card has more padding on a wider screen", async () => {
    await setViewport("phone");
    await render(<Example />);
    const narrow = Number.parseFloat(style(part("stat")).paddingTop);

    await setViewport("desktop");
    await expect
      .poll(() => Number.parseFloat(style(part("stat")).paddingTop))
      .toBeGreaterThan(narrow);
  });
});

describe("styles", () => {
  test("component variables change the look", async () => {
    await render(
      <div
        style={
          {
            "--nuv-stat-bg": "rgb(10, 20, 30)",
            "--nuv-stat-fg": "rgb(200, 210, 220)",
            "--nuv-stat-muted-fg": "rgb(150, 160, 170)",
            "--nuv-stat-border": "rgb(40, 50, 60)",
            "--nuv-stat-radius": "2px",
            "--nuv-stat-padding": "7px",
            "--nuv-stat-gap": "9px",
            "--nuv-stat-shadow": "none",
            "--nuv-stat-value-size": "40px",
            "--nuv-stat-chart-height": "80px",
            "--nuv-stat-group-gap": "3px",
            "--nuv-stat-group-min": "50px",
            width: 400,
          } as never
        }
      >
        <StatGroup data-testid="group">
          <Example />
          <Stat data-testid="second">
            <StatValue>2</StatValue>
          </Stat>
        </StatGroup>
      </div>,
    );
    const stat = style(part("stat"));

    expect(stat.backgroundColor).toBe("rgb(10, 20, 30)");
    expect(stat.color).toBe("rgb(200, 210, 220)");
    expect(stat.borderTopColor).toBe("rgb(40, 50, 60)");
    expect(stat.borderTopLeftRadius).toBe("2px");
    expect(stat.paddingTop).toBe("7px");
    expect(stat.rowGap).toBe("9px");
    expect(stat.boxShadow).toBe("none");
    expect(style(part("label")).color).toBe("rgb(150, 160, 170)");
    expect(style(part("description")).color).toBe("rgb(150, 160, 170)");
    expect(style(part("value")).fontSize).toBe("40px");
    expect(rect(part("chart")).height).toBe(80);
    expect(style(part("group")).columnGap).toBe("3px");
    // At a least width of 50 pixels, two fit side by side in 400.
    expect(rect(part("stat")).top).toBe(rect(part("second")).top);
  });
});

describe.each(themes)("accessibility in %s", (theme) => {
  test("passes axe, as a card and plain", async () => {
    const screen = await renderThemed(
      theme,
      <StatGroup>
        <Example />
        <Stat variant="plain">
          <StatLabel>Open tickets</StatLabel>
          <StatValue>37</StatValue>
          <StatDescription>
            <Trend value={-0.08} good="down" /> against last week
          </StatDescription>
        </Stat>
      </StatGroup>,
    );

    await expectNoViolations(screen.container);
  });
});
