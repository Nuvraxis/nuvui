"use client";

import {
  ChartContainer,
  ChartLegend,
  ChartTable,
  ChartTooltip,
  chartColor,
  chartFill,
} from "@nuvui/charts";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import { short, visitors, visitorsConfig } from "./data";

export default function Example() {
  return (
    <ChartContainer
      config={visitorsConfig}
      aria-label="Visitors by month, desktop and mobile stacked"
      table={
        <ChartTable data={visitors} category="month" categoryLabel="Month" />
      }
    >
      <AreaChart data={visitors} margin={{ left: 12, right: 12 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="month"
          tickFormatter={short}
          tickLine={false}
          axisLine={false}
        />
        <ChartTooltip />
        <ChartLegend />
        <Area
          dataKey="mobile"
          type="natural"
          stackId="visitors"
          fill={chartFill("mobile")}
          fillOpacity={0.4}
          stroke={chartColor("mobile")}
        />
        <Area
          dataKey="desktop"
          type="natural"
          stackId="visitors"
          fill={chartFill("desktop")}
          fillOpacity={0.4}
          stroke={chartColor("desktop")}
        />
      </AreaChart>
    </ChartContainer>
  );
}
