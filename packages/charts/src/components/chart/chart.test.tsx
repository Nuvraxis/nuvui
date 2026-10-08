import "@nuvui/react/styles.css";
import "../../styles/index.scss";
import { axe } from "@nuvui/tooling/test/axe";
import { contrast } from "@nuvui/tooling/test/contrast";
import { emulateMedia, setViewport } from "@nuvui/tooling/test/media";
import { renderThemed, themes } from "@nuvui/tooling/test/themed";
import {
  type ComponentProps,
  createRef,
  Profiler,
  type ReactElement,
} from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  Pie,
  PieChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import {
  browserConfig,
  browsers,
  config,
  visitors,
} from "../../../test/visitors";
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartTable,
  ChartTooltip,
  ChartTooltipContent,
  chartColor,
  chartDash,
  chartFill,
} from ".";

type ContainerProps = Partial<ComponentProps<typeof ChartContainer>>;

// Animation is off in these, so a bar is its full size as soon as it's
// drawn. The tests for motion turn it back on.
function Bars({
  tooltip = <ChartTooltip />,
  ...props
}: ContainerProps & { tooltip?: ReactElement }) {
  return (
    <ChartContainer
      config={config}
      aria-label="Visitors by month"
      style={{ width: 600 }}
      {...props}
    >
      <BarChart data={visitors}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="month" />
        <YAxis />
        {tooltip}
        <ChartLegend />
        <Bar
          dataKey="desktop"
          fill={chartFill("desktop")}
          isAnimationActive={false}
        />
        <Bar
          dataKey="mobile"
          fill={chartFill("mobile")}
          isAnimationActive={false}
        />
      </BarChart>
    </ChartContainer>
  );
}

function Lines(props: ContainerProps) {
  return (
    <ChartContainer
      config={config}
      aria-label="Visitors by month"
      style={{ width: 600 }}
      {...props}
    >
      <LineChart data={visitors}>
        <XAxis dataKey="month" />
        <ChartTooltip indicator="line" />
        <ChartLegend indicator="line" />
        <Line
          dataKey="desktop"
          stroke={chartColor("desktop")}
          strokeDasharray={chartDash("desktop")}
          isAnimationActive={false}
        />
        <Line
          dataKey="mobile"
          stroke={chartColor("mobile")}
          strokeDasharray={chartDash("mobile")}
          isAnimationActive={false}
        />
      </LineChart>
    </ChartContainer>
  );
}

function Slices(props: ContainerProps) {
  return (
    <ChartContainer
      config={browserConfig}
      aria-label="Visitors by browser"
      style={{ width: 320 }}
      {...props}
    >
      <PieChart>
        <ChartTooltip hideLabel />
        <ChartLegend />
        <Pie
          data={browsers.map((row) => ({
            ...row,
            fill: chartFill(row.browser),
          }))}
          dataKey="visitors"
          nameKey="browser"
          isAnimationActive={false}
        />
      </PieChart>
    </ChartContainer>
  );
}

const chart = () => page.getByRole("application");
const root = () => document.querySelector(".nuv-chart") as HTMLElement;
const all = (selector: string) => [
  ...document.querySelectorAll<SVGElement>(selector),
];
const bars = (series: 0 | 1) =>
  all(".recharts-bar")[series]?.querySelectorAll<SVGElement>(
    ".recharts-rectangle",
  ) ?? [];
const bar = (series: 0 | 1, index = 0) => bars(series)[index] as SVGElement;
const lines = () => all(".recharts-line-curve");
const style = (element: Element) => getComputedStyle(element);
const tooltip = () => document.querySelector(".nuv-chart__tooltip");
const drawn = () =>
  expect.poll(() => all(".recharts-rectangle, .recharts-line-curve").length);

// The charts are 600 wide.
beforeEach(async () => {
  await setViewport("desktop");
});

