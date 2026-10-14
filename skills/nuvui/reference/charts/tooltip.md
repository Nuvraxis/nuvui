<!-- Written by apps/docs/scripts/agent-skill.mjs from apps/docs/content/docs/charts/tooltip.mdx. Don't edit it here: run `pnpm skill`. -->

# Chart tooltip

ChartTooltip, Recharts' tooltip drawn like the library's other floating panels. It names each series from the config, shows its color or pattern, formats values, and is a live region for screen readers.

`ChartTooltip` shows the values at the point under the pointer, or at the point the arrow keys are on. It's Recharts' `Tooltip` with the library's look and the labels from the chart's config.

```tsx
"use client";

import {
  ChartContainer,
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
      aria-label="Visitors by month"
      patterns
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

## Import

```tsx
import { ChartTooltip, ChartTooltipContent } from "@nuvui/charts";
```

Put `<ChartTooltip />` inside the chart, where Recharts' `Tooltip` would go. It takes everything `Tooltip` takes, such as `cursor`, `trigger` and `defaultIndex`.

## What it shows

- **The point**, on the first line: the category from the axis, such as the month. `hideLabel` leaves it out, for a pie, where each slice already says what it is.
- **A row for each series**, with a sample, the series' label from the config, and its value.

The sample is drawn from the series' own variables, so it has the same color, the same pattern and the same dashes. `indicator="line"` makes it a short line, for a line chart. The default is a square.

A series is matched to the config by its name, then by its `dataKey`. A series the config doesn't have is shown with Recharts' name and color for it. Where neither is a key of the config, as with the rings of a [radial chart](radial.md), `nameKey` names the field of the data row that is.

## Formatting

The container's `formatValue` writes the values, here and in the table. Recharts' `labelFormatter` writes the first line.

```tsx
"use client";

import {
  ChartContainer,
  ChartTable,
  ChartTooltip,
  chartFill,
} from "@nuvui/charts";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import { short, visitors, visitorsConfig } from "./data";

// Made once, with the locale written out. A formatter that takes the
// browser's locale would write the table differently on the server.
const number = new Intl.NumberFormat("en-US");
const rows = visitors.map((row) => ({
  ...row,
  desktop: row.desktop * 1250,
  mobile: row.mobile * 1250,
}));

export default function Example() {
  return (
    <ChartContainer
      config={visitorsConfig}
      aria-label="Visitors by month"
      formatValue={(value) => number.format(Number(value))}
      table={<ChartTable data={rows} category="month" categoryLabel="Month" />}
    >
      <BarChart data={rows}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="month"
          tickFormatter={short}
          tickLine={false}
          axisLine={false}
        />
        <ChartTooltip labelFormatter={(label) => `${label} 2026`} />
        <Bar dataKey="desktop" fill={chartFill("desktop")} radius={4} />
        <Bar dataKey="mobile" fill={chartFill("mobile")} radius={4} />
      </BarChart>
    </ChartContainer>
  );
}
```

`formatValue` on the tooltip itself is for when the tooltip should differ from the table. Recharts' own `formatter` works too, on the tooltip or on a series. It can give back a value, or a value and a name.

## Props

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `indicator` | `"line" \| "square"` | `"square"` | The sample drawn next to each series. |
| `hideLabel` | `boolean` | `false` | Leaves out the line that says which point this is, for a chart where each row already says it. |
| `nameKey` | `string` |  | The field of a data row that holds the series' key. Only needed when neither the series' name nor its data key is a key of the config. |
| `formatValue` | `ChartValueFormatter` |  | How a value is written. The container's `formatValue` by default. |
| `className` | `string` |  |  |

## Your own tooltip

`ChartTooltip` is Recharts' `Tooltip` with `ChartTooltipContent` as its `content`. To add to what's shown, pass `Tooltip` a component of your own that draws `ChartTooltipContent` and whatever goes with it:

```tsx
import { ChartTooltipContent, type ChartTooltipContentProps } from "@nuvui/charts";
import { Tooltip } from "recharts";

function WithNote(props: ChartTooltipContentProps) {
  return (
    <div>
      <ChartTooltipContent {...props} />
      {props.active ? <p>Figures are provisional.</p> : null}
    </div>
  );
}

<Tooltip content={<WithNote />} />
```

## Accessibility

- The tooltip is a live region. When the arrow keys move to a point, a screen reader reads the tooltip's text: the point, then each series and its value.
- It's in the page from the start, empty and hidden, because a live region that arrives with its text already in it isn't read.
- <kbd>Enter</kbd> on a focused chart hides the tooltip and shows it again.
- The tooltip never takes focus and has nothing in it to press. Don't put links or buttons in one.
- On a touch screen a tooltip opens on a tap and covers part of the chart. Nothing should be in the tooltip only: the [table](chart.md#the-same-numbers-as-a-table) has the same numbers.
- The tooltip's slide between points is Recharts' animation, and is off when the system asks for reduced motion.

How the text is read as it changes hasn't been checked with a screen reader yet. Recharts' guidance is that VoiceOver users have to turn QuickNav off for the arrow keys to reach the chart.
