"use client";

import {
  ChartContainer,
  ChartLegend,
  ChartTable,
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
      aria-label="Visitors by month, on desktop and mobile"
      table={
        <ChartTable data={visitors} category="month" categoryLabel="Month" />
      }
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
        <ChartLegend indicator="line" />
        <Line
          dataKey="desktop"
          type="monotone"
          stroke={chartColor("desktop")}
          strokeDasharray={chartDash("desktop")}
          strokeWidth={2}
          dot={false}
        />
        <Line
          dataKey="mobile"
          type="monotone"
          stroke={chartColor("mobile")}
          strokeDasharray={chartDash("mobile")}
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ChartContainer>
  );
}
