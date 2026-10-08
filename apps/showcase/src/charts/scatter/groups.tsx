"use client";

import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartTooltip,
  chartFill,
} from "@nuvui/charts";
import { CartesianGrid, Scatter, ScatterChart, XAxis, YAxis } from "recharts";

const startups = [
  { seats: 12, days: 18 },
  { seats: 25, days: 24 },
  { seats: 8, days: 9 },
  { seats: 40, days: 31 },
  { seats: 18, days: 15 },
];
const enterprises = [
  { seats: 220, days: 84 },
  { seats: 340, days: 121 },
  { seats: 150, days: 66 },
  { seats: 480, days: 140 },
];

const config = {
  startup: { label: "Startup" },
  enterprise: { label: "Enterprise" },
} satisfies ChartConfig;

export default function Chart() {
  return (
    <ChartContainer
      config={config}
      aria-label="Days to close a deal against seats sold, for startups and enterprises"
    >
      <ScatterChart margin={{ top: 8, right: 12, bottom: 20 }}>
        <CartesianGrid />
        <XAxis
          type="number"
          dataKey="seats"
          name="Seats"
          tickLine={false}
          label={{ value: "Seats", position: "insideBottom", offset: -12 }}
        />
        <YAxis
          type="number"
          dataKey="days"
          name="Days to close"
          tickLine={false}
          width={40}
        />
        <ChartTooltip hideLabel />
        <ChartLegend verticalAlign="top" />
        {/* A shape for each group, so the two differ by more than color. */}
        <Scatter
          name="startup"
          data={startups}
          fill={chartFill("startup")}
          shape="circle"
        />
        <Scatter
          name="enterprise"
          data={enterprises}
          fill={chartFill("enterprise")}
          shape="diamond"
        />
      </ScatterChart>
    </ChartContainer>
  );
}
