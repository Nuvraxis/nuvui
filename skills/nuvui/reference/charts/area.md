<!-- Written by apps/docs/scripts/agent-skill.mjs from apps/docs/content/docs/charts/area.mdx. Don't edit it here: run `pnpm skill`. -->

# Area chart

Area charts with Recharts' AreaChart in a ChartContainer. One series, stacked series and a gradient fill, colored from the theme.

An area chart shows how an amount changes over time, with the space under the line filled in. Use it when the amount itself matters, such as a total, and a [line chart](line.md) when only the direction does.

```tsx
"use client";

import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  chartColor,
  chartFill,
} from "@nuvui/charts";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import { short, visitors } from "./data";

const config = {
  desktop: { label: "Desktop" },
} satisfies ChartConfig;

export default function Example() {
  return (
    <ChartContainer config={config} aria-label="Desktop visitors by month">
      <AreaChart data={visitors} margin={{ left: 12, right: 12 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="month"
          tickFormatter={short}
          tickLine={false}
          axisLine={false}
        />
        <ChartTooltip indicator="line" />
        <Area
          dataKey="desktop"
          type="natural"
          fill={chartFill("desktop")}
          fillOpacity={0.4}
          stroke={chartColor("desktop")}
          strokeWidth={2}
        />
      </AreaChart>
    </ChartContainer>
  );
}
```

## How it's made

`AreaChart` and `Area` come from Recharts. An area has two colors: `fill` for the space and `stroke` for the line along its top.

```tsx
<Area
  dataKey="desktop"
  fill={chartFill("desktop")}
  fillOpacity={0.4}
  stroke={chartColor("desktop")}
/>
```

A see-through fill lets the grid show, and lets two areas that overlap both be seen.

## Stacked

Give each `Area` the same `stackId` and each is drawn on top of the one before, so the top edge is the total.

```tsx
"use client";

import {
  ChartContainer,
  ChartLegend,
  ChartTable,
  ChartTooltip,
  chartColor,
  chartFill,
} from "@nuvui/charts";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import { short, visitors, visitorsConfig } from "./data";

export default function Example() {
  return (
    <ChartContainer
      config={visitorsConfig}
      aria-label="Visitors by month, desktop and mobile stacked"
      table={
        <ChartTable data={visitors} category="month" categoryLabel="Month" />
      }
    >
      <AreaChart data={visitors} margin={{ left: 12, right: 12 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="month"
          tickFormatter={short}
          tickLine={false}
          axisLine={false}
        />
        <ChartTooltip />
        <ChartLegend />
        <Area
          dataKey="mobile"
          type="natural"
          stackId="visitors"
          fill={chartFill("mobile")}
          fillOpacity={0.4}
          stroke={chartColor("mobile")}
        />
        <Area
          dataKey="desktop"
          type="natural"
          stackId="visitors"
          fill={chartFill("desktop")}
          fillOpacity={0.4}
          stroke={chartColor("desktop")}
        />
      </AreaChart>
    </ChartContainer>
  );
}
```

The series written first is at the bottom. Put the steadiest one there: every series above it takes on the bumps of the ones below.

## A gradient

A gradient is an SVG `linearGradient` in the chart's `defs`, and the area's `fill` points at it. Its stops use the series' color, so it still follows the theme.

```tsx
"use client";

import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  chartColor,
} from "@nuvui/charts";
import { useId } from "react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import { short, visitors } from "./data";

const config = {
  mobile: { label: "Mobile", color: "var(--color-chart-3)" },
} satisfies ChartConfig;

export default function Example() {
  // Ids are shared by the whole page, so each chart needs its own.
  const gradient = useId();

  return (
    <ChartContainer config={config} aria-label="Mobile visitors by month">
      <AreaChart data={visitors} margin={{ left: 12, right: 12 }}>
        <defs>
          <linearGradient id={gradient} x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="5%"
              stopColor={chartColor("mobile")}
              stopOpacity={0.6}
            />
            <stop
              offset="95%"
              stopColor={chartColor("mobile")}
              stopOpacity={0.05}
            />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="month"
          tickFormatter={short}
          tickLine={false}
          axisLine={false}
        />
        <ChartTooltip indicator="line" />
        <Area
          dataKey="mobile"
          type="natural"
          fill={`url(#${gradient})`}
          fillOpacity={1}
          stroke={chartColor("mobile")}
          strokeWidth={2}
        />
      </AreaChart>
    </ChartContainer>
  );
}
```

Ids are shared by the whole page, so the gradient's comes from `useId`. A fill written this way doesn't switch to a [pattern](chart.md#patterns).

## Accessibility

- <kbd>←</kbd> and <kbd>→</kbd> move along the points, and the tooltip reads out each one.
- Stacked areas are hard to read exactly: only the bottom series sits on a flat line. Give the chart a [table](chart.md#the-same-numbers-as-a-table), which has every number.
- Two overlapping areas of different colors mix where they cross. With `patterns` each keeps a fill that can be told from the other.
- Name the chart for what it shows, and say that it's stacked if it is.

Everything on the [ChartContainer page](chart.md#accessibility) applies.
