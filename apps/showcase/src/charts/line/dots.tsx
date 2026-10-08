"use client";

import {
  type ChartConfig,
  ChartContainer,
  ChartTable,
  ChartTooltip,
  chartColor,
} from "@nuvui/charts";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

const data = [
  { day: "Mon", deploys: 4 },
  { day: "Tue", deploys: 7 },
  { day: "Wed", deploys: 5 },
  { day: "Thu", deploys: 9 },
  { day: "Fri", deploys: 6 },
  { day: "Sat", deploys: 1 },
  { day: "Sun", deploys: 2 },
];

const config = {
  deploys: { label: "Deploys" },
} satisfies ChartConfig;

export default function Chart() {
  return (
    <ChartContainer
      config={config}
      aria-label="Deploys by day of the week"
      table={<ChartTable data={data} category="day" categoryLabel="Day" />}
    >
      <LineChart data={data} margin={{ top: 8, right: 12 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={8} />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={24}
          allowDecimals={false}
        />
        <ChartTooltip indicator="line" />
        <Line
          dataKey="deploys"
          type="linear"
          stroke={chartColor("deploys")}
          strokeWidth={2}
          dot={{ r: 4, fill: chartColor("deploys") }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ChartContainer>
  );
}
