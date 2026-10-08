"use client";

import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartTooltip,
  chartFill,
} from "@nuvui/charts";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import { short, visitors } from "./data";

const config = {
  // A token, so it changes with the theme.
  desktop: { label: "Desktop", color: "var(--color-primary)" },
  // The sixth chart color, out of order.
  mobile: { label: "Mobile", color: "var(--color-chart-6)" },
} satisfies ChartConfig;

export default function Example() {
  return (
    <ChartContainer config={config} aria-label="Visitors by month">
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
