# @nuvui/charts

Charts for [`@nuvui/react`](https://www.npmjs.com/package/@nuvui/react): a container, a tooltip, a legend and a data table for charts built from [Recharts](https://recharts.github.io) 3's own parts.

This is early: the package is on npm as a 0.x version, and before 1.0 a minor version may rename or remove things. The [changelog](https://nuvui.nuvraxis.com/docs/changelog) says where one does, and the [repository README](https://github.com/Nuvraxis/nuvui#readme) says where things stand.

```sh
pnpm add @nuvui/charts @nuvui/react recharts
```

```tsx
"use client";

import "@nuvui/react/styles.css";
import "@nuvui/charts/styles.css";
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartTable,
  ChartTooltip,
  chartFill,
} from "@nuvui/charts";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";

type Month = { month: string; desktop: number; mobile: number };

const config = {
  desktop: { label: "Desktop" },
  mobile: { label: "Mobile" },
} satisfies ChartConfig;

export function Visitors({ months }: { months: Month[] }) {
  return (
    <ChartContainer
      config={config}
      aria-label="Visitors by month"
      table={<ChartTable data={months} category="month" categoryLabel="Month" />}
    >
      <BarChart data={months}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="month" />
        <ChartTooltip />
        <ChartLegend />
        <Bar dataKey="desktop" fill={chartFill("desktop")} />
        <Bar dataKey="mobile" fill={chartFill("mobile")} />
      </BarChart>
    </ChartContainer>
  );
}
```

## What's in it

- `ChartContainer`: sizes the chart, names it, and sets a color, a fill and a dash for each series as CSS variables. A series with no color of its own takes the next of the theme's eight chart colors. Recharts' axes, grid and labels are styled from the tokens.
- `chartColor`, `chartFill` and `chartDash`: the text of those variables, for Recharts' `stroke`, `fill` and `strokeDasharray`.
- `ChartTooltip` and `ChartLegend`: Recharts' tooltip and legend, drawn like the rest of the library, with the labels from the config.
- `ChartTable`: the chart's numbers as a table, for screen readers only or drawn under the chart.

Recharts does the drawing: the scales, the shapes, the axes, the animation and the keyboard. Nothing of it is wrapped or renamed.

A color is a CSS variable, so switching the theme recolors a chart without drawing it again. With `patterns`, each series also gets a fill and a dash of its own, so series can be told apart without color. Where the browser forces colors, that happens by itself.

## Peer dependencies

`@nuvui/react` and `recharts` 3 are peer dependencies. You import the chart's parts from `recharts` yourself, so your app owns that version. Recharts asks for `react-is` as a peer of its own.

A chart is a client component. Put `"use client"` at the top of the file it's written in.

It's a package of its own so that an app which only wants buttons and dialogs doesn't have to install a charting library.

The docs are at https://nuvui.nuvraxis.com/docs/charts.

## License

MIT
