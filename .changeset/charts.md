---
"@nuvui/charts": minor
---

A new package, `@nuvui/charts`, for charts. It's installed next to `@nuvui/react` and `recharts` 3, which are peer dependencies, and has a stylesheet of its own, `@nuvui/charts/styles.css`. A chart is built from Recharts' own parts, and this package is what goes around them.

- `ChartContainer`: the box a Recharts chart goes in. It sizes the chart to its space, names it, and sets three CSS variables for each series of a config: its color, its fill and the dashes of its line. A series with no color takes the next of the theme's eight chart colors. Recharts' axes, grid, labels and cursor are styled from the tokens. Because a color is a variable, a new theme recolors a chart without it being drawn again.
- `chartColor`, `chartFill` and `chartDash`: the text of those variables, for Recharts' `stroke`, `fill` and `strokeDasharray`.
- Patterns: with `patterns` on the container each series gets a fill and a dash of its own, so series can be told apart without color. A `pattern` or `dash` on one series is always drawn. Where the browser forces colors, every series is drawn in the system's text color and patterned.
- `ChartTooltip` and `ChartTooltipContent`: Recharts' tooltip with the library's look, the labels from the config, and a sample of each series that shows its pattern or dashes. It's a live region, as Recharts' own is.
- `ChartLegend` and `ChartLegendContent`: Recharts' legend, with the series in the config's order.
- `ChartTable`: the chart's numbers as a table, for screen readers only or drawn under the chart.
