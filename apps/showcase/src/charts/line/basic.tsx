"use client";

import {
  type ChartConfig,
  ChartContainer,
  ChartTable,
  ChartTooltip,
  chartColor,
} from "@nuvui/charts";
import { CartesianGrid, Line, LineChart, XAxis } from "recharts";

const data = [
  { month: "Jan", users: 1860 },
  { month: "Feb", users: 2050 },
  { month: "Mar", users: 2370 },
  { month: "Apr", users: 2280 },
  { month: "May", users: 2690 },
  { month: "Jun", users: 3140 },
];

const config = {
  users: { label: "Active users" },
} satisfies ChartConfig;

export default function Chart() {
  return (
    <ChartContainer
      config={config}
      aria-label="Active users by month, January to June"
      table={<ChartTable data={data} category="month" categoryLabel="Month" />}
    >
      <LineChart data={data} margin={{ left: 12, right: 12 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="month" tickLine={false} axisLine={false} />
        <ChartTooltip indicator="line" />
        <Line
          dataKey="users"
          type="monotone"
          stroke={chartColor("users")}
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ChartContainer>
  );
}
