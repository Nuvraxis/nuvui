"use client";

import {
  type ChartConfig,
  ChartContainer,
  ChartTable,
  ChartTooltip,
  chartFill,
} from "@nuvui/charts";
import { LabelList, Pie, PieChart } from "recharts";

const data = [
  { status: "paid", invoices: 318 },
  { status: "pending", invoices: 96 },
  { status: "overdue", invoices: 41 },
  { status: "draft", invoices: 27 },
];

const config = {
  paid: { label: "Paid" },
  pending: { label: "Pending" },
  overdue: { label: "Overdue" },
  draft: { label: "Draft" },
  invoices: { label: "Invoices" },
} satisfies ChartConfig;

const label = (status: unknown) =>
  config[status as keyof typeof config]?.label ?? String(status);

const slices = data.map((row) => ({ ...row, fill: chartFill(row.status) }));

export default function Chart() {
  return (
    <ChartContainer
      config={config}
      aria-label="Invoices by status"
      table={
        <ChartTable
          data={data}
          category="status"
          categoryLabel="Status"
          series={["invoices"]}
          formatCategory={label}
        />
      }
    >
      <PieChart margin={{ top: 16, bottom: 16 }}>
        <ChartTooltip hideLabel />
        {/* Each slice is named where it is, so there's no legend to look
            back and forth from. */}
        <Pie
          data={slices}
          dataKey="invoices"
          nameKey="status"
          outerRadius="65%"
        >
          <LabelList
            dataKey="status"
            position="outside"
            offset={12}
            formatter={label}
          />
        </Pie>
      </PieChart>
    </ChartContainer>
  );
}
