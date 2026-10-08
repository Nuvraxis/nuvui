"use client";

import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartTable,
  ChartTooltip,
  chartFill,
} from "@nuvui/charts";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";

const data = [
  { quarter: "Q1", opened: 412, closed: 388 },
  { quarter: "Q2", opened: 465, closed: 471 },
  { quarter: "Q3", opened: 398, closed: 420 },
  { quarter: "Q4", opened: 510, closed: 476 },
];

const config = {
  opened: { label: "Opened" },
  closed: { label: "Closed" },
} satisfies ChartConfig;

export default function Chart() {
  return (
    <ChartContainer
      config={config}
      aria-label="Support tickets opened and closed, by quarter"
      table={
        <ChartTable data={data} category="quarter" categoryLabel="Quarter" />
      }
    >
      <BarChart data={data}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="quarter" tickLine={false} axisLine={false} />
        <ChartTooltip />
        <ChartLegend />
        <Bar dataKey="opened" fill={chartFill("opened")} radius={4} />
        <Bar dataKey="closed" fill={chartFill("closed")} radius={4} />
      </BarChart>
    </ChartContainer>
  );
}
