"use client";

import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartTable,
  ChartTooltip,
  chartColor,
  chartDash,
} from "@nuvui/charts";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

// June is in both, so the two lines meet.
const data = [
  { month: "Mar", actual: 412 },
  { month: "Apr", actual: 438 },
  { month: "May", actual: 467 },
  { month: "Jun", actual: 501, forecast: 501 },
  { month: "Jul", forecast: 530 },
  { month: "Aug", forecast: 562 },
  { month: "Sep", forecast: 590 },
];

// The forecast is always dashed, whatever the container is set to.
const config = {
  actual: { label: "Actual", dash: "solid" },
  forecast: { label: "Forecast", dash: "dashed" },
} satisfies ChartConfig;

const thousands = (value: number | string) => `$${value}k`;

export default function Chart() {
  return (
    <ChartContainer
      config={config}
      aria-label="Monthly recurring revenue, actual to June and forecast to September"
      formatValue={thousands}
      table={<ChartTable data={data} category="month" categoryLabel="Month" />}
    >
      <LineChart data={data} margin={{ top: 8, right: 12 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="month"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={44}
          domain={[350, 650]}
          tickFormatter={thousands}
        />
        <ChartTooltip indicator="line" />
        <ChartLegend indicator="line" />
        <Line
          dataKey="actual"
          type="monotone"
          stroke={chartColor("actual")}
          strokeDasharray={chartDash("actual")}
          strokeWidth={2}
          dot={false}
        />
        <Line
          dataKey="forecast"
          type="monotone"
          stroke={chartColor("forecast")}
          strokeDasharray={chartDash("forecast")}
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ChartContainer>
  );
}
