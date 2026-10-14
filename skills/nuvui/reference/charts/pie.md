<!-- Written by apps/docs/scripts/agent-skill.mjs from apps/docs/content/docs/charts/pie.mdx. Don't edit it here: run `pnpm skill`. -->

# Pie chart

Pie and donut charts with Recharts' PieChart in a ChartContainer. Each slice colored and named from the config, with pattern fills and a total in the middle.

A pie chart shows parts of one whole. It works for a few slices that differ clearly, and for little else: angles are hard to compare. For more than five parts, or parts close in size, use a [bar chart](bar.md).

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
import { Pie, PieChart } from "recharts";
import { browsers, browsersConfig } from "./data";

const label = (browser: number | string) =>
  browsersConfig[browser as keyof typeof browsersConfig]?.label ?? browser;

// A slice takes its fill from its row.
const slices = browsers.map((row) => ({
  ...row,
  fill: chartFill(row.browser),
}));

export default function Example() {
  return (
    <ChartContainer
      config={browsersConfig}
      aria-label="Visitors by browser"
      patterns
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
      <PieChart>
        <ChartTooltip hideLabel />
        <ChartLegend />
        <Pie data={slices} dataKey="visitors" nameKey="browser" />
      </PieChart>
    </ChartContainer>
  );
}
```

## How it's made

`PieChart` and `Pie` come from Recharts. A pie has one `Pie`, whose slices are the rows of its data:

```tsx
const slices = browsers.map((row) => ({
  ...row,
  fill: chartFill(row.browser),
}));

<Pie data={slices} dataKey="visitors" nameKey="browser" />
```

The config has an entry for each slice, under the value its row has in the `nameKey` field. A slice takes its color from a `fill` field in its row, which is where `chartFill` goes. The tooltip and the legend then find each slice's label in the config by its name.

A pie is as wide as it is tall. In the container's usual box, which is wider than it's tall, it would be small with empty space either side. The stylesheet above makes the box square with `--nuv-chart-aspect-ratio`, and stops it growing with a `max-inline-size`.

## A donut

`innerRadius` makes a ring, and a `Label` inside the `Pie` writes in the middle. The total is the usual thing to put there.

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
```

`strokeWidth` is the gap between slices. It's drawn in `--nuv-chart-backdrop`, which is the page's background. On a card, set that variable to the card's color.

## Accessibility

- Slices touch, so their fill is all that separates them. Use [`patterns`](chart.md#patterns), as the first example does.
- A legend makes people look back and forth between it and the pie. With few slices, a label on each slice is easier to read.
- The number in the middle of a donut is text in the chart, which a screen reader doesn't reach. Say it in the chart's name, as the example does, or in the page.
- Give the chart a [table](chart.md#the-same-numbers-as-a-table). With `series` set to the one field that holds the values, it has a row for each slice.
- The arrow keys move from slice to slice.

Everything on the [ChartContainer page](chart.md#accessibility) applies.
