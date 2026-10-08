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
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

const data = [
  { month: "Jan", direct: 420, search: 310, referral: 150 },
  { month: "Feb", direct: 460, search: 380, referral: 140 },
  { month: "Mar", direct: 440, search: 450, referral: 190 },
  { month: "Apr", direct: 480, search: 520, referral: 230 },
  { month: "May", direct: 470, search: 610, referral: 260 },
  { month: "Jun", direct: 510, search: 690, referral: 250 },
];

const config = {
  direct: { label: "Direct" },
  search: { label: "Search" },
  referral: { label: "Referral" },
} satisfies ChartConfig;

const series = Object.keys(config);

export default function Chart() {
  return (
    <ChartContainer
      config={config}
      aria-label="Share of visits by source and month"
      table={<ChartTable data={data} category="month" categoryLabel="Month" />}
    >
      {/* Each month is stretched to the full height, so the bands show
          shares. The tooltip and the table keep the counts. */}
      <AreaChart data={data} stackOffset="expand" margin={{ right: 12 }}>
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
          width={40}
          tickFormatter={(share) => `${Math.round(share * 100)}%`}
        />
        <ChartTooltip />
        <ChartLegend />
        {series.map((key) => (
          <Area
            key={key}
            dataKey={key}
            type="monotone"
            stackId="visits"
            fill={chartFill(key)}
            fillOpacity={0.5}
            stroke={chartColor(key)}
          />
        ))}
      </AreaChart>
    </ChartContainer>
  );
}
