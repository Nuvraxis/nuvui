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
import { PolarAngleAxis, PolarGrid, Radar, RadarChart } from "recharts";

const data = [
  { area: "Speed", thisYear: 82, lastYear: 71 },
  { area: "Uptime", thisYear: 96, lastYear: 92 },
  { area: "Support", thisYear: 74, lastYear: 80 },
  { area: "Docs", thisYear: 68, lastYear: 52 },
  { area: "Pricing", thisYear: 59, lastYear: 63 },
  { area: "Security", thisYear: 91, lastYear: 84 },
];

const config = {
  thisYear: { label: "This year" },
  lastYear: { label: "Last year" },
} satisfies ChartConfig;

export default function Chart() {
  return (
    <ChartContainer
      config={config}
      aria-label="Customer satisfaction score by area, this year and last"
      table={<ChartTable data={data} category="area" categoryLabel="Area" />}
    >
      {/* Smaller than it would be, to leave the legend its room. */}
      <RadarChart data={data} outerRadius="65%">
        <PolarGrid />
        <PolarAngleAxis dataKey="area" />
        <ChartTooltip />
        <ChartLegend />
        <Radar
          dataKey="thisYear"
          fill={chartFill("thisYear")}
          fillOpacity={0.4}
          stroke={chartColor("thisYear")}
          strokeDasharray={chartDash("thisYear")}
        />
        <Radar
          dataKey="lastYear"
          fill={chartFill("lastYear")}
          fillOpacity={0.4}
          stroke={chartColor("lastYear")}
          strokeDasharray={chartDash("lastYear")}
        />
      </RadarChart>
    </ChartContainer>
  );
}
