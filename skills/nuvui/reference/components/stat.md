<!-- Written by apps/docs/scripts/agent-skill.mjs from apps/docs/content/docs/components/stat.mdx. Don't edit it here: run `pnpm skill`. -->

# Stat

One figure for a dashboard, with what it counts, the number, how it changed, and room for a small chart.

Use a stat for a number someone checks at a glance: revenue this month, tickets open, seats in use. `StatGroup` sets several side by side.

```tsx
import {
  FormattedNumber,
  Stat,
  StatDescription,
  StatGroup,
  StatLabel,
  StatValue,
  Trend,
} from "@nuvui/react";

export default function Example() {
  return (
    <StatGroup style={{ inlineSize: "100%" }}>
      <Stat>
        <StatLabel>Revenue</StatLabel>
        <StatValue>
          <FormattedNumber
            value={48250}
            currency="USD"
            maximumFractionDigits={0}
          />
        </StatValue>
        <StatDescription>
          <Trend value={0.125} /> against last month
        </StatDescription>
      </Stat>
      <Stat>
        <StatLabel>New customers</StatLabel>
        <StatValue>
          <FormattedNumber value={1284} />
        </StatValue>
        <StatDescription>
          <Trend value={-0.032} /> against last month
        </StatDescription>
      </Stat>
      <Stat>
        <StatLabel>Failed payments</StatLabel>
        <StatValue>
          <FormattedNumber value={17} />
        </StatValue>
        <StatDescription>
          <Trend value={-0.31} good="down" /> against last month
        </StatDescription>
      </Stat>
    </StatGroup>
  );
}
```

## Install

```sh
pnpm add @nuvui/react
```

## Import

```tsx
import {
  Stat,
  StatChart,
  StatDescription,
  StatGroup,
  StatLabel,
  StatValue,
} from "@nuvui/react";
```

The styles come from `@nuvui/react/styles.css`, which you load once for the whole app. [Getting started](../index.md) covers that, and how to load only this component's CSS.

## Parts

| Part | What it is |
| --- | --- |
| `Stat` | One figure. A card unless you say otherwise. |
| `StatLabel` | What the number counts. |
| `StatValue` | The number, large. |
| `StatDescription` | A line under it: how it changed, and against what. |
| `StatChart` | Room for a small chart, 48 pixels high. |
| `StatGroup` | Several stats, as many to a row as fit. |

Only `Stat`, `StatLabel` and `StatValue` are needed. Put the label first: a screen reader reads the parts in the order they're written, and "Revenue, $48,250" makes sense where "$48,250, Revenue" makes someone wait.

## Props

### Stat

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `variant` | `"card" \| "plain"` | `"card"` | `"card"` draws a surface with an edge around the figure. `"plain"` draws nothing, for a figure that's already inside a card or a table. |

The other parts add no props of their own. Each takes what its element takes, including `ref` and `className`.

## The number and its change

The parts take any children. [`FormattedNumber`](formatted-number.md) writes the number for a language and region, and [`Trend`](trend.md) says which way it moved. Neither is required: a value can be plain text, such as "4m 12s".

## With a chart

`StatChart` is a box with a height, after the rest. What's drawn in it is yours: a sparkline from [`@nuvui/charts`](../charts/index.md), or a few lines of SVG as here. The core doesn't depend on a charting library, so it draws nothing itself.

```tsx
import {
  FormattedNumber,
  Stat,
  StatChart,
  StatDescription,
  StatLabel,
  StatValue,
  Trend,
} from "@nuvui/react";

const weeks = [31, 34, 33, 38, 41, 39, 44, 47, 46, 52, 55, 61];

// The line, in a box 110 wide and 40 high, with the first week at the left.
const points = weeks
  .map((value, index) => `${index * 10},${40 - ((value - 30) / 32) * 40}`)
  .join(" ");

export default function Example() {
  return (
    <Stat style={{ inlineSize: "16rem" }}>
      <StatLabel>Active teams</StatLabel>
      <StatValue>
        <FormattedNumber value={61} />
      </StatValue>
      <StatDescription>
        <Trend value={0.109} /> in twelve weeks
      </StatDescription>
      {/* The number and the trend already say it, so the picture is hidden
          from screen readers. */}
      <StatChart>
        <svg
          aria-hidden="true"
          viewBox="0 0 110 40"
          preserveAspectRatio="none"
          width="100%"
          height="100%"
          fill="none"
          stroke="var(--color-chart-1)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points={points} vectorEffect="non-scaling-stroke" />
        </svg>
      </StatChart>
    </Stat>
  );
}
```

When the number and the trend already say what the chart shows, hide the chart from screen readers with `aria-hidden="true"`. When the chart says more, give it a name and a table of its numbers, as the [charts](../charts/index.md) pages describe.

