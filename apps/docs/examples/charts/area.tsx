"use client";

import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  chartColor,
  chartFill,
} from "@nuvui/charts";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import { short, visitors } from "./data";

const config = {
  desktop: { label: "Desktop" },
} satisfies ChartConfig;

export default function Example() {
  return (
    <ChartContainer config={config} aria-label="Desktop visitors by month">
      <AreaChart data={visitors} margin={{ left: 12, right: 12 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="month"
          tickFormatter={short}
          tickLine={false}
          axisLine={false}
        />
        <ChartTooltip indicator="line" />
        <Area
          dataKey="desktop"
          type="natural"
          fill={chartFill("desktop")}
          fillOpacity={0.4}
          stroke={chartColor("desktop")}
          strokeWidth={2}
        />
      </AreaChart>
    </ChartContainer>
  );
}
