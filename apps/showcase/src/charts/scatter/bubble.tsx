"use client";

import {
  type ChartConfig,
  ChartContainer,
  ChartTable,
  ChartTooltip,
  chartFill,
} from "@nuvui/charts";
import {
  CartesianGrid,
  Scatter,
  ScatterChart,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";

const data = [
  { account: "Northwind", usage: 34, health: 62, revenue: 48 },
  { account: "Contoso", usage: 71, health: 88, revenue: 132 },
  { account: "Fabrikam", usage: 52, health: 45, revenue: 76 },
  { account: "Tailspin", usage: 86, health: 79, revenue: 210 },
  { account: "Litware", usage: 23, health: 38, revenue: 29 },
  { account: "Adatum", usage: 64, health: 71, revenue: 95 },
];

const config = {
  usage: { label: "Seats in use" },
  health: { label: "Health score" },
  revenue: { label: "Revenue" },
} satisfies ChartConfig;

// Three measures, each in its own unit.
const format = (value: number | string, key: string) =>
  key === "revenue" ? `$${value}k` : key === "usage" ? `${value}%` : value;

export default function Chart() {
  return (
    <ChartContainer
      config={config}
      aria-label="Accounts by seats in use and health score, sized by revenue"
      formatValue={format}
      table={
        <ChartTable data={data} category="account" categoryLabel="Account" />
      }
    >
      <ScatterChart margin={{ top: 16, right: 16, bottom: 20 }}>
        <CartesianGrid />
        <XAxis
          type="number"
          dataKey="usage"
          name="usage"
          domain={[0, 100]}
          tickLine={false}
          tickFormatter={(value) => `${value}%`}
          label={{
            value: "Seats in use",
            position: "insideBottom",
            offset: -12,
          }}
        />
        <YAxis
          type="number"
          dataKey="health"
          name="health"
          domain={[0, 100]}
          tickLine={false}
          width={32}
        />
        {/* The third measure is the size of the dot. */}
        <ZAxis
          type="number"
          dataKey="revenue"
          name="revenue"
          range={[80, 700]}
        />
        <ChartTooltip hideLabel />
        <Scatter data={data} fill={chartFill("revenue")} fillOpacity={0.7} />
      </ScatterChart>
    </ChartContainer>
  );
}
