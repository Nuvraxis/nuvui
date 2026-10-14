<!-- Written by apps/docs/scripts/agent-skill.mjs from apps/docs/content/docs/components/radio-group.mdx. Don't edit it here: run `pnpm skill`. -->

# RadioGroup

A set of options where exactly one can be picked. It works with labels, the arrow keys and forms.

Use a radio group to pick one of a few options that are worth showing all at once. With more than about five, a [select](select.md) takes less room. If each option can be on or off by itself, those are [checkboxes](checkbox.md).

```tsx
import { RadioGroup, RadioGroupItem } from "@nuvui/react";

const row = { display: "flex", alignItems: "center", gap: 8 };

export default function Example() {
  return (
    <RadioGroup aria-label="Plan" defaultValue="team">
      <div style={row}>
        <RadioGroupItem value="free" id="radio-free" />
        <label htmlFor="radio-free">Free</label>
      </div>
      <div style={row}>
        <RadioGroupItem value="team" id="radio-team" />
        <label htmlFor="radio-team">Team</label>
      </div>
      <div style={row}>
        <RadioGroupItem value="company" id="radio-company" />
        <label htmlFor="radio-company">Company</label>
      </div>
    </RadioGroup>
  );
}
```

## Install

```sh
pnpm add @nuvui/react
```

## Import

```tsx
import { RadioGroup, RadioGroupItem } from "@nuvui/react";
```

The styles come from `@nuvui/react/styles.css`, which you load once for the whole app. [Getting started](../index.md) covers that, and how to load only this component's CSS.

## Parts

| Part | What it is |
| --- | --- |
| `RadioGroup` | Holds the value and lays the options out. |
| `RadioGroupItem` | One option: the circle. Its label is yours to write next to it. |

## Props

### RadioGroup

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `value` | `string \| null` |  | The picked option, when you control it yourself. Use it with `onValueChange`. |
| `defaultValue` | `string` |  | The option picked at first, when you don't control it. |
| `onValueChange` | `((value: string) => void)` |  | Called with an option's `value` when it's picked. |
| `orientation` | `"horizontal" \| "vertical"` |  | `"horizontal"` puts the options side by side. It also decides which arrow keys move between them. |
| `disabled` | `boolean` |  | Disables every option. |
| `required` | `boolean` |  | Marks the group as required. Inside a form, the browser won't submit until an option is picked. |
| `name` | `string` |  | The name the value is submitted under in a form. |
| `dir` | `"ltr" \| "rtl"` |  | The reading direction. In `"rtl"` the left and right arrow keys swap. |
| `loop` | `boolean` |  | Whether the arrow keys wrap around from the last option to the first. It's `true` by default. |

### RadioGroupItem

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `value` (required) | `string` |  | What `onValueChange` and the form receive when this option is picked. |
| `disabled` | `boolean` |  | Stops this option from being picked. The arrow keys skip it. |

