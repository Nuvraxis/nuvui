"use client";

import {
  type ChartConfig,
  ChartContainer,
  ChartTable,
  ChartTooltip,
  chartFill,
} from "@nuvui/charts";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts";

const target = 95;
const data = [
  { team: "Platform", met: 98.2 },
  { team: "Billing", met: 96.4 },
  { team: "Growth", met: 91.7 },
  { team: "Mobile", met: 94.1 },
  { team: "Data", met: 97.3 },
];

const config = {
  met: { label: "Replies in time" },
} satisfies ChartConfig;

const percent = (value: number | string) => `${value}%`;

export default function Chart() {
  return (
    // The target is in the chart's name too. A line across a picture says
    // nothing to someone who can't see the picture.
    <ChartContainer
      config={config}
      aria-label={`Share of tickets answered in time by team, against a target of ${target} percent`}
      formatValue={percent}
      table={<ChartTable data={data} category="team" categoryLabel="Team" />}
    >
      <BarChart data={data} margin={{ top: 8, right: 56 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="team" tickLine={false} axisLine={false} />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={44}
          domain={[85, 100]}
          ticks={[85, 90, 95, 100]}
          tickFormatter={percent}
        />
        <ChartTooltip />
        <Bar dataKey="met" fill={chartFill("met")} radius={4} />
        <ReferenceLine
          y={target}
          strokeDasharray="6 4"
          label={{ value: "Target", position: "right" }}
        />
      </BarChart>
    </ChartContainer>
  );
}
