<!-- Written by apps/docs/scripts/agent-skill.mjs from apps/docs/content/docs/charts/line.mdx. Don't edit it here: run `pnpm skill`. -->

# Line chart

Line charts with Recharts' LineChart in a ChartContainer. Several series colored from the theme, with dashes that tell them apart without color.

A line chart shows how something changes, and how two things change against each other. Use it for a trend over time.

```tsx
"use client";

import {
  ChartContainer,
  ChartLegend,
  ChartTable,
  ChartTooltip,
  chartColor,
  chartDash,
} from "@nuvui/charts";
import { CartesianGrid, Line, LineChart, XAxis } from "recharts";
import { short, visitors, visitorsConfig } from "./data";

export default function Example() {
  return (
    <ChartContainer
      config={visitorsConfig}
      aria-label="Visitors by month, on desktop and mobile"
      table={
        <ChartTable data={visitors} category="month" categoryLabel="Month" />
      }
    >
      <LineChart data={visitors} margin={{ left: 12, right: 12 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="month"
          tickFormatter={short}
          tickLine={false}
          axisLine={false}
        />
        <ChartTooltip indicator="line" />
        <ChartLegend indicator="line" />
        <Line
          dataKey="desktop"
          type="monotone"
          stroke={chartColor("desktop")}
          strokeDasharray={chartDash("desktop")}
          strokeWidth={2}
          dot={false}
        />
        <Line
          dataKey="mobile"
          type="monotone"
          stroke={chartColor("mobile")}
          strokeDasharray={chartDash("mobile")}
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ChartContainer>
  );
}
```

## How it's made

`LineChart` and `Line` come from Recharts. A line has a `stroke` and no fill:

```tsx
<Line
  dataKey="desktop"
  stroke={chartColor("desktop")}
  strokeDasharray={chartDash("desktop")}
  strokeWidth={2}
/>
```

Draw a line 2 pixels wide. At 1 pixel a color is hard to make out, and the 3:1 the chart colors are held to is measured on something at least that thick.

`indicator="line"` on the tooltip and the legend makes their samples short lines, which show a line's dashes where a square can't.

## Dashes

`chartDash` is how a line picks up its dashes. Lines can't be filled with a pattern, so dashes are what tell two of them apart without color. They're off until the container has [`patterns`](chart.md#patterns), or the browser is forcing colors.

A `dash` on a series in the config is always drawn. That's the way to mark one line as different in kind, such as a forecast:

```tsx
"use client";

import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartTooltip,
  chartColor,
  chartDash,
} from "@nuvui/charts";
import { CartesianGrid, Line, LineChart, XAxis } from "recharts";
import { short, visitors } from "./data";

// The forecast is always dashed, whatever the container is set to.
const config = {
  desktop: { label: "Actual", dash: "solid" },
  mobile: { label: "Forecast", dash: "dashed" },
} satisfies ChartConfig;

export default function Example() {
  return (
    <ChartContainer config={config} aria-label="Actual and forecast visitors">
      <LineChart data={visitors} margin={{ left: 12, right: 12 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="month"
          tickFormatter={short}
          tickLine={false}
          axisLine={false}
        />
        <ChartTooltip indicator="line" />
        <ChartLegend indicator="line" />
        <Line
          dataKey="desktop"
          stroke={chartColor("desktop")}
          strokeDasharray={chartDash("desktop")}
          strokeWidth={2}
        />
        <Line
          dataKey="mobile"
          stroke={chartColor("mobile")}
          strokeDasharray={chartDash("mobile")}
          strokeWidth={2}
        />
      </LineChart>
    </ChartContainer>
  );
}
```

The eight dashes are `"solid"`, `"dashed"`, `"dotted"`, `"dash-dot"`, `"long-dash"`, `"short-dash"`, `"dash-dot-dot"` and `"long-short"`.

## Accessibility

- <kbd>←</kbd> and <kbd>→</kbd> move along the points. The tooltip reads out every line's value at that point.
- Lines cross, and where they do, color is all that says which is which. Use dashes when there's more than one line.
- Dots on a line make its points easier to hit with a pointer, and show where the data really is. On a line with many points, `dot={false}` keeps it readable.
- More than four or five lines is hard for anyone to follow. Show fewer, or let people choose which.
- Give the chart a [table](chart.md#the-same-numbers-as-a-table).

Everything on the [ChartContainer page](chart.md#accessibility) applies.
