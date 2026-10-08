"use client";

import {
  type ChartConfig,
  ChartContainer,
  ChartTable,
  ChartTooltip,
  chartColor,
} from "@nuvui/charts";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

// A price holds until it's changed, so the line moves in steps.
const data = [
  { month: "Jan", price: 29 },
  { month: "Feb", price: 29 },
  { month: "Mar", price: 35 },
  { month: "Apr", price: 35 },
  { month: "May", price: 35 },
  { month: "Jun", price: 39 },
];

const config = {
  price: { label: "Price per seat" },
} satisfies ChartConfig;

const dollars = (value: number | string) => `$${value}`;

export default function Chart() {
  return (
    <ChartContainer
      config={config}
      aria-label="Price per seat by month, January to June"
      formatValue={dollars}
      table={<ChartTable data={data} category="month" categoryLabel="Month" />}
    >
      <LineChart data={data} margin={{ top: 8, right: 12 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="month"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={36}
          domain={[20, 45]}
          ticks={[20, 25, 30, 35, 40, 45]}
          tickFormatter={dollars}
        />
        <ChartTooltip indicator="line" />
        <Line
          dataKey="price"
          type="stepAfter"
          stroke={chartColor("price")}
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ChartContainer>
  );
}