Both parts pass everything else to the element Radix renders. The [Radix Radio Group reference](https://www.radix-ui.com/primitives/docs/components/radio-group#api-reference) has the full list.

## Side by side

```tsx
import { RadioGroup, RadioGroupItem } from "@nuvui/react";

const row = { display: "flex", alignItems: "center", gap: 8 };

export default function Example() {
  return (
    <RadioGroup
      aria-label="Size"
      orientation="horizontal"
      defaultValue="m"
      style={{ "--nuv-radio-group-gap": "24px" } as never}
    >
      <div style={row}>
        <RadioGroupItem value="s" id="radio-s" />
        <label htmlFor="radio-s">Small</label>
      </div>
      <div style={row}>
        <RadioGroupItem value="m" id="radio-m" />
        <label htmlFor="radio-m">Medium</label>
      </div>
      <div style={row}>
        <RadioGroupItem value="l" id="radio-l" disabled />
        <label htmlFor="radio-l">Large, sold out</label>
      </div>
    </RadioGroup>
  );
}
```

## Controlling it yourself

```tsx
"use client";

import { RadioGroup, RadioGroupItem } from "@nuvui/react";
import { useState } from "react";

const row = { display: "flex", alignItems: "center", gap: 8 };
const prices = { month: "$12 a month", year: "$120 a year" };

export default function Example() {
  const [period, setPeriod] = useState<keyof typeof prices>("month");

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <RadioGroup
        aria-label="Billing period"
        value={period}
        onValueChange={(value) => setPeriod(value as keyof typeof prices)}
      >
        <div style={row}>
          <RadioGroupItem value="month" id="radio-month" />
          <label htmlFor="radio-month">Monthly</label>
        </div>
        <div style={row}>
          <RadioGroupItem value="year" id="radio-year" />
          <label htmlFor="radio-year">Yearly</label>
        </div>
      </RadioGroup>
      <output aria-live="polite">You pay {prices[period]}.</output>
    </div>
  );
}
```

## In a form

Give `RadioGroup` a `name` and the picked value is submitted with the form. Inside a `<form>`, Radix renders a hidden `<input type="radio">` next to each circle, so `FormData` and `required` both work.

## On small screens

The circle is 20 pixels, which is too small for a finger. On a touch screen the area that responds to a tap is 44 by 44 pixels, centered on the circle, and the rows of a vertical group are spaced so that two of those areas don't overlap. With a mouse the rows are 12 pixels apart.

That spacing assumes each label is one line. If yours wrap, or you lay the group out yourself, set `--nuv-radio-group-gap`.

## Accessibility

### Keyboard

| Key | What it does |
| --- | --- |
| <kbd>Tab</kbd> | Moves focus into the group, to the picked option or the first one, and out again. The group is one tab stop. |
| <kbd>↓</kbd> or <kbd>→</kbd> | Moves to the next option and picks it. Disabled options are skipped. |
| <kbd>↑</kbd> or <kbd>←</kbd> | Moves to the previous option and picks it. |
| <kbd>Space</kbd> | Picks the option that has focus, if it isn't picked. |

In a right-to-left group, <kbd>←</kbd> and <kbd>→</kbd> swap.

### What the component handles

Most of this is Radix. The library doesn't change it.

- The group has `role="radiogroup"` and each option `role="radio"` with `aria-checked`.
- A click on a `<label>` that points at an option picks it.
- The edge of the circle uses `--color-border-strong`, which has at least 3:1 contrast with the page in every theme, so an empty circle is still visible as a control.
- The picked option is filled as well as marked with a dot, and the dot is drawn in the text color, so it's still there where the browser forces its own colors.
- Keyboard focus shows a 2 pixel ring in `--color-ring`.

### What you need to handle

- Name the group, so people know what question the options answer. Use `aria-label`, `aria-labelledby`, or a [Fieldset](fieldset.md) with a legend around it.
- Give each option a `<label>` whose `htmlFor` matches its `id`.
- Start with an option picked when one is a sensible default. A radio group can't be put back to empty once something is picked.

## CSS variables

Set any of these on the group, or on anything around it.

```css
.plans {
  --nuv-radio-group-size: 1.5rem;
}
```

| Variable | Default | What it sets |
| --- | --- | --- |
| `--nuv-radio-group-gap` | `calc(var(--nuv-touch-size) - var(--nuv-radio-group-size, 1.25rem))`, `calc(var(--spacing) * 3)` | Space between options. The default differs between touch screens and a mouse. |
| `--nuv-radio-group-size` | `1.25rem` | Width and height of the circle. |
| `--nuv-radio-group-border` | `var(--color-border-strong)` | Border color while not picked. |
| `--nuv-radio-group-bg` | `var(--color-surface)` | Background color while not picked. |
| `--nuv-radio-group-fg` | `var(--color-primary-foreground)` | Color of the dot. |
| `--nuv-radio-group-checked-bg` | `var(--color-primary)` | Background and border color while picked. |

## Classes

| Class | What it's on |
| --- | --- |
| `.nuv-radio-group` | RadioGroup. |
| `.nuv-radio-group__dot` | The dot. |
| `.nuv-radio-group__indicator` | The wrapper around the dot. Radix only renders it while the option is picked. |
| `.nuv-radio-group__item` | RadioGroupItem, which is the circle and a button. |

Radix sets `data-state` on an option to `checked` or `unchecked`, `data-disabled` when it's disabled, and `data-orientation` on the group when `orientation` is set.

## Server components

The radio group parts are client components. They carry `"use client"`, and the build checks that the directive is still there in the published files.

You can put a group together inside a server component, as the first example on this page does. It needs a client component of your own once you pass `onValueChange` or control `value`.

## Do and don't

**Do**

- List the options in an order people can predict.
- Make the label clickable by linking it with `htmlFor`. It's a much bigger target than the circle.

**Don't**

- Don't use radio buttons for a yes or no. That's one checkbox or a switch.
- Don't use them for something that takes effect at once and changes the page, such as a view. That's a [toggle group](toggle-group.md) or tabs.
