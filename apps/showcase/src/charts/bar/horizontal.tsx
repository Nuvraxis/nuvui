"use client";

import {
  type ChartConfig,
  ChartContainer,
  ChartTable,
  ChartTooltip,
  chartFill,
} from "@nuvui/charts";
import { Bar, BarChart, LabelList, XAxis, YAxis } from "recharts";

const data = [
  { region: "North America", revenue: 482 },
  { region: "Europe", revenue: 391 },
  { region: "Asia Pacific", revenue: 264 },
  { region: "Latin America", revenue: 118 },
  { region: "Middle East", revenue: 76 },
];

const config = {
  revenue: { label: "Revenue" },
} satisfies ChartConfig;

// Any value, because the labels on the bars may have none to show.
const thousands = (value: unknown) => `$${value}k`;

export default function Chart() {
  return (
    <ChartContainer
      config={config}
      aria-label="Revenue by region, in thousands of dollars"
      formatValue={thousands}
      table={
        <ChartTable data={data} category="region" categoryLabel="Region" />
      }
    >
      <BarChart data={data} layout="vertical" margin={{ right: 48 }}>
        <XAxis type="number" dataKey="revenue" domain={[0, "dataMax"]} hide />
        <YAxis
          type="category"
          dataKey="region"
          tickLine={false}
          axisLine={false}
          width={96}
        />
        <ChartTooltip cursor={false} />
        <Bar dataKey="revenue" fill={chartFill("revenue")} radius={4}>
          <LabelList
            dataKey="revenue"
            position="right"
            offset={8}
            formatter={thousands}
          />
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
