"use client";

import {
  type ChartConfig,
  ChartContainer,
  ChartTable,
  ChartTooltip,
  chartColor,
  chartFill,
} from "@nuvui/charts";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";

const data = [
  { month: "Jan", signups: 186 },
  { month: "Feb", signups: 305 },
  { month: "Mar", signups: 237 },
  { month: "Apr", signups: 173 },
  { month: "May", signups: 209 },
  { month: "Jun", signups: 264 },
];

const config = {
  signups: { label: "Sign-ups" },
} satisfies ChartConfig;

export default function Chart() {
  return (
    <ChartContainer
      config={config}
      aria-label="Sign-ups by month, January to June"
      table={<ChartTable data={data} category="month" categoryLabel="Month" />}
    >
      <AreaChart data={data} margin={{ left: 12, right: 12 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="month" tickLine={false} axisLine={false} />
        <ChartTooltip indicator="line" />
        <Area
          dataKey="signups"
          type="monotone"
          fill={chartFill("signups")}
          fillOpacity={0.3}
          stroke={chartColor("signups")}
          strokeWidth={2}
        />
      </AreaChart>
    </ChartContainer>
  );
}
