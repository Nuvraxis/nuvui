"use client";

import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartTable,
  ChartTooltip,
  chartColor,
  chartDash,
} from "@nuvui/charts";
import { PolarAngleAxis, PolarGrid, Radar, RadarChart } from "recharts";

const data = [
  { skill: "Design", current: 4, target: 5 },
  { skill: "Frontend", current: 5, target: 5 },
  { skill: "Backend", current: 3, target: 4 },
  { skill: "Data", current: 2, target: 4 },
  { skill: "Operations", current: 3, target: 3 },
  { skill: "Security", current: 2, target: 4 },
];

// The target is always dashed, whatever the container is set to.
const config = {
  current: { label: "Current", dash: "solid" },
  target: { label: "Target", dash: "dashed" },
} satisfies ChartConfig;

export default function Chart() {
  return (
    <ChartContainer
      config={config}
      aria-label="Team skill levels against their targets, out of 5"
      table={<ChartTable data={data} category="skill" categoryLabel="Skill" />}
    >
      {/* Smaller than it would be, to leave the legend its room. */}
      <RadarChart data={data} outerRadius="65%">
        <PolarGrid />
        <PolarAngleAxis dataKey="skill" />
        <ChartTooltip indicator="line" />
        <ChartLegend indicator="line" />
        {/* No fill, so neither shape hides the other. */}
        <Radar
          dataKey="current"
          fill="none"
          stroke={chartColor("current")}
          strokeDasharray={chartDash("current")}
          strokeWidth={2}
          dot={{ r: 3, fill: chartColor("current") }}
        />
        <Radar
          dataKey="target"
          fill="none"
          stroke={chartColor("target")}
          strokeDasharray={chartDash("target")}
          strokeWidth={2}
        />
      </RadarChart>
    </ChartContainer>
  );
}
