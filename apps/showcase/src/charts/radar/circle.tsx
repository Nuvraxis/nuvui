"use client";

import {
  type ChartConfig,
  ChartContainer,
  ChartTable,
  ChartTooltip,
  chartColor,
  chartFill,
} from "@nuvui/charts";
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
} from "recharts";

const data = [
  { hour: "00:00", requests: 120 },
  { hour: "03:00", requests: 80 },
  { hour: "06:00", requests: 210 },
  { hour: "09:00", requests: 640 },
  { hour: "12:00", requests: 720 },
  { hour: "15:00", requests: 690 },
  { hour: "18:00", requests: 430 },
  { hour: "21:00", requests: 260 },
];

const config = {
  requests: { label: "Requests per minute" },
} satisfies ChartConfig;

export default function Chart() {
  return (
    <ChartContainer
      config={config}
      aria-label="Requests per minute by time of day"
      table={<ChartTable data={data} category="hour" categoryLabel="Time" />}
    >
      <RadarChart data={data}>
        {/* A day goes round, so the grid is round too. */}
        <PolarGrid gridType="circle" />
        <PolarAngleAxis dataKey="hour" />
        {/* The scale runs between two spokes, clear of their names. */}
        <PolarRadiusAxis angle={67.5} tickCount={4} axisLine={false} />
        <ChartTooltip />
        <Radar
          dataKey="requests"
          fill={chartFill("requests")}
          fillOpacity={0.4}
          stroke={chartColor("requests")}
        />
      </RadarChart>
    </ChartContainer>
  );
}
