"use client";

import {
  type ChartConfig,
  ChartContainer,
  ChartTable,
  ChartTooltip,
  chartFill,
} from "@nuvui/charts";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";

const data = [
  { month: "Jan", running: 186, cycling: 80 },
  { month: "Feb", running: 305, cycling: 200 },
  { month: "Mar", running: 237, cycling: 120 },
  { month: "Apr", running: 173, cycling: 190 },
  { month: "May", running: 209, cycling: 130 },
  { month: "Jun", running: 214, cycling: 140 },
];

const config = {
  running: { label: "Running" },
  cycling: { label: "Cycling" },
} satisfies ChartConfig;

export default function Chart() {
  return (
    <ChartContainer
      config={config}
      aria-label="Activities logged by month, running and cycling"
      table={<ChartTable data={data} category="month" categoryLabel="Month" />}
    >
      <BarChart data={data}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="month" tickLine={false} axisLine={false} />
        {/* As it comes: the point's name, then a square, a name and a
            value for each series. */}
        <ChartTooltip />
        <Bar
          dataKey="running"
          stackId="activities"
          fill={chartFill("running")}
          radius={[0, 0, 4, 4]}
        />
        <Bar
          dataKey="cycling"
          stackId="activities"
          fill={chartFill("cycling")}
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ChartContainer>
  );
}
