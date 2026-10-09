"use client";

import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartTable,
  ChartTooltip,
  chartFill,
} from "@nuvui/charts";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

const data = [
  { month: "Jan", starter: 120, team: 86, enterprise: 24 },
  { month: "Feb", starter: 132, team: 94, enterprise: 31 },
  { month: "Mar", starter: 128, team: 110, enterprise: 38 },
  { month: "Apr", starter: 141, team: 123, enterprise: 44 },
  { month: "May", starter: 150, team: 131, enterprise: 52 },
  { month: "Jun", starter: 147, team: 148, enterprise: 61 },
];

const config = {
  starter: { label: "Starter" },
  team: { label: "Team" },
  enterprise: { label: "Enterprise" },
} satisfies ChartConfig;

export default function Chart() {
  return (
    <ChartContainer
      config={config}
      aria-label="Active subscriptions by plan and month"
      table={<ChartTable data={data} category="month" categoryLabel="Month" />}
    >
      <BarChart data={data}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="month" tickLine={false} axisLine={false} />
        <YAxis tickLine={false} axisLine={false} width={32} />
        <ChartTooltip />
        <ChartLegend />
        <Bar
          dataKey="starter"
          stackId="plans"
          fill={chartFill("starter")}
          radius={[0, 0, 4, 4]}
        />
        <Bar dataKey="team" stackId="plans" fill={chartFill("team")} />
        <Bar
          dataKey="enterprise"
          stackId="plans"
          fill={chartFill("enterprise")}
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ChartContainer>
  );
}