## Plain, inside something else

`variant="plain"` draws no edge, no fill and no padding, for a stat that sits in a [card](card.md) or a table cell that already has them.

```tsx
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  FormattedNumber,
  Stat,
  StatDescription,
  StatGroup,
  StatLabel,
  StatValue,
} from "@nuvui/react";

export default function Example() {
  return (
    <Card style={{ inlineSize: "100%" }}>
      <CardHeader>
        <CardTitle>This billing period</CardTitle>
      </CardHeader>
      <CardContent>
        <StatGroup>
          <Stat variant="plain">
            <StatLabel>Seats in use</StatLabel>
            <StatValue>
              <FormattedNumber value={42} />
            </StatValue>
            <StatDescription>of 50 on the plan</StatDescription>
          </Stat>
          <Stat variant="plain">
            <StatLabel>Next invoice</StatLabel>
            <StatValue>
              <FormattedNumber value={1260} currency="USD" />
            </StatValue>
            <StatDescription>on 1 November</StatDescription>
          </Stat>
        </StatGroup>
      </CardContent>
    </Card>
  );
}
```

## In a group

`StatGroup` is a grid that fits as many columns as it can at a least width of 13rem, all the same width. On a phone that's one column. It sets no number of columns, so it works in a full-width page and in a narrow panel without a breakpoint. Change the least width with `--nuv-stat-group-min`.

## Accessibility

A stat has no keyboard behavior. It isn't a control and can't take focus.

### What the component handles

- The parts are read in the order they're written, with nothing hidden and nothing added.
- The number's digits are one width each, so a value that updates doesn't shift.
- A card's edge is a border, which is still drawn where the browser forces its own colors.
- The label and the description have at least 4.5:1 against the card in every theme.

### What you need to handle

- Write the label first, then the value.
- Say what a change is measured against, in `StatDescription`.
- A group of stats under a heading is found by that heading. Give the section one.
- A value that changes while the page is open isn't announced. For one that matters, such as an error count passing a limit, say it in a [toast](toast.md) or an element with `role="status"`.

## CSS variables

Set any of these on a `Stat`, on a `StatGroup`, or on anything around them.

```css
.dashboard {
  --nuv-stat-group-min: 16rem;
  --nuv-stat-shadow: none;
}
```

| Variable | Default | What it sets |
| --- | --- | --- |
| `--nuv-stat-gap` | `calc(var(--spacing) * 1.5)` | Space between the parts. |
| `--nuv-stat-fg` | `var(--color-foreground)`, `var(--color-surface-foreground)` | Text color. |
| `--nuv-stat-padding` | `calc(var(--spacing) * 4)`, `calc(var(--spacing) * 5)` | Padding of a card. 16 pixels on a phone and 20 from the `sm` breakpoint up. |
| `--nuv-stat-border` | `var(--color-border)` | Border color of a card. |
| `--nuv-stat-radius` | `var(--radius-lg)` | Corner radius of a card. |
| `--nuv-stat-bg` | `var(--color-surface)` | Background color of a card. |
| `--nuv-stat-shadow` | `var(--shadow-xs)` | Shadow of a card. |
| `--nuv-stat-muted-fg` | `var(--color-muted-foreground)` | Color of the label and the description. Keep it at 4.5:1 against the background. |
| `--nuv-stat-value-size` | `var(--text-2xl)` | Font size of the number. |
| `--nuv-stat-chart-height` | `3rem` | Height of the chart's box. |
| `--nuv-stat-group-min` | `13rem` | The least width of a column in a group. A narrower group has one column. |
| `--nuv-stat-group-gap` | `calc(var(--spacing) * 4)` | Space between the stats in a group. |

## Classes

| Class | What it's on |
| --- | --- |
| `.nuv-stat` | Every stat. |
| `.nuv-stat--card` | variant="card", the default. |
| `.nuv-stat-group` | StatGroup |
| `.nuv-stat__chart` | StatChart |
| `.nuv-stat__description` | StatDescription |
| `.nuv-stat__label` | StatLabel |
| `.nuv-stat__value` | StatValue |

## Server components

No part has a `"use client"` directive or uses state, so all of them render in a server component as they are. A chart from `@nuvui/charts` is a client component, in a file of its own.

## Do and don't

**Do**

- Keep a group to the few numbers that matter on the page. Four is easy to take in, and twelve isn't.
- Use the same order of parts in every stat of a group.

**Don't**

- Don't make a stat a link without saying where it goes. Wrap it in a link whose name says so, or put a link in the description.
- Don't use a stat for a number that needs a sentence to explain. That's text.
