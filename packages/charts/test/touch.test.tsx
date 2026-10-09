import "@nuvui/react/styles.css";
import "../src/styles/index.scss";
import { Bar, BarChart, XAxis } from "recharts";
import { expect, test } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
import {
  ChartContainer,
  ChartLegend,
  ChartTable,
  ChartTooltip,
  chartFill,
} from "../src";
import { config, visitors } from "./visitors";

// This file runs in a browser context of its own, one that reports a touch
// screen. What a chart does with a mouse and a keyboard is checked next to
// the component, and a tap on a bar in the docs site's tests, on a phone.

function Visitors() {
  return (
    <ChartContainer
      config={config}
      aria-label="Visitors by month"
      table={
        <ChartTable data={visitors} category="month" categoryLabel="Month" />
      }
    >
      <BarChart data={visitors}>
        <XAxis dataKey="month" />
        <ChartTooltip />
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

const bars = () => [
  ...document.querySelectorAll<SVGElement>(".recharts-rectangle"),
];

test("the chart fits a phone, and its table takes no room", async () => {
  await render(<Visitors />);
  await expect.poll(() => bars().length).toBe(8);
  const root = document.querySelector(".nuv-chart") as HTMLElement;
  const plot = document.querySelector(".nuv-chart__plot") as HTMLElement;
  expect(root.getBoundingClientRect().width).toBeLessThanOrEqual(
    window.innerWidth,
  );
  expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(
    window.innerWidth,
  );
  expect(root.getBoundingClientRect().height).toBe(
    plot.getBoundingClientRect().height,
  );
  await expect
    .element(page.getByRole("table", { name: "Visitors by month" }))
    .toBeInTheDocument();
});
