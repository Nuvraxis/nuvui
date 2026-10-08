"use client";

import {
  type ChartConfig,
  ChartContainer,
  ChartTable,
  ChartTooltip,
  chartColor,
  chartFill,
} from "@nuvui/charts";
import type { CSSProperties } from "react";
import { Area, AreaChart } from "recharts";

const data = [
  { week: "Week 1", revenue: 48200 },
  { week: "Week 2", revenue: 51900 },
  { week: "Week 3", revenue: 50400 },
  { week: "Week 4", revenue: 56800 },
  { week: "Week 5", revenue: 61300 },
  { week: "Week 6", revenue: 59700 },
  { week: "Week 7", revenue: 66100 },
  { week: "Week 8", revenue: 73400 },
];

const config = {
  revenue: { label: "Revenue" },
} satisfies ChartConfig;

const dollars = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const first = data[0]?.revenue ?? 0;
const last = data[data.length - 1]?.revenue ?? 0;
const change = Math.round(((last - first) / first) * 100);

// A short, wide box with no axes: the line is there for its shape. The
// figure above it is the number, and the table has the rest.
const size = {
  "--nuv-chart-height": "4rem",
  "--nuv-chart-aspect-ratio": "auto",
} as CSSProperties;

export default function Chart() {
  return (
    <div style={{ display: "grid", gap: "0.75rem" }}>
      <div>
        <p
          style={{
            margin: 0,
            fontSize: "var(--text-2xl)",
            fontWeight: 600,
            lineHeight: 1.2,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {dollars.format(last)}
        </p>
        <p
          style={{
            margin: 0,
            color: "var(--color-muted-foreground)",
            fontSize: "var(--text-sm)",
          }}
        >
          Weekly revenue, up {change}% in eight weeks
        </p>
      </div>
      <ChartContainer
        config={config}
        aria-label="Weekly revenue over the last eight weeks"
        formatValue={(value) => dollars.format(Number(value))}
        style={size}
        table={<ChartTable data={data} category="week" categoryLabel="Week" />}
      >
        <AreaChart
          data={data}
          margin={{ top: 4, right: 0, bottom: 0, left: 0 }}
        >
          <ChartTooltip indicator="line" />
          <Area
            dataKey="revenue"
            type="monotone"
            fill={chartFill("revenue")}
            fillOpacity={0.2}
            stroke={chartColor("revenue")}
            strokeWidth={2}
          />
        </AreaChart>
      </ChartContainer>
    </div>
  );
}
