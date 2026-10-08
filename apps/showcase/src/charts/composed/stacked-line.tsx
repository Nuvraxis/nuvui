"use client";

import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartTable,
  ChartTooltip,
  chartColor,
  chartFill,
} from "@nuvui/charts";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
} from "recharts";

const data = [
  { week: "W1", solved: 142, open: 31, hours: 6.2 },
  { week: "W2", solved: 158, open: 24, hours: 5.4 },
  { week: "W3", solved: 131, open: 46, hours: 7.9 },
  { week: "W4", solved: 167, open: 22, hours: 4.8 },
  { week: "W5", solved: 173, open: 19, hours: 4.1 },
];

const config = {
  solved: { label: "Solved" },
  open: { label: "Still open" },
  hours: { label: "Hours to first reply" },
} satisfies ChartConfig;

const format = (value: number | string, key: string) =>
  key === "hours" ? `${value} h` : String(value);

export default function Chart() {
  return (
    <ChartContainer
      config={config}
      aria-label="Tickets solved and still open by week, with the hours to a first reply"
      formatValue={format}
      table={<ChartTable data={data} category="week" categoryLabel="Week" />}
    >
      <ComposedChart data={data}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="week" tickLine={false} axisLine={false} />
        <YAxis yAxisId="tickets" tickLine={false} axisLine={false} width={32} />
        <YAxis
          yAxisId="hours"
          orientation="right"
          tickLine={false}
          axisLine={false}
          width={32}
          domain={[0, 10]}
          tickFormatter={(value) => `${value} h`}
        />
        <ChartTooltip />
        <ChartLegend />
        <Bar
          yAxisId="tickets"
          dataKey="solved"
          stackId="tickets"
          fill={chartFill("solved")}
          radius={[0, 0, 4, 4]}
        />
        <Bar
          yAxisId="tickets"
          dataKey="open"
          stackId="tickets"
          fill={chartFill("open")}
          radius={[4, 4, 0, 0]}
        />
        <Line
          yAxisId="hours"
          dataKey="hours"
          type="monotone"
          stroke={chartColor("hours")}
          strokeWidth={2}
        />
      </ComposedChart>
    </ChartContainer>
  );
}
