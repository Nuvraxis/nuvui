"use client";

import {
  type ChartConfig,
  ChartContainer,
  ChartTable,
  ChartTooltip,
  chartColor,
  chartDash,
} from "@nuvui/charts";
import { CartesianGrid, Line, LineChart, XAxis } from "recharts";

const data = [
  { month: "Jan", running: 186, cycling: 80 },
  { month: "Feb", running: 305, cycling: 200 },
  { month: "Mar", running: 237, cycling: 120 },
  { month: "Apr", running: 173, cycling: 190 },
  { month: "May", running: 209, cycling: 130 },
  { month: "Jun", running: 214, cycling: 140 },
];

const config = {
  running: { label: "Running" },
  cycling: { label: "Cycling", dash: "dashed" },
} satisfies ChartConfig;

export default function Chart() {
  return (
    <ChartContainer
      config={config}
      aria-label="Activities logged by month, running and cycling"
      table={<ChartTable data={data} category="month" categoryLabel="Month" />}
    >
      <LineChart data={data} margin={{ left: 12, right: 12 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="month" tickLine={false} axisLine={false} />
        {/* The sample next to each name is a line, dashed where the
            series' own line is. */}
        <ChartTooltip indicator="line" />
        <Line
          dataKey="running"
          type="monotone"
          stroke={chartColor("running")}
          strokeDasharray={chartDash("running")}
          strokeWidth={2}
          dot={false}
        />
        <Line
          dataKey="cycling"
          type="monotone"
          stroke={chartColor("cycling")}
          strokeDasharray={chartDash("cycling")}
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ChartContainer>
  );
}
