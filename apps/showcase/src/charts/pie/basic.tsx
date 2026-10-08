"use client";

import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartTable,
  ChartTooltip,
  chartFill,
} from "@nuvui/charts";
import { Pie, PieChart } from "recharts";

const data = [
  { browser: "chrome", visitors: 275 },
  { browser: "safari", visitors: 200 },
  { browser: "firefox", visitors: 187 },
  { browser: "edge", visitors: 173 },
  { browser: "other", visitors: 90 },
];

const config = {
  chrome: { label: "Chrome" },
  safari: { label: "Safari" },
  firefox: { label: "Firefox" },
  edge: { label: "Edge" },
  other: { label: "Other" },
  visitors: { label: "Visitors" },
} satisfies ChartConfig;

const label = (browser: number | string) =>
  config[browser as keyof typeof config]?.label ?? browser;

// A slice takes its fill from its row.
const slices = data.map((row) => ({ ...row, fill: chartFill(row.browser) }));

export default function Chart() {
  return (
    <ChartContainer
      config={config}
      aria-label="Visitors by browser"
      table={
        <ChartTable
          data={data}
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
