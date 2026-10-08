"use client";

import {
  type ChartConfig,
  ChartContainer,
  ChartTable,
  ChartTooltip,
  chartFill,
} from "@nuvui/charts";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";

const data = [
  { month: "Jan", licenses: 232500, services: 100000 },
  { month: "Feb", licenses: 381250, services: 250000 },
  { month: "Mar", licenses: 296250, services: 150000 },
  { month: "Apr", licenses: 216250, services: 237500 },
  { month: "May", licenses: 261250, services: 162500 },
  { month: "Jun", licenses: 267500, services: 175000 },
];

const config = {
  licenses: { label: "Licenses" },
  services: { label: "Services" },
} satisfies ChartConfig;

// Made once, with the locale written out. A formatter that takes the
// browser's locale would write the table differently on the server.
const dollars = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export default function Chart() {
  return (
    // `formatValue` is how a value is written in the tooltip and in the
    // table. `labelFormatter` is Recharts' own, for the point's name.
    <ChartContainer
      config={config}
      aria-label="Revenue by month, from licenses and services"
      formatValue={(value) => dollars.format(Number(value))}
      table={<ChartTable data={data} category="month" categoryLabel="Month" />}
    >
      <BarChart data={data}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="month" tickLine={false} axisLine={false} />
        <ChartTooltip labelFormatter={(month) => `${month} 2026`} />
        <Bar dataKey="licenses" fill={chartFill("licenses")} radius={4} />
        <Bar dataKey="services" fill={chartFill("services")} radius={4} />
      </BarChart>
    </ChartContainer>
  );
}
