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
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts";

const target = 60;
const quarters = [
  { quarter: "Q1", revenue: 42, margin: 18 },
  { quarter: "Q2", revenue: 55, margin: 22 },
  { quarter: "Q3", revenue: 61, margin: 27 },
  { quarter: "Q4", revenue: 74, margin: 31 },
];

const config = {
  revenue: { label: "Revenue" },
  margin: { label: "Margin", dash: "dashed" },
} satisfies ChartConfig;

export default function Example() {
  return (
    <ChartContainer
      config={config}
      aria-label={`Revenue and margin by quarter, against a target of ${target}`}
      formatValue={(value) => `$${value}k`}
      table={
        <ChartTable
          data={quarters}
          category="quarter"
          categoryLabel="Quarter"
        />
      }
    >
      <ComposedChart data={quarters}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="quarter" tickLine={false} axisLine={false} />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={48}
          tickFormatter={(value) => `$${value}k`}
        />
        <ChartTooltip />
        <ChartLegend />
        <Bar dataKey="revenue" fill={chartFill("revenue")} radius={4} />
        <Line
          dataKey="margin"
          stroke={chartColor("margin")}
          strokeDasharray={chartDash("margin")}
          strokeWidth={2}
        />
        <ReferenceLine
          y={target}
          strokeDasharray="2 3"
          label={{ value: `Target $${target}k`, position: "insideTopRight" }}
        />
      </ComposedChart>
    </ChartContainer>
  );
}
