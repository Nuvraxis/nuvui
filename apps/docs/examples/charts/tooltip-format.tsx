"use client";

import {
  ChartContainer,
  ChartTable,
  ChartTooltip,
  chartFill,
} from "@nuvui/charts";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import { short, visitors, visitorsConfig } from "./data";

// Made once, with the locale written out. A formatter that takes the
// browser's locale would write the table differently on the server.
const number = new Intl.NumberFormat("en-US");
const rows = visitors.map((row) => ({
  ...row,
  desktop: row.desktop * 1250,
  mobile: row.mobile * 1250,
}));

export default function Example() {
  return (
    <ChartContainer
      config={visitorsConfig}
      aria-label="Visitors by month"
      formatValue={(value) => number.format(Number(value))}
      table={<ChartTable data={rows} category="month" categoryLabel="Month" />}
    >
      <BarChart data={rows}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="month"
          tickFormatter={short}
          tickLine={false}
          axisLine={false}
        />
        <ChartTooltip labelFormatter={(label) => `${label} 2026`} />
        <Bar dataKey="desktop" fill={chartFill("desktop")} radius={4} />
        <Bar dataKey="mobile" fill={chartFill("mobile")} radius={4} />
      </BarChart>
    </ChartContainer>
  );
}
