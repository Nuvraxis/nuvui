"use client";

import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartTable,
  ChartTooltip,
  chartFill,
} from "@nuvui/charts";
import { Bar, BarChart, CartesianGrid, LabelList, XAxis } from "recharts";

const months = [
  { month: "Jan", renewals: 186, newDeals: 80 },
  { month: "Feb", renewals: 205, newDeals: 120 },
  { month: "Mar", renewals: 237, newDeals: 96 },
  { month: "Apr", renewals: 173, newDeals: 140 },
  { month: "May", renewals: 209, newDeals: 130 },
  { month: "Jun", renewals: 214, newDeals: 165 },
];

const config = {
  renewals: { label: "Renewals" },
  newDeals: { label: "New deals" },
  total: { label: "Total" },
} satisfies ChartConfig;

// The total goes on top of each stack, so it's a field of the row.
const data = months.map((row) => ({
  ...row,
  total: row.renewals + row.newDeals,
}));

// Any value, because the labels on the bars may have none to show.
const thousands = (value: unknown) => `$${value}k`;

export default function Chart() {
  return (
    <ChartContainer
      config={config}
      aria-label="Bookings by month in thousands of dollars, renewals and new deals stacked, with totals"
      formatValue={thousands}
      table={<ChartTable data={data} category="month" categoryLabel="Month" />}
    >
      <BarChart data={data} margin={{ top: 24 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="month" tickLine={false} axisLine={false} />
        <ChartTooltip />
        <ChartLegend />
        <Bar
          dataKey="renewals"
          stackId="bookings"
          fill={chartFill("renewals")}
          radius={[0, 0, 4, 4]}
        />
        <Bar
          dataKey="newDeals"
          stackId="bookings"
          fill={chartFill("newDeals")}
          radius={[4, 4, 0, 0]}
        >
          <LabelList
            dataKey="total"
            position="top"
            offset={8}
            formatter={thousands}
          />
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
