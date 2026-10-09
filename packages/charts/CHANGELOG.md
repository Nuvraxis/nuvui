# @nuvui/charts

## 0.1.1

### Patch Changes

- [#26](https://github.com/Nuvraxis/nuvui/pull/26) [`3e9922d`](https://github.com/Nuvraxis/nuvui/commit/3e9922d8100e8fba75ae5cc354d8d79fb00bfdf1) Thanks [@sajanv88](https://github.com/sajanv88)! - Each package's README said the package hadn't been released and that the docs would live at nuvui.nuvraxis.com. It now gives the install command and links to the docs, which are there.
- Updated dependencies [[`3e9922d`](https://github.com/Nuvraxis/nuvui/commit/3e9922d8100e8fba75ae5cc354d8d79fb00bfdf1)]:
  - @nuvui/react@0.1.1

## 0.1.0

### Minor Changes

- [#12](https://github.com/Nuvraxis/nuvui/pull/12) [`4e07639`](https://github.com/Nuvraxis/nuvui/commit/4e07639d9a17d966fcda9a6d1e81fb9ef9a400ea) Thanks [@sajanv88](https://github.com/sajanv88)! - A new package, `@nuvui/charts`, for charts. It's installed next to `@nuvui/react` and `recharts` 3, which are peer dependencies, and has a stylesheet of its own, `@nuvui/charts/styles.css`. A chart is built from Recharts' own parts, and this package is what goes around them.
  
  - `ChartContainer`: the box a Recharts chart goes in. It sizes the chart to its space, names it, and sets three CSS variables for each series of a config: its color, its fill and the dashes of its line. A series with no color takes the next of the theme's eight chart colors. Recharts' axes, grid, labels and cursor are styled from the tokens. Because a color is a variable, a new theme recolors a chart without it being drawn again.
  - `chartColor`, `chartFill` and `chartDash`: the text of those variables, for Recharts' `stroke`, `fill` and `strokeDasharray`.
  - Patterns: with `patterns` on the container each series gets a fill and a dash of its own, so series can be told apart without color. A `pattern` or `dash` on one series is always drawn. Where the browser forces colors, every series is drawn in the system's text color and patterned.
  - `ChartTooltip` and `ChartTooltipContent`: Recharts' tooltip with the library's look, the labels from the config, and a sample of each series that shows its pattern or dashes. It's a live region, as Recharts' own is.
  - `ChartLegend` and `ChartLegendContent`: Recharts' legend, with the series in the config's order.
  - `ChartTable`: the chart's numbers as a table, for screen readers only or drawn under the chart.

### Patch Changes

- Updated dependencies [[`96ea5b0`](https://github.com/Nuvraxis/nuvui/commit/96ea5b066337f2af55990c7c1ab5d2b6167c689d), [`f1888c3`](https://github.com/Nuvraxis/nuvui/commit/f1888c3dd1ae3d577a019a5e90736cddbbbea98e), [`593695e`](https://github.com/Nuvraxis/nuvui/commit/593695e160e11aa9dd63d6f47ce4cdb4093ac63e), [`4fd9569`](https://github.com/Nuvraxis/nuvui/commit/4fd9569dd181fb77194aebdcca84ed76247d0884), [`28459a2`](https://github.com/Nuvraxis/nuvui/commit/28459a2bb5bbab719610be3a7cdd95078bae10c7), [`803ca37`](https://github.com/Nuvraxis/nuvui/commit/803ca371a159e47e0b883445e25a351bcb84ee7b), [`e4fef87`](https://github.com/Nuvraxis/nuvui/commit/e4fef8740a1021d9f55c3ddf049412b44cb4c557), [`c59eabf`](https://github.com/Nuvraxis/nuvui/commit/c59eabfef3028bd4d4a0417ca88dc88d978f706d), [`e47ff84`](https://github.com/Nuvraxis/nuvui/commit/e47ff846062fb1a742ff56d4021a06a8a5eebbc5)]:
  - @nuvui/react@0.1.0
