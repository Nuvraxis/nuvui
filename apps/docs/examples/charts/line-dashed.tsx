"use client";

import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartTooltip,
  chartColor,
  chartDash,
} from "@nuvui/charts";
import { CartesianGrid, Line, LineChart, XAxis } from "recharts";
import { short, visitors } from "./data";

// The forecast is always dashed, whatever the container is set to.
const config = {
  desktop: { label: "Actual", dash: "solid" },
  mobile: { label: "Forecast", dash: "dashed" },
} satisfies ChartConfig;

export default function Example() {
  return (
    <ChartContainer config={config} aria-label="Actual and forecast visitors">
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
