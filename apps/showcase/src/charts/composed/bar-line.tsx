"use client";

import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartTable,
  ChartTooltip,
  chartColor,
  chartDash,
  chartFill,
} from "@nuvui/charts";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
} from "recharts";

const data = [
  { quarter: "Q1", revenue: 420, margin: 18 },
  { quarter: "Q2", revenue: 550, margin: 22 },
  { quarter: "Q3", revenue: 610, margin: 27 },
  { quarter: "Q4", revenue: 740, margin: 31 },
];

const config = {
  revenue: { label: "Revenue" },
  margin: { label: "Margin", dash: "dashed" },
} satisfies ChartConfig;

// The two series are in different units, so each is written its own way.
const format = (value: number | string, key: string) =>
  key === "margin" ? `${value}%` : `$${value}k`;

export default function Chart() {
  return (
    <ChartContainer
      config={config}
      aria-label="Revenue in thousands of dollars and margin in percent, by quarter"
      formatValue={format}
      table={
        <ChartTable data={data} category="quarter" categoryLabel="Quarter" />
      }
    >
      <ComposedChart data={data}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="quarter" tickLine={false} axisLine={false} />
        {/* An axis on each side, one for each unit. */}
        <YAxis
          yAxisId="revenue"
          tickLine={false}
          axisLine={false}
          width={48}
          tickFormatter={(value) => `$${value}k`}
        />
        <YAxis
          yAxisId="margin"
          orientation="right"
          tickLine={false}
          axisLine={false}
          width={40}
          domain={[0, 40]}
          tickFormatter={(value) => `${value}%`}
        />
        <ChartTooltip />
        <ChartLegend />
        <Bar
          yAxisId="revenue"
          dataKey="revenue"
          fill={chartFill("revenue")}
          radius={4}
        />
        <Line
          yAxisId="margin"
          dataKey="margin"
          stroke={chartColor("margin")}
          strokeDasharray={chartDash("margin")}
          strokeWidth={2}
          dot={false}
        />
      </ComposedChart>
    </ChartContainer>
  );
}
