"use client";

import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  chartColor,
} from "@nuvui/charts";
import { useId } from "react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import { short, visitors } from "./data";

const config = {
  mobile: { label: "Mobile", color: "var(--color-chart-3)" },
} satisfies ChartConfig;

export default function Example() {
  // Ids are shared by the whole page, so each chart needs its own.
  const gradient = useId();

  return (
    <ChartContainer config={config} aria-label="Mobile visitors by month">
      <AreaChart data={visitors} margin={{ left: 12, right: 12 }}>
        <defs>
          <linearGradient id={gradient} x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="5%"
              stopColor={chartColor("mobile")}
              stopOpacity={0.6}
            />
            <stop
              offset="95%"
              stopColor={chartColor("mobile")}
              stopOpacity={0.05}
            />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="month"
          tickFormatter={short}
          tickLine={false}
          axisLine={false}
        />
        <ChartTooltip indicator="line" />
        <Area
          dataKey="mobile"
          type="natural"
          fill={`url(#${gradient})`}
          fillOpacity={1}
          stroke={chartColor("mobile")}
          strokeWidth={2}
        />
      </AreaChart>
    </ChartContainer>
  );
}
