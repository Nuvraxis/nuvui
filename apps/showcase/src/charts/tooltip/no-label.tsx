"use client";

import {
  type ChartConfig,
  ChartContainer,
  ChartTable,
  ChartTooltip,
  chartFill,
} from "@nuvui/charts";
import { Bar, BarChart, XAxis, YAxis } from "recharts";

const data = [
  { page: "pricing", views: 4820 },
  { page: "docs", views: 3910 },
  { page: "blog", views: 2640 },
  { page: "careers", views: 1180 },
];

const config = {
  pricing: { label: "Pricing" },
  docs: { label: "Docs" },
  blog: { label: "Blog" },
  careers: { label: "Careers" },
  views: { label: "Views" },
} satisfies ChartConfig;

const label = (page: number | string) =>
  config[page as keyof typeof config]?.label ?? page;

const rows = data.map((row) => ({ ...row, fill: chartFill(row.page) }));

export default function Chart() {
  return (
    <ChartContainer
      config={config}
      aria-label="Page views by page this week"
      table={
        <ChartTable
          data={data}
          category="page"
          categoryLabel="Page"
          series={["views"]}
          formatCategory={label}
        />
      }
    >
      <BarChart data={rows} layout="vertical">
        <XAxis type="number" dataKey="views" hide />
        <YAxis
          type="category"
          dataKey="page"
          tickFormatter={label}
          tickLine={false}
          axisLine={false}
          width={64}
        />
        {/* Each row names itself, so the line that says which point this
            is would say it twice. */}
        <ChartTooltip hideLabel nameKey="page" cursor={false} />
        <Bar dataKey="views" radius={4} />
      </BarChart>
    </ChartContainer>
  );
}
