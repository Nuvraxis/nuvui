"use client";

import {
  type ChartConfig,
  ChartContainer,
  ChartTable,
  ChartTooltip,
  chartColor,
  chartFill,
} from "@nuvui/charts";
import { PolarAngleAxis, PolarGrid, Radar, RadarChart } from "recharts";

const data = [
  { area: "Speed", score: 82 },
  { area: "Uptime", score: 96 },
  { area: "Support", score: 74 },
  { area: "Docs", score: 68 },
  { area: "Pricing", score: 59 },
  { area: "Security", score: 91 },
];

const config = {
  score: { label: "Score" },
} satisfies ChartConfig;

export default function Chart() {
  return (
    <ChartContainer
      config={config}
      aria-label="Customer satisfaction score by area, out of 100"
      table={<ChartTable data={data} category="area" categoryLabel="Area" />}
    >
      <RadarChart data={data}>
        <PolarGrid />
        <PolarAngleAxis dataKey="area" />
        <ChartTooltip />
        <Radar
          dataKey="score"
          fill={chartFill("score")}
          fillOpacity={0.4}
          stroke={chartColor("score")}
        />
      </RadarChart>
    </ChartContainer>
  );
}
