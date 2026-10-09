"use client";

import {
  ChartContainer,
  ChartTable,
  ChartTooltip,
  chartFill,
} from "@nuvui/charts";
import { Bar, BarChart, LabelList, XAxis, YAxis } from "recharts";
import { browsers, browsersConfig } from "./data";

const label = (browser: number | string) =>
  browsersConfig[browser as keyof typeof browsersConfig]?.label ?? browser;

const rows = browsers.map((row) => ({
  ...row,
  fill: chartFill(row.browser),
}));

export default function Example() {
  return (
    <ChartContainer
      config={browsersConfig}
      aria-label="Visitors by browser"
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
      <BarChart data={rows} layout="vertical" margin={{ right: 32 }}>
        <XAxis type="number" dataKey="visitors" hide />
        <YAxis
          type="category"
          dataKey="browser"
          tickFormatter={label}
          tickLine={false}
          axisLine={false}
          width={64}
        />
        <ChartTooltip hideLabel nameKey="browser" cursor={false} />
        <Bar dataKey="visitors" radius={4}>
          <LabelList dataKey="visitors" position="right" offset={8} />
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