describe("rendering", () => {
  test("draws the chart at the container's size", async () => {
    await render(<Bars />);
    await drawn().toBeGreaterThan(0);
    const svg = chart().element();
    const plot = svg.closest(".nuv-chart__plot") as HTMLElement;
    expect(svg.getBoundingClientRect().width).toBe(600);
    expect(plot.getBoundingClientRect().height).toBeCloseTo(337.5, 0);
    expect(svg.getBoundingClientRect().height).toBeCloseTo(337.5, 0);
  });

  test("follows the container when it changes size", async () => {
    await render(<Bars />);
    await drawn().toBeGreaterThan(0);
    root().style.width = "400px";
    await expect
      .poll(() => chart().element().getAttribute("width"))
      .toBe("400");
    expect(chart().element().getBoundingClientRect().width).toBe(400);
  });

  test("the height and the shape are variables", async () => {
    await render(
      <Bars
        style={
          {
            width: 600,
            "--nuv-chart-height": "200px",
            "--nuv-chart-aspect-ratio": "auto",
          } as ComponentProps<"div">["style"]
        }
      />,
    );
    await expect
      .poll(() => chart().element().getBoundingClientRect().height)
      .toBe(200);
  });

  test("the ref, the class and other attributes go on the container", async () => {
    const ref = createRef<HTMLDivElement>();
    await render(<Bars ref={ref} className="mine" data-testid="visitors" />);
    expect(ref.current).toBe(root());
    expect(root()).toHaveClass("nuv-chart", "mine");
    expect(root()).toHaveAttribute("data-testid", "visitors");
  });

  test("a part outside a container says what's wrong", async () => {
    const quiet = vi.spyOn(console, "error").mockImplementation(() => {});
    await expect(
      render(<ChartTable data={visitors} category="month" categoryLabel="" />),
    ).rejects.toThrow("ChartTable has to be inside a ChartContainer.");
    quiet.mockRestore();
  });
});

describe("the name", () => {
  test("the container's label names the chart", async () => {
    await render(<Bars />);
    await expect
      .element(page.getByRole("application", { name: "Visitors by month" }))
      .toBeVisible();
    expect(root()).not.toHaveAttribute("aria-label");
  });

  test("a heading can name it", async () => {
    await render(
      <>
        <h2 id="heading">Traffic</h2>
        <Bars aria-label={undefined} aria-labelledby="heading" />
      </>,
    );
    await expect
      .element(page.getByRole("application", { name: "Traffic" }))
      .toBeVisible();
  });

  test("a name written on the chart itself is kept", async () => {
    await render(
      <ChartContainer config={config} aria-label="Outer">
        <BarChart data={visitors} aria-label="Inner">
          <Bar dataKey="desktop" isAnimationActive={false} />
        </BarChart>
      </ChartContainer>,
    );
    await expect
      .element(page.getByRole("application", { name: "Inner" }))
      .toBeVisible();
  });
});

describe("colors", () => {
  test("each series has a variable, from the theme's chart colors in order", async () => {
    await renderThemed("light", <Bars />);
    await drawn().toBeGreaterThan(0);
    const tokens = style(root());
    expect(style(bar(0)).fill).toBe(
      probe(tokens.getPropertyValue("--color-chart-1")),
    );
    expect(style(bar(1)).fill).toBe(
      probe(tokens.getPropertyValue("--color-chart-2")),
    );
  });

  test("a series can have a color of its own", async () => {
    const custom: ChartConfig = {
      desktop: { label: "Desktop", color: "var(--color-chart-5)" },
      mobile: { label: "Mobile", color: "rgb(1, 2, 3)" },
    };
    await renderThemed("light", <Bars config={custom} />);
    await drawn().toBeGreaterThan(0);
    expect(style(bar(0)).fill).toBe(
      probe(style(root()).getPropertyValue("--color-chart-5")),
    );
    expect(style(bar(1)).fill).toBe("rgb(1, 2, 3)");
  });

  test("a new theme recolors the chart without drawing it again", async () => {
    const renders = vi.fn();
    const { container } = await renderThemed(
      "light",
      <Profiler id="chart" onRender={renders}>
        <Bars />
      </Profiler>,
    );
    await drawn().toBeGreaterThan(0);
    const light = style(bar(0)).fill;
    const lightText = style(
      document.querySelector(".recharts-cartesian-axis-tick-value") as Element,
    ).fill;
    const before = renders.mock.calls.length;

    (container.querySelector("main") as HTMLElement).dataset.theme = "dark";
    const dark = style(bar(0)).fill;
    expect(dark).not.toBe(light);
    expect(dark).toBe(probe(style(root()).getPropertyValue("--color-chart-1")));
    expect(
      style(
        document.querySelector(
          ".recharts-cartesian-axis-tick-value",
        ) as Element,
      ).fill,
    ).not.toBe(lightText);
    expect(renders.mock.calls.length).toBe(before);
  });

  test("a key that can't be in a variable's name still works", async () => {
    const odd: ChartConfig = { "north america": { label: "North America" } };
    await render(
      <ChartContainer config={odd} aria-label="Sales" style={{ width: 400 }}>
        <BarChart data={[{ region: "Q1", "north america": 5 }]}>
          <Bar
            dataKey="north america"
            fill={chartFill("north america")}
            isAnimationActive={false}
          />
        </BarChart>
      </ChartContainer>,
    );
    await drawn().toBeGreaterThan(0);
    expect(root().style.getPropertyValue("--chart-north-america")).not.toBe("");
    expect(style(bar(0)).fill).not.toBe("none");
  });
});

