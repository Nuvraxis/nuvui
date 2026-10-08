"use client";

import {
  type ChartConfig,
  ChartContainer,
  ChartTable,
  ChartTooltip,
  chartColor,
  chartFill,
} from "@nuvui/charts";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

// A count that holds until it changes, so the line moves in steps.
const data = [
  { month: "Jan", seats: 40 },
  { month: "Feb", seats: 40 },
  { month: "Mar", seats: 55 },
  { month: "Apr", seats: 55 },
  { month: "May", seats: 80 },
  { month: "Jun", seats: 95 },
];

const config = {
  seats: { label: "Seats" },
} satisfies ChartConfig;

export default function Chart() {
  return (
    <ChartContainer
      config={config}
      aria-label="Licensed seats by month, January to June"
      table={<ChartTable data={data} category="month" categoryLabel="Month" />}
    >
      <AreaChart data={data} margin={{ right: 12 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="month"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
        />
        <YAxis tickLine={false} axisLine={false} width={32} />
        <ChartTooltip indicator="line" />
        <Area
          dataKey="seats"
          type="stepAfter"
          fill={chartFill("seats")}
          fillOpacity={0.3}
          stroke={chartColor("seats")}
          strokeWidth={2}
        />
      </AreaChart>
    </ChartContainer>
  );
}
