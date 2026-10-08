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

const data = [
  { month: "Jan", api: 182, web: 240, mobile: 310 },
  { month: "Feb", api: 176, web: 228, mobile: 334 },
  { month: "Mar", api: 190, web: 251, mobile: 298 },
  { month: "Apr", api: 168, web: 219, mobile: 286 },
  { month: "May", api: 161, web: 232, mobile: 301 },
  { month: "Jun", api: 154, web: 214, mobile: 279 },
];

const config = {
  api: { label: "API" },
  web: { label: "Web" },
  mobile: { label: "Mobile" },
} satisfies ChartConfig;

const series = Object.keys(config);

export default function Chart() {
  return (
    // With `patterns`, each line has dashes of its own, so the three can be
    // told apart without their colors.
    <ChartContainer
      config={config}
      aria-label="Median response time by client and month, in milliseconds"
      patterns
      formatValue={(value) => `${value} ms`}
      table={<ChartTable data={data} category="month" categoryLabel="Month" />}
    >
      <LineChart data={data} margin={{ right: 12 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="month"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
        />
        <YAxis tickLine={false} axisLine={false} width={32} />
        <ChartTooltip indicator="line" />
        <ChartLegend indicator="line" />
        {series.map((key) => (
          <Line
            key={key}
            dataKey={key}
            type="monotone"
            stroke={chartColor(key)}
            strokeDasharray={chartDash(key)}
            strokeWidth={2}
            dot={false}
          />
        ))}
      </LineChart>
    </ChartContainer>
  );
}
