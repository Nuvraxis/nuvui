"use client";

import {
  ChartContainer,
  ChartTooltip,
  chartColor,
  chartDash,
} from "@nuvui/charts";
import { CartesianGrid, Line, LineChart, XAxis } from "recharts";
import { short, visitors, visitorsConfig } from "./data";

export default function Example() {
  return (
    <ChartContainer
      config={visitorsConfig}
      aria-label="Visitors by month"
      patterns
    >
      <LineChart data={visitors} margin={{ left: 12, right: 12 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="month"
          tickFormatter={short}
          tickLine={false}
          axisLine={false}
        />
        <ChartTooltip indicator="line" />
        <Line
          dataKey="desktop"
          stroke={chartColor("desktop")}
          strokeDasharray={chartDash("desktop")}
          strokeWidth={2}
        />
        <Line
          dataKey="mobile"
          stroke={chartColor("mobile")}
          strokeDasharray={chartDash("mobile")}
          strokeWidth={2}
        />
      </LineChart>
    </ChartContainer>
  );
}
