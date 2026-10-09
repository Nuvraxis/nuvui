"use client";

import {
  type ChartConfig,
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
  CartesianGrid,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
} from "recharts";

const data = [
  { month: "Jan", spend: 38, budget: 45 },
  { month: "Feb", spend: 42, budget: 45 },
  { month: "Mar", spend: 47, budget: 45 },
  { month: "Apr", spend: 44, budget: 50 },
  { month: "May", spend: 52, budget: 50 },
  { month: "Jun", spend: 49, budget: 50 },
];

const config = {
  spend: { label: "Spend" },
  budget: { label: "Budget", dash: "dashed" },
} satisfies ChartConfig;

const thousands = (value: number | string) => `$${value}k`;

export default function Chart() {
  return (
    <ChartContainer
      config={config}
      aria-label="Cloud spend against budget by month, in thousands of dollars"
      formatValue={thousands}
      table={<ChartTable data={data} category="month" categoryLabel="Month" />}
    >
      <ComposedChart data={data} margin={{ right: 12 }}>
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
          width={44}
          tickFormatter={thousands}
        />
        <ChartTooltip />
        <ChartLegend />
        <Area
          dataKey="spend"
          type="monotone"
          fill={chartFill("spend")}
          fillOpacity={0.25}
          stroke={chartColor("spend")}
          strokeWidth={2}
        />
        {/* The budget changes on a date, so its line moves in steps. */}
        <Line
          dataKey="budget"
          type="stepAfter"
          stroke={chartColor("budget")}
          strokeDasharray={chartDash("budget")}
          strokeWidth={2}
          dot={false}
        />
      </ComposedChart>
    </ChartContainer>
  );
}
