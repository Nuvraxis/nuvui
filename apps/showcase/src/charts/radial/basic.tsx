"use client";

import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartTable,
  ChartTooltip,
  chartFill,
} from "@nuvui/charts";
import { RadialBar, RadialBarChart } from "recharts";

const data = [
  { team: "platform", closed: 275 },
  { team: "growth", closed: 200 },
  { team: "billing", closed: 187 },
  { team: "mobile", closed: 173 },
  { team: "data", closed: 90 },
];

const config = {
  platform: { label: "Platform" },
  growth: { label: "Growth" },
  billing: { label: "Billing" },
  mobile: { label: "Mobile" },
  data: { label: "Data" },
  closed: { label: "Issues closed" },
} satisfies ChartConfig;

const label = (team: number | string) =>
  config[team as keyof typeof config]?.label ?? team;

// A bar takes its fill from its row.
const bars = data.map((row) => ({ ...row, fill: chartFill(row.team) }));

export default function Chart() {
  return (
    <ChartContainer
      config={config}
      aria-label="Issues closed by team this quarter"
      table={
        <ChartTable
          data={data}
          category="team"
          categoryLabel="Team"
          series={["closed"]}
          formatCategory={label}
        />
      }
    >
      <RadialBarChart data={bars} innerRadius="25%" outerRadius="100%">
        <ChartTooltip hideLabel nameKey="team" cursor={false} />
        <ChartLegend nameKey="team" />
        <RadialBar dataKey="closed" background />
      </RadialBarChart>
    </ChartContainer>
  );
}
