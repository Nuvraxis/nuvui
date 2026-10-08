"use client";

import { ChartContainer, ChartTable, chartColor } from "@nuvui/charts";
import { CartesianGrid, Line, LineChart, XAxis } from "recharts";
import { short, visitors, visitorsConfig } from "./data";

export default function Example() {
  return (
    <ChartContainer
      config={visitorsConfig}
      aria-label="Visitors by month"
      table={
        <ChartTable
          data={visitors}
          category="month"
          categoryLabel="Month"
          caption="Visitors by month, January to June"
          visible
        />
      }
    >
      <LineChart data={visitors}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="month"
          tickFormatter={short}
          tickLine={false}
          axisLine={false}
        />
        <Line
          dataKey="desktop"
          stroke={chartColor("desktop")}
          strokeWidth={2}
          dot={false}
        />
        <Line
          dataKey="mobile"
          stroke={chartColor("mobile")}
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ChartContainer>
  );
}
