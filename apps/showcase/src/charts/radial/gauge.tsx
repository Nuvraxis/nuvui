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

const score = 64;
const data = [{ name: "Customer health", score, fill: chartFill("score") }];

const config = {
  score: { label: "Score" },
} satisfies ChartConfig;

export default function Chart() {
  return (
    <ChartContainer
      config={config}
      aria-label={`Customer health score: ${score} out of 100`}
      table={<ChartTable data={data} category="name" categoryLabel="Measure" />}
    >
      {/* Half a ring, from the left round to the right, with its center
          low in the box so the half fills it. */}
      <RadialBarChart
        data={data}
        startAngle={180}
        endAngle={0}
        cy="75%"
        innerRadius="90%"
        outerRadius="130%"
      >
        <PolarAngleAxis
          type="number"
          domain={[0, 100]}
          tick={false}
          tickLine={false}
          axisLine={false}
        />
        <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
          <Label
            value={score}
            position="center"
            dy={-16}
            style={{ fontSize: "1.75rem", fontWeight: 600 }}
          />
        </PolarRadiusAxis>
        <RadialBar dataKey="score" background cornerRadius={8} />
      </RadialBarChart>
    </ChartContainer>
  );
}
