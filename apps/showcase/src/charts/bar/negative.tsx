"use client";

import {
  type ChartConfig,
  ChartContainer,
  ChartTable,
  ChartTooltip,
  chartFill,
} from "@nuvui/charts";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts";

const months = [
  { month: "Jan", change: 42 },
  { month: "Feb", change: 18 },
  { month: "Mar", change: -24 },
  { month: "Apr", change: 31 },
  { month: "May", change: -12 },
  { month: "Jun", change: 56 },
];

const config = {
  gained: { label: "Gained" },
  lost: { label: "Lost" },
  change: { label: "Net change" },
} satisfies ChartConfig;

// A bar takes its fill from its row, and the tooltip takes its name from
// the same place.
const data = months.map((row) => {
  const kind = row.change < 0 ? "lost" : "gained";
  return { ...row, kind, fill: chartFill(kind) };
});

export default function Chart() {
  return (
    <ChartContainer
      config={config}
      aria-label="Net change in customers by month"
      table={
        <ChartTable
          data={months}
          category="month"
          categoryLabel="Month"
          series={["change"]}
        />
      }
    >
      <BarChart data={data}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="month" tickLine={false} axisLine={false} />
        <YAxis tickLine={false} axisLine={false} width={32} />
        <ReferenceLine y={0} />
        <ChartTooltip nameKey="kind" />
        <Bar dataKey="change" radius={4} />
      </BarChart>
    </ChartContainer>
  );
}
