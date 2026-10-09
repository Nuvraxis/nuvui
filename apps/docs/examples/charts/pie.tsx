"use client";

import "./round.css";
import {
  ChartContainer,
  ChartLegend,
  ChartTable,
  ChartTooltip,
  chartFill,
} from "@nuvui/charts";
import { Pie, PieChart } from "recharts";
import { browsers, browsersConfig } from "./data";

const label = (browser: number | string) =>
  browsersConfig[browser as keyof typeof browsersConfig]?.label ?? browser;

// A slice takes its fill from its row.
const slices = browsers.map((row) => ({
  ...row,
  fill: chartFill(row.browser),
}));

export default function Example() {
  return (
    <ChartContainer
      config={browsersConfig}
      aria-label="Visitors by browser"
      patterns
      className="round-chart"
      table={
        <ChartTable
          data={browsers}
          category="browser"
          categoryLabel="Browser"
          series={["visitors"]}
          formatCategory={label}
        />
      }
    >
      <PieChart>
        <ChartTooltip hideLabel />
        <ChartLegend />
        <Pie data={slices} dataKey="visitors" nameKey="browser" />
      </PieChart>
    </ChartContainer>
  );
}
