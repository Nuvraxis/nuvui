"use client";

import {
  type ChartConfig,
  ChartContainer,
  ChartTable,
  ChartTooltip,
  chartFill,
} from "@nuvui/charts";
import { CartesianGrid, Scatter, ScatterChart, XAxis, YAxis } from "recharts";

const data = [
  { size: 12, minutes: 4 },
  { size: 28, minutes: 7 },
  { size: 35, minutes: 6 },
  { size: 51, minutes: 11 },
  { size: 64, minutes: 14 },
  { size: 80, minutes: 13 },
  { size: 97, minutes: 19 },
  { size: 120, minutes: 24 },
  { size: 138, minutes: 22 },
  { size: 160, minutes: 31 },
];

const config = {
  size: { label: "Files changed" },
  minutes: { label: "Minutes to build" },
} satisfies ChartConfig;

export default function Chart() {
  return (
    <ChartContainer
      config={config}
      aria-label="Build time against the number of files changed, for ten builds"
      table={
        <ChartTable
          data={data}
          category="size"
          categoryLabel="Files changed"
          series={["minutes"]}
        />
      }
    >
      <ScatterChart margin={{ top: 8, right: 12, bottom: 20 }}>
        <CartesianGrid />
        <XAxis
          type="number"
          dataKey="size"
          name="Files changed"
          tickLine={false}
          label={{
            value: "Files changed",
            position: "insideBottom",
            offset: -12,
          }}
        />
        <YAxis
          type="number"
          dataKey="minutes"
          name="Minutes to build"
          tickLine={false}
          width={32}
        />
        <ChartTooltip hideLabel />
        <Scatter data={data} fill={chartFill("minutes")} />
      </ScatterChart>
    </ChartContainer>
  );
}
