"use client";

import {
  ChartContainer,
  ChartLegend,
  ChartTable,
  ChartTooltip,
  chartColor,
  chartDash,
  chartFill,
} from "@nuvui/charts";
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
} from "recharts";
import {
  channels,
  channelsConfig,
  money,
  months,
  revenueConfig,
  short,
} from "./data";

export function RevenueChart() {
  return (
    <ChartContainer
      config={revenueConfig}
      aria-label="Revenue by month against target, November to October"
      className="site-dashboard__chart"
      formatValue={money}
      table={
        <ChartTable data={months} category="month" categoryLabel="Month" />
      }
    >
      <ComposedChart data={months} margin={{ left: 0, right: 8, top: 8 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="month" tickLine={false} axisLine={false} />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={44}
          tickFormatter={short}
        />
        <ChartTooltip />
        <ChartLegend />
        <Area
          dataKey="revenue"
          type="monotone"
          fill={chartFill("revenue")}
          fillOpacity={0.25}
          stroke={chartColor("revenue")}
          strokeWidth={2}
        />
        <Line
          dataKey="target"
          type="monotone"
          stroke={chartColor("target")}
          strokeDasharray={chartDash("target")}
          strokeWidth={2}
          dot={false}
        />
      </ComposedChart>
    </ChartContainer>
  );
}

export function ChannelsChart() {
  return (
    <ChartContainer
      config={channelsConfig}
      aria-label="Orders and returns by channel in October"
      className="site-dashboard__chart"
      table={
        <ChartTable
          data={channels}
          category="channel"
          categoryLabel="Channel"
        />
      }
    >
      <BarChart data={channels} margin={{ top: 8 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="channel" tickLine={false} axisLine={false} />
        <ChartTooltip />
        <ChartLegend />
        <Bar dataKey="orders" fill={chartFill("orders")} radius={4} />
        <Bar dataKey="returns" fill={chartFill("returns")} radius={4} />
      </BarChart>
    </ChartContainer>
  );
}
