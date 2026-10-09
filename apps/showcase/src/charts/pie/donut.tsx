"use client";

import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartTable,
  ChartTooltip,
  chartFill,
} from "@nuvui/charts";
import { Label, Pie, PieChart } from "recharts";

const data = [
  { plan: "starter", accounts: 412 },
  { plan: "team", accounts: 268 },
  { plan: "business", accounts: 141 },
  { plan: "enterprise", accounts: 39 },
];

const config = {
  starter: { label: "Starter" },
  team: { label: "Team" },
  business: { label: "Business" },
  enterprise: { label: "Enterprise" },
  accounts: { label: "Accounts" },
} satisfies ChartConfig;

const label = (plan: number | string) =>
  config[plan as keyof typeof config]?.label ?? plan;

const slices = data.map((row) => ({ ...row, fill: chartFill(row.plan) }));
const total = data.reduce((sum, row) => sum + row.accounts, 0);

export default function Chart() {
  return (
    <ChartContainer
      config={config}
      aria-label={`Accounts by plan, ${total} in all`}
      table={
        <ChartTable
          data={data}
          category="plan"
          categoryLabel="Plan"
          series={["accounts"]}
          formatCategory={label}
        />
      }
    >
      <PieChart>
        <ChartTooltip hideLabel />
        <ChartLegend />
        <Pie
          data={slices}
          dataKey="accounts"
          nameKey="plan"
          innerRadius="60%"
          strokeWidth={4}
        >
          <Label
            value={total}
            position="center"
            style={{ fontSize: "1.5rem", fontWeight: 600 }}
          />
        </Pie>
      </PieChart>
    </ChartContainer>
  );
}
