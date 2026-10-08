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
  { month: "Jan", orders: 186 },
  { month: "Feb", orders: 305 },
  { month: "Mar", orders: 237 },
  { month: "Apr", orders: 173 },
  { month: "May", orders: 209 },
  { month: "Jun", orders: 264 },
];

const config = {
  orders: { label: "Orders" },
} satisfies ChartConfig;

export default function Chart() {
  return (
    <ChartContainer
      config={config}
      aria-label="Orders by month, January to June"
      table={<ChartTable data={data} category="month" categoryLabel="Month" />}
    >
      <BarChart data={data}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="month" tickLine={false} axisLine={false} />
        <ChartTooltip />
        <Bar dataKey="orders" fill={chartFill("orders")} radius={4} />
      </BarChart>
    </ChartContainer>
  );
}
