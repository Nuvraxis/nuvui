"use client";

import "./round.css";
import { ChartContainer, ChartTooltip, chartFill } from "@nuvui/charts";
import { Label, Pie, PieChart } from "recharts";
import { browsers, browsersConfig } from "./data";

const slices = browsers.map((row) => ({
  ...row,
  fill: chartFill(row.browser),
}));
const total = browsers.reduce((sum, row) => sum + row.visitors, 0);

export default function Example() {
  return (
    <ChartContainer
      config={browsersConfig}
      aria-label={`Visitors by browser, ${total} in all`}
      className="round-chart"
    >
      <PieChart>
        <ChartTooltip hideLabel />
        <Pie
          data={slices}
          dataKey="visitors"
          nameKey="browser"
          innerRadius="60%"
          strokeWidth={4}
        >
          <Label
            value={total}
            position="center"
            style={{ fontSize: "1.5rem", fontWeight: 600 }}
          />
        </Pie>
      </PieChart>
    </ChartContainer>
  );
}
