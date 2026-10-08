"use client";

import "./round.css";
import {
  ChartContainer,
  ChartLegend,
  ChartTable,
  ChartTooltip,
  chartFill,
} from "@nuvui/charts";
import { RadialBar, RadialBarChart } from "recharts";
import { browsers, browsersConfig } from "./data";

const label = (browser: number | string) =>
  browsersConfig[browser as keyof typeof browsersConfig]?.label ?? browser;

const bars = browsers.map((row) => ({
  ...row,
  fill: chartFill(row.browser),
}));

export default function Example() {
  return (
    <ChartContainer
      config={browsersConfig}
      aria-label="Visitors by browser"
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
      <RadialBarChart data={bars} innerRadius="25%" outerRadius="100%">
        <ChartTooltip hideLabel nameKey="browser" cursor={false} />
        <ChartLegend nameKey="browser" />
        <RadialBar dataKey="visitors" background />
      </RadialBarChart>
    </ChartContainer>
  );
}
