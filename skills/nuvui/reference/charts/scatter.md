<!-- Written by apps/docs/scripts/agent-skill.mjs from apps/docs/content/docs/charts/scatter.mdx. Don't edit it here: run `pnpm skill`. -->

# Scatter chart

Scatter charts with Recharts' ScatterChart in a ChartContainer. Groups of points on two number axes, colored from the theme and told apart by shape.

A scatter chart puts each thing at a point on two number axes, to show whether the two measures move together and which points stand apart.

```tsx
"use client";

import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartTooltip,
  chartFill,
} from "@nuvui/charts";
import { CartesianGrid, Scatter, ScatterChart, XAxis, YAxis } from "recharts";

const startups = [
  { seats: 12, days: 18 },
  { seats: 25, days: 24 },
  { seats: 8, days: 9 },
  { seats: 40, days: 31 },
  { seats: 18, days: 15 },
];
const enterprises = [
  { seats: 220, days: 84 },
  { seats: 340, days: 121 },
  { seats: 150, days: 66 },
  { seats: 480, days: 140 },
];

const config = {
  startup: { label: "Startup" },
  enterprise: { label: "Enterprise" },
} satisfies ChartConfig;

export default function Example() {
  return (
    <ChartContainer
      config={config}
      aria-label="Days to close a deal against seats sold, for startups and enterprises"
    >
      <ScatterChart margin={{ top: 8, right: 12, bottom: 20 }}>
        <CartesianGrid />
        <XAxis
          type="number"
          dataKey="seats"
          name="Seats"
          tickLine={false}
          label={{ value: "Seats", position: "insideBottom", offset: -12 }}
        />
        <YAxis
          type="number"
          dataKey="days"
          name="Days to close"
          tickLine={false}
          width={40}
        />
        <ChartTooltip hideLabel />
        <ChartLegend verticalAlign="top" />
        <Scatter
          name="startup"
          data={startups}
          fill={chartFill("startup")}
          shape="circle"
        />
        <Scatter
          name="enterprise"
          data={enterprises}
          fill={chartFill("enterprise")}
          shape="diamond"
        />
      </ScatterChart>
    </ChartContainer>
  );
}
```

## How it's made

`ScatterChart` and `Scatter` come from Recharts. Both axes are numbers, so each needs `type="number"` and the field it reads. Each `Scatter` is a group of points with data of its own:

```tsx
<XAxis type="number" dataKey="seats" name="Seats" />
<YAxis type="number" dataKey="days" name="Days to close" />
<Scatter name="startup" data={startups} fill={chartFill("startup")} shape="circle" />
<Scatter name="enterprise" data={enterprises} fill={chartFill("enterprise")} shape="diamond" />
```

The config has an entry for each group, under the `name` its `Scatter` has. That's what the legend lists.

The tooltip for a point has a row for each axis, named by the axis's `name`. Give both axes one.

Label the axes. A scatter chart's axes are two measures, and nothing else in the chart says which is which.

## Shapes

`shape` on a `Scatter` is what tells groups apart without color: `"circle"`, `"cross"`, `"diamond"`, `"square"`, `"star"`, `"triangle"` and `"wye"`. Give each group its own. Points are too small for a pattern to show, so [`patterns`](chart.md#patterns) isn't the tool here.

## Accessibility

- The arrow keys step through the points of the first group, in the order of its data, and don't reach the other groups. That's how Recharts' keyboard layer treats a scatter chart at this version, measured on the example above. With one group, every point can be reached.
- That makes a text version matter more. `ChartTable` draws one table from one list of rows, which fits a chart with a single group. For several groups, write the table yourself, with a column that says which group each row is in.
- Say what the chart shows in its name: the two measures and what was found, such as "Days to close rise with seats sold".
- Give each group a shape of its own.

Everything on the [ChartContainer page](chart.md#accessibility) applies.
