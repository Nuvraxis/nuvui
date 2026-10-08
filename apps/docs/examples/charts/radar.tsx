"use client";

import "./round.css";
import {
  ChartContainer,
  ChartLegend,
  ChartTable,
  ChartTooltip,
  chartColor,
  chartDash,
  chartFill,
} from "@nuvui/charts";
import { PolarAngleAxis, PolarGrid, Radar, RadarChart } from "recharts";
import { short, visitors, visitorsConfig } from "./data";

export default function Example() {
  return (
    <ChartContainer
      config={visitorsConfig}
      aria-label="Visitors by month, on desktop and mobile"
      className="round-chart"
      table={
        <ChartTable data={visitors} category="month" categoryLabel="Month" />
      }
    >
      <RadarChart data={visitors}>
        <PolarGrid />
        <PolarAngleAxis dataKey="month" tickFormatter={short} />
        <ChartTooltip />
        <ChartLegend />
        <Radar
          dataKey="desktop"
          fill={chartFill("desktop")}
          fillOpacity={0.4}
          stroke={chartColor("desktop")}
          strokeDasharray={chartDash("desktop")}
        />
        <Radar
          dataKey="mobile"
          fill={chartFill("mobile")}
          fillOpacity={0.4}
          stroke={chartColor("mobile")}
          strokeDasharray={chartDash("mobile")}
        />
      </RadarChart>
    </ChartContainer>
  );
}
