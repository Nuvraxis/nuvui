"use client";

import {
  ChartContainer,
  ChartLegend,
  ChartTable,
  ChartTooltip,
  chartFill,
} from "@nuvui/charts";
import { Bar, BarChart, CartesianGrid, LabelList, XAxis } from "recharts";
import { short, visitors, visitorsConfig } from "./data";

// The total goes on top of each stack, so it's a field of the row.
const rows = visitors.map((row) => ({
  ...row,
  total: row.desktop + row.mobile,
}));

export default function Example() {
  return (
    <ChartContainer
      config={visitorsConfig}
      aria-label="Visitors by month, desktop and mobile stacked, with totals"
      table={<ChartTable data={rows} category="month" categoryLabel="Month" />}
    >
      <BarChart data={rows} margin={{ top: 20 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="month"
          tickFormatter={short}
          tickLine={false}
          axisLine={false}
        />
        <ChartTooltip />
        <ChartLegend />
        <Bar
          dataKey="desktop"
          stackId="visitors"
          fill={chartFill("desktop")}
          radius={[0, 0, 4, 4]}
        />
        <Bar
          dataKey="mobile"
          stackId="visitors"
          fill={chartFill("mobile")}
          radius={[4, 4, 0, 0]}
        >
          <LabelList dataKey="total" position="top" offset={8} />
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
