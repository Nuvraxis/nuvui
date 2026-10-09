"use client";

import {
  type ChartConfig,
  ChartContainer,
  ChartTable,
  chartFill,
} from "@nuvui/charts";
import {
  Label,
  PolarAngleAxis,
  PolarRadiusAxis,
  RadialBar,
  RadialBarChart,
} from "recharts";

const used = 72;
const data = [{ name: "Storage", used, fill: chartFill("used") }];

const config = {
  used: { label: "Used" },
} satisfies ChartConfig;

export default function Chart() {
  return (
    <ChartContainer
      config={config}
      aria-label={`Storage used: ${used} percent of the plan's limit`}
      formatValue={(value) => `${value}%`}
      table={<ChartTable data={data} category="name" categoryLabel="Measure" />}
    >
      <RadialBarChart
        data={data}
        innerRadius="70%"
        outerRadius="100%"
        startAngle={90}
        endAngle={-270}
      >
        {/* The scale goes to 100, so the bar is the share that's used. */}
        <PolarAngleAxis
          type="number"
          domain={[0, 100]}
          tick={false}
          tickLine={false}
          axisLine={false}
        />
        <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
          <Label
            value={`${used}%`}
            position="center"
            style={{ fontSize: "1.75rem", fontWeight: 600 }}
          />
        </PolarRadiusAxis>
        <RadialBar dataKey="used" background cornerRadius={8} />
      </RadialBarChart>
    </ChartContainer>
  );
}
