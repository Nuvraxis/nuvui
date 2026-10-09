"use client";

import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartTable,
  ChartTooltip,
  chartFill,
} from "@nuvui/charts";
import { Pie, PieChart } from "recharts";

const data = [
  { channel: "email", tickets: 342 },
  { channel: "chat", tickets: 281 },
  { channel: "phone", tickets: 124 },
  { channel: "portal", tickets: 97 },
];

const config = {
  email: { label: "Email" },
  chat: { label: "Chat" },
  phone: { label: "Phone" },
  portal: { label: "Portal" },
  tickets: { label: "Tickets" },
} satisfies ChartConfig;

const label = (channel: number | string) =>
  config[channel as keyof typeof config]?.label ?? channel;

const slices = data.map((row) => ({ ...row, fill: chartFill(row.channel) }));

export default function Chart() {
  return (
    // With `patterns`, each slice has a fill of its own, so the four can be
    // told apart without their colors, and in print.
    <ChartContainer
      config={config}
      aria-label="Support tickets by channel"
      patterns
      table={
        <ChartTable
          data={data}
          category="channel"
          categoryLabel="Channel"
          series={["tickets"]}
          formatCategory={label}
        />
      }
    >
      <PieChart>
        <ChartTooltip hideLabel />
        <ChartLegend />
        <Pie data={slices} dataKey="tickets" nameKey="channel" />
      </PieChart>
    </ChartContainer>
  );
}