// A color as the browser reports it once computed, to compare with a fill.
function probe(color: string) {
  const element = document.createElement("div");
  element.style.color = color;
  document.body.append(element);
  const computed = getComputedStyle(element).color;
  element.remove();
  return computed;
}

describe("patterns", () => {
  test("a series is filled with its color until patterns are asked for", async () => {
    await render(<Bars />);
    await drawn().toBeGreaterThan(0);
    expect(style(bar(0)).fill).not.toContain("url(");
    expect(style(bar(1)).fill).not.toContain("url(");
  });

  test("with patterns, every series after the first has one of its own", async () => {
    const eight = Object.fromEntries(
      Array.from({ length: 8 }, (_, index) => [`s${index}`, {}]),
    );
    await render(
      <ChartContainer config={eight} aria-label="Eight" patterns>
        <BarChart data={[{ name: "a", ...eight }]}>
          <Bar dataKey="s0" isAnimationActive={false} />
        </BarChart>
      </ChartContainer>,
    );
    const fills = Object.keys(eight).map((key) =>
      style(root()).getPropertyValue(`--chart-${key}-fill`).trim(),
    );
    expect(fills[0]).not.toContain("url(");
    expect(new Set(fills).size).toBe(8);
    for (const fill of fills.slice(1)) {
      const id = /url\(#(.+)\)/.exec(fill)?.[1];
      expect(document.getElementById(id ?? "")?.tagName).toBe("pattern");
    }
  });

  test("the pattern is drawn in the bars and in the legend", async () => {
    await render(<Bars patterns />);
    await drawn().toBeGreaterThan(0);
    expect(style(bar(1)).fill).toContain("url(");
    const swatches = all(".nuv-chart__legend .nuv-chart__swatch rect");
    expect(style(swatches[0] as Element).fill).not.toContain("url(");
    expect(style(swatches[1] as Element).fill).toContain("url(");
  });

  test("a pattern set on a series is always drawn, and solid never is", async () => {
    const fixed: ChartConfig = {
      desktop: { label: "Desktop", pattern: "dots" },
      mobile: { label: "Mobile", pattern: "solid" },
    };
    const { rerender } = await render(<Bars config={fixed} />);
    await drawn().toBeGreaterThan(0);
    expect(style(bar(0)).fill).toContain("url(");
    await rerender(<Bars config={fixed} patterns />);
    expect(style(bar(1)).fill).not.toContain("url(");
  });

  test("lines are dashed the same way", async () => {
    const { rerender } = await render(<Lines />);
    await drawn().toBeGreaterThan(0);
    expect(style(lines()[1] as Element).strokeDasharray).toBe("none");
    await rerender(<Lines patterns />);
    expect(style(lines()[0] as Element).strokeDasharray).toBe("none");
    expect(style(lines()[1] as Element).strokeDasharray).toBe("6px, 4px");
    const sample = all(".nuv-chart__legend .nuv-chart__swatch--line line");
    expect(style(sample[1] as Element).strokeDasharray).toBe("6px, 4px");
  });

  test("two charts with the same series keep their own patterns", async () => {
    await render(
      <>
        <Bars patterns />
        <Bars patterns />
      </>,
    );
    const ids = all("pattern").map((pattern) => pattern.id);
    expect(ids).toHaveLength(2);
    expect(new Set(ids).size).toBe(2);
  });
});

describe("forced colors", () => {
  test("every series takes the system's text color and its pattern", async () => {
    await emulateMedia({ forcedColors: "active" });
    await render(<Bars />);
    await drawn().toBeGreaterThan(0);
    if (!window.matchMedia("(forced-colors: active)").matches) return;
    expect(style(bar(0)).fill).toBe(probe("CanvasText"));
    expect(style(bar(1)).fill).toContain("url(");
    expect(
      style(root()).getPropertyValue("--nuv-chart-forced-color").trim(),
    ).toBe("CanvasText");
  });
});

describe("the tooltip", () => {
  test("shows the point under the pointer, with the series' labels", async () => {
    await render(<Bars />);
    await drawn().toBeGreaterThan(0);
    expect(tooltip()).not.toBeVisible();
    await userEvent.hover(bar(0, 1));
    await expect.element(page.getByRole("status")).toBeVisible();
    const text = tooltip()?.textContent;
    expect(text).toContain("February");
    expect(text).toContain("Desktop305");
    expect(text).toContain("Mobile200");
  });

  test("is a live region that's there before it has anything to say", async () => {
    await render(<Bars />);
    await drawn().toBeGreaterThan(0);
    expect(tooltip()).toHaveAttribute("role", "status");
    expect(tooltip()).toHaveAttribute("aria-live", "assertive");
    expect(tooltip()).toHaveAttribute("hidden");
  });

  test("the arrow keys move through the points", async () => {
    await render(<Bars />);
    await drawn().toBeGreaterThan(0);
    (chart().element() as HTMLElement).focus();
    await userEvent.keyboard("{ArrowRight}");
    await expect.element(page.getByRole("status")).toBeVisible();
    const first = tooltip()?.textContent;
    await userEvent.keyboard("{ArrowRight}");
    await expect.poll(() => tooltip()?.textContent).not.toBe(first);
  });

  test("values are written the container's way, or the tooltip's own", async () => {
    const { rerender } = await render(
      <Bars formatValue={(value) => `${value} visits`} />,
    );
    await drawn().toBeGreaterThan(0);
    await userEvent.hover(bar(0, 1));
    await expect.element(page.getByText("305 visits")).toBeVisible();
    await rerender(
      <Bars
        formatValue={(value) => `${value} visits`}
        tooltip={
          <ChartTooltip formatValue={(value, key) => `${key}=${value}`} />
        }
      />,
    );
    await expect.element(page.getByText("desktop=305")).toBeVisible();
  });

  test("Recharts' own formatter and labelFormatter still work", async () => {
    await render(
      <Bars
        tooltip={
          <ChartTooltip
            formatter={(value, name) => [`${value}!`, `${name}?`]}
            labelFormatter={(label) => `In ${label}`}
          />
        }
      />,
    );
    await drawn().toBeGreaterThan(0);
    await userEvent.hover(bar(0, 1));
    await expect.element(page.getByText("In February")).toBeVisible();
    expect(tooltip()?.textContent).toContain("desktop?305!");
  });

  test("the label can be left out, and the sample can be a line", async () => {
    await render(
      <Bars tooltip={<ChartTooltip hideLabel indicator="line" />} />,
    );
    await drawn().toBeGreaterThan(0);
    await userEvent.hover(bar(0, 1));
    await expect.element(page.getByRole("status")).toBeVisible();
    expect(tooltip()?.textContent).not.toContain("February");
    expect(
      tooltip()?.querySelectorAll(".nuv-chart__swatch--line"),
    ).toHaveLength(2);
  });

  test("the content works in Recharts' own Tooltip", async () => {
    await render(
      <Bars tooltip={<Tooltip content={<ChartTooltipContent />} />} />,
    );
    await drawn().toBeGreaterThan(0);
    await userEvent.hover(bar(0, 1));
    await expect.element(page.getByRole("status")).toBeVisible();
    expect(tooltip()?.textContent).toContain("Desktop305");
  });

  test("a slice is named from the config", async () => {
    await render(<Slices />);
    await expect.poll(() => all(".recharts-pie-sector").length).toBe(3);
    await userEvent.hover(all(".recharts-pie-sector")[0] as Element);
    await expect.element(page.getByRole("status")).toBeVisible();
    expect(tooltip()?.textContent).toBe("Chrome275");
    const sample = tooltip()?.querySelector(".nuv-chart__swatch rect");
    expect(sample?.getAttribute("fill")).toBe(chartFill("chrome"));
  });
});

describe("the legend", () => {
  test("lists the series by their labels", async () => {
    await render(<Bars />);
    const items = page.getByRole("listitem");
    await expect.element(items.first()).toBeVisible();
    expect(items.elements().map((item) => item.textContent)).toEqual([
      "Desktop",
      "Mobile",
    ]);
  });

  test("lists the slices of a pie", async () => {
    await render(<Slices />);
    const items = page.getByRole("listitem");
    await expect.element(items.first()).toBeVisible();
    expect(items.elements().map((item) => item.textContent)).toEqual([
      "Chrome",
      "Safari",
      "Firefox",
    ]);
  });

  test("a series the config doesn't have keeps Recharts' name and color", async () => {
    await render(
      <ChartContainer config={{}} aria-label="Plain" style={{ width: 400 }}>
        <BarChart data={visitors}>
          <ChartLegend />
          <Bar
            dataKey="desktop"
            name="Computers"
            fill="rgb(9, 9, 9)"
            isAnimationActive={false}
          />
        </BarChart>
      </ChartContainer>,
    );
    await expect.element(page.getByText("Computers")).toBeVisible();
    const sample = document.querySelector(".nuv-chart__swatch rect");
    expect(style(sample as Element).fill).toBe("rgb(9, 9, 9)");
  });
});

describe("the table", () => {
  const table = (
    <ChartTable data={visitors} category="month" categoryLabel="Month" />
  );

  test("has the chart's numbers, with a heading for each row and column", async () => {
    await render(<Bars table={table} />);
    const found = page.getByRole("table", { name: "Visitors by month" });
    await expect.element(found).toBeInTheDocument();
    expect(
      page
        .getByRole("columnheader")
        .elements()
        .map((cell) => cell.textContent),
    ).toEqual(["Month", "Desktop", "Mobile"]);
    expect(
      page
        .getByRole("rowheader")
        .elements()
        .map((cell) => cell.textContent),
    ).toEqual(["January", "February", "March", "April"]);
    expect(page.getByRole("row").elements()[2]?.textContent).toBe(
      "February305200",
    );
  });

  test("is for screen readers only until it's made visible", async () => {
    const { rerender } = await render(<Bars table={table} />);
    const element = () => page.getByRole("table").element();
    const box = () => element().parentElement as HTMLElement;
    expect(box().getBoundingClientRect().width).toBe(1);
    expect(box().getBoundingClientRect().height).toBe(1);
    expect(style(box()).overflow).toBe("hidden");
    expect(style(element()).display).toBe("table");
    expect(style(element()).visibility).toBe("visible");
    // It takes no room: the container is only as tall as the chart.
    expect(root().getBoundingClientRect().height).toBeCloseTo(337.5, 0);
    await rerender(
      <Bars
        table={
          <ChartTable
            data={visitors}
            category="month"
            categoryLabel="Month"
            visible
          />
        }
      />,
    );
    expect(element().getBoundingClientRect().width).toBe(600);
  });

  test("a caption names it in place of the chart's name", async () => {
    await render(
      <Bars
        table={
          <ChartTable
            data={visitors}
            category="month"
            categoryLabel="Month"
            caption="Monthly visitors"
            visible
          />
        }
      />,
    );
    await expect
      .element(page.getByRole("table", { name: "Monthly visitors" }))
      .toBeVisible();
  });

  test("the columns, the values and the categories can be set", async () => {
    await render(
      <Bars
        formatValue={(value) => `${value} visits`}
        table={
          <ChartTable
            data={visitors}
            category="month"
            categoryLabel="Month"
            series={["mobile"]}
            formatCategory={(value) => String(value).slice(0, 3)}
            visible
          />
        }
      />,
    );
    expect(page.getByRole("row").elements()[1]?.textContent).toBe(
      "Jan80 visits",
    );
  });

  test("a value that's missing leaves its cell empty", async () => {
    await render(
      <Bars
        table={
          <ChartTable
            data={[{ month: "May", desktop: 4 }]}
            category="month"
            categoryLabel="Month"
          />
        }
      />,
    );
    expect(
      page
        .getByRole("cell")
        .elements()
        .map((cell) => cell.textContent),
    ).toEqual(["4", ""]);
  });

  test("the ref and other attributes go on the table", async () => {
    const ref = createRef<HTMLTableElement>();
    await render(
      <Bars
        table={
          <ChartTable
            ref={ref}
            data={visitors}
            category="month"
            categoryLabel="Month"
            className="mine"
          />
        }
      />,
    );
    expect(ref.current).toHaveClass("nuv-chart__table", "mine");
  });
});

describe("motion", () => {
  function Moving() {
    return (
      <ChartContainer config={config} aria-label="Bars" style={{ width: 600 }}>
        <BarChart data={visitors}>
          <Bar dataKey="desktop" fill={chartFill("desktop")} />
        </BarChart>
      </ChartContainer>
    );
  }
  const height = () => bar(0, 1)?.getBoundingClientRect().height ?? 0;

  // How tall a bar is when it's first there, and once any animation is over.
  // Recharts' takes a second and a half.
  async function heights() {
    await render(<Moving />);
    await expect.poll(() => bars(0).length).toBe(4);
    const first = height();
    await new Promise((resolve) => setTimeout(resolve, 1800));
    return [first, height()] as const;
  }

  test("a chart grows into place", async () => {
    await emulateMedia({ reducedMotion: "no-preference" });
    const [first, last] = await heights();
    expect(first).toBeLessThan(last);
  });

  test("with motion reduced it's drawn in place at once", async () => {
    await emulateMedia({ reducedMotion: "reduce" });
    const [first, last] = await heights();
    expect(first).toBe(last);
    expect(last).toBeGreaterThan(100);
  });
});

describe("accessibility", () => {
  test.for(themes)("a bar chart with its table, in %s", async (theme) => {
    const { container } = await renderThemed(
      theme,
      <Bars
        patterns
        table={
          <ChartTable
            data={visitors}
            category="month"
            categoryLabel="Month"
            visible
          />
        }
      />,
    );
    await drawn().toBeGreaterThan(0);
    await userEvent.hover(bar(0, 1));
    await expect.element(page.getByRole("status")).toBeVisible();
    expect(await axe(container)).toHaveNoViolations();
  });

  test.for(themes)(
    "the axis text and every series stand out, in %s",
    async (theme) => {
      const { container } = await renderThemed(theme, <Bars />);
      await drawn().toBeGreaterThan(0);
      const background = style(
        container.querySelector("main") as Element,
      ).backgroundColor;
      const tick = document.querySelector(
        ".recharts-cartesian-axis-tick-value",
      ) as Element;
      expect(contrast(style(tick).fill, background)).toBeGreaterThanOrEqual(
        4.5,
      );
      for (let index = 1; index <= 8; index += 1) {
        const color = style(root()).getPropertyValue(`--color-chart-${index}`);
        expect(contrast(color, background)).toBeGreaterThanOrEqual(3);
      }
    },
  );

  test("the chart is one tab stop, with a focus ring", async () => {
    await render(
      <>
        <button type="button">Before</button>
        <Bars />
        <button type="button">After</button>
      </>,
    );
    await drawn().toBeGreaterThan(0);
    (
      page.getByRole("button", { name: "Before" }).element() as HTMLElement
    ).focus();
    await userEvent.keyboard("{Tab}");
    await expect.element(chart()).toHaveFocus();
    expect(style(chart().element()).outlineStyle).toBe("solid");
    expect(parseFloat(style(chart().element()).outlineWidth)).toBe(2);
    await userEvent.keyboard("{Tab}");
    await expect
      .element(page.getByRole("button", { name: "After" }))
      .toHaveFocus();
  });
});
