"use client";

import {
  ChartContainer,
  ChartLegend,
  ChartTable,
  ChartTooltip,
  chartFill,
} from "@nuvui/charts";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import { short, visitors, visitorsConfig } from "./data";

export default function Example() {
  return (
    <ChartContainer
      config={visitorsConfig}
      aria-label="Visitors by month, on desktop and mobile"
      table={
        <ChartTable data={visitors} category="month" categoryLabel="Month" />
      }
    >
      <BarChart data={visitors}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="month"
          tickFormatter={short}
          tickLine={false}
          axisLine={false}
        />
        <ChartTooltip />
        <ChartLegend />
        <Bar dataKey="desktop" fill={chartFill("desktop")} radius={4} />
        <Bar dataKey="mobile" fill={chartFill("mobile")} radius={4} />
      </BarChart>
    </ChartContainer>
  );
}
