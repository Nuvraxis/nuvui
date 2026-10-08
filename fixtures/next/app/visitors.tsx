"use client";

// A chart is drawn in the browser, so it's in a client component. The page,
// a server component, renders it with rows it has as plain data. What the
// server can render is the container and the table of the same numbers.
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartTable,
  ChartTooltip,
  chartFill,
} from "@nuvui/charts";
import { Bar, BarChart, XAxis } from "recharts";

export interface Month {
  month: string;
  desktop: number;
  mobile: number;
}

const config = {
  desktop: { label: "Desktop" },
  mobile: { label: "Mobile" },
} satisfies ChartConfig;

export function Visitors({ months }: { months: Month[] }) {
  return (
    <ChartContainer
      config={config}
      aria-label="Visitors by month"
      table={
        <ChartTable data={months} category="month" categoryLabel="Month" />
      }
    >
      <BarChart data={months}>
        <XAxis dataKey="month" />
        <ChartTooltip />
        <ChartLegend />
        <Bar dataKey="desktop" fill={chartFill("desktop")} />
        <Bar dataKey="mobile" fill={chartFill("mobile")} />
      </BarChart>
    </ChartContainer>
  );
}
