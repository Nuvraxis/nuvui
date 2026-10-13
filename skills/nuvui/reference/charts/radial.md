<!-- Written by apps/docs/scripts/agent-skill.mjs from apps/docs/content/docs/charts/radial.mdx. Don't edit it here: run `pnpm skill`. -->

# Radial chart

Radial bar charts with Recharts' RadialBarChart in a ChartContainer. Bars bent into rings, each colored and named from the config.

A radial chart is a bar chart bent into rings. It takes less room than bars and suits a dashboard tile. It's harder to read: an outer ring is longer than an inner one for the same value, so compare the angles and not the lengths. For anything people need to compare closely, use a [bar chart](bar.md).

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
  chartFill,
} from "@nuvui/charts";
import { RadialBar, RadialBarChart } from "recharts";
import { browsers, browsersConfig } from "./data";

const label = (browser: number | string) =>
  browsersConfig[browser as keyof typeof browsersConfig]?.label ?? browser;

const bars = browsers.map((row) => ({
  ...row,
  fill: chartFill(row.browser),
}));

export default function Example() {
  return (
    <ChartContainer
      config={browsersConfig}
      aria-label="Visitors by browser"
      className="round-chart"
      table={
        <ChartTable
          data={browsers}
          category="browser"
          categoryLabel="Browser"
          series={["visitors"]}
          formatCategory={label}
        />
      }
    >
      <RadialBarChart data={bars} innerRadius="25%" outerRadius="100%">
        <ChartTooltip hideLabel nameKey="browser" cursor={false} />
        <ChartLegend nameKey="browser" />
        <RadialBar dataKey="visitors" background />
      </RadialBarChart>
    </ChartContainer>
  );
}
```

## How it's made

`RadialBarChart` and `RadialBar` come from Recharts. As in a [pie](pie.md), each row of the data is a ring, and takes its color from a `fill` field in the row:

```tsx
const bars = browsers.map((row) => ({
  ...row,
  fill: chartFill(row.browser),
}));

<RadialBarChart data={bars} innerRadius="25%" outerRadius="100%">
  <RadialBar dataKey="visitors" background />
</RadialBarChart>
```

`background` draws the track each ring runs along, in `--nuv-chart-cursor`.

Every ring is read from the same field, so the tooltip and the legend can't tell from the series which label to use. `nameKey="browser"` on each says which field of the row holds the config's key.

## Accessibility

- The rings don't say what they are. Keep the legend, or the names are only in the tooltip.
- Give the chart a [table](chart.md#the-same-numbers-as-a-table). Nobody reads an exact value off a ring.
- Turn on [`patterns`](chart.md#patterns) when the rings need to be told apart without color.
- The arrow keys move from ring to ring.

Everything on the [ChartContainer page](chart.md#accessibility) applies.
