"use client";

import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartTable,
  ChartTooltip,
  chartColor,
  chartFill,
} from "@nuvui/charts";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";

const data = [
  { month: "Jan", desktop: 186, mobile: 80 },
  { month: "Feb", desktop: 305, mobile: 200 },
  { month: "Mar", desktop: 237, mobile: 120 },
  { month: "Apr", desktop: 173, mobile: 190 },
  { month: "May", desktop: 209, mobile: 130 },
  { month: "Jun", desktop: 214, mobile: 140 },
];

const config = {
  desktop: { label: "Desktop" },
  mobile: { label: "Mobile" },
} satisfies ChartConfig;

export default function Chart() {
  return (
    <ChartContainer
      config={config}
      aria-label="Visitors by month, desktop and mobile stacked"
      table={<ChartTable data={data} category="month" categoryLabel="Month" />}
    >
      <AreaChart data={data} margin={{ left: 12, right: 12 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="month" tickLine={false} axisLine={false} />
        <ChartTooltip />
        <ChartLegend />
        <Area
          dataKey="desktop"
          type="monotone"
          stackId="visitors"
          fill={chartFill("desktop")}
          fillOpacity={0.4}
          stroke={chartColor("desktop")}
        />
        <Area
          dataKey="mobile"
          type="monotone"
          stackId="visitors"
          fill={chartFill("mobile")}
          fillOpacity={0.4}
          stroke={chartColor("mobile")}
        />
      </AreaChart>
    </ChartContainer>
  );
}
