<!-- Written by apps/docs/scripts/agent-skill.mjs from apps/docs/content/docs/charts/radar.mdx. Don't edit it here: run `pnpm skill`. -->

# Radar chart

Radar charts with Recharts' RadarChart in a ChartContainer. Series compared across several axes, colored from the theme, with a polar grid styled from the tokens.

A radar chart puts each category on a spoke of its own and joins the values into a shape. Use it to compare the profile of two or three things across the same handful of measures. It's a poor way to read exact values, and the shape changes with the order of the spokes.

```css title="round.css"
/* A round chart is as wide as it is tall, so it gets a square box and a
   width to stop at. */
.round-chart {
  --nuv-chart-aspect-ratio: 1;

  max-inline-size: 20rem;
  margin-inline: auto;
}
```

```tsx
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
```

## How it's made

`RadarChart`, `PolarGrid`, `PolarAngleAxis` and `Radar` come from Recharts. Each `Radar` is a series, with a fill and a line around it:

```tsx
<Radar
  dataKey="desktop"
  fill={chartFill("desktop")}
  fillOpacity={0.4}
  stroke={chartColor("desktop")}
/>
```

Keep the fill see-through. Two shapes overlap over most of their area, and a solid one hides the other.

The grid and the names around it take their colors from `--nuv-chart-grid` and `--nuv-chart-fg`.

Like a pie, a radar chart is as wide as it is tall, so the example gives it a square box and a width to stop at.

## Accessibility

- The arrow keys move from spoke to spoke, and the tooltip reads out every series there.
- Where two shapes overlap their colors mix. Dash the lines with `chartDash`, as the example does, and turn on [`patterns`](chart.md#patterns).
- A radar chart's values are hard to read off even for someone who can see it. Give it a [table](chart.md#the-same-numbers-as-a-table), and consider making that table `visible`.
- More than three series is too many for this chart.

Everything on the [ChartContainer page](chart.md#accessibility) applies.
