"use client";

import {
  type ChartConfig,
  ChartContainer,
  ChartTable,
  ChartTooltip,
  chartColor,
} from "@nuvui/charts";
import { useId } from "react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";

const data = [
  { week: "W1", sessions: 1240 },
  { week: "W2", sessions: 1480 },
  { week: "W3", sessions: 1390 },
  { week: "W4", sessions: 1720 },
  { week: "W5", sessions: 1650 },
  { week: "W6", sessions: 1980 },
  { week: "W7", sessions: 2140 },
  { week: "W8", sessions: 2060 },
];

const config = {
  sessions: { label: "Sessions" },
} satisfies ChartConfig;

export default function Chart() {
  // Ids are shared by the whole page, so each chart needs its own.
  const gradient = useId();

  return (
    <ChartContainer
      config={config}
      aria-label="Sessions by week, over eight weeks"
      table={<ChartTable data={data} category="week" categoryLabel="Week" />}
    >
      <AreaChart data={data} margin={{ left: 12, right: 12 }}>
        <defs>
          <linearGradient id={gradient} x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="5%"
              stopColor={chartColor("sessions")}
              stopOpacity={0.6}
            />
            <stop
              offset="95%"
              stopColor={chartColor("sessions")}
              stopOpacity={0.05}
            />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="week" tickLine={false} axisLine={false} />
        <ChartTooltip indicator="line" />
        <Area
          dataKey="sessions"
          type="natural"
          fill={`url(#${gradient})`}
          fillOpacity={1}
          stroke={chartColor("sessions")}
          strokeWidth={2}
        />
      </AreaChart>
    </ChartContainer>
  );
}
