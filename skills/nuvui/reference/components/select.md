<!-- Written by apps/docs/scripts/agent-skill.mjs from apps/docs/content/docs/components/select.mdx. Don't edit it here: run `pnpm skill`. -->

# Select

A control for picking one option from a list. It works with a label, the keyboard and forms.

Use a select to pick one value from a list that's too long to show in full, such as a country or a time zone. With only a few options, showing them all on the page is quicker to use.

On a phone, the browser's own `<select>` opens the system picker, which many people find easier. Reach for this component when the options need styling or grouping that the native one can't do.

```tsx
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@nuvui/react";

export default function Example() {
  return (
    <div style={{ display: "grid", gap: 6 }}>
      <label htmlFor="fruit">Fruit</label>
      <Select>
        <SelectTrigger id="fruit">
          <SelectValue placeholder="Pick a fruit" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="apple">Apple</SelectItem>
          <SelectItem value="banana">Banana</SelectItem>
          <SelectItem value="cherry">Cherry</SelectItem>
          <SelectItem value="grape" disabled>
            Grape
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@nuvui/react";
```

The styles come from `@nuvui/react/styles.css`, which you load once for the whole app. [Getting started](../index.md) covers that, and how to load only this component's CSS.

## Parts

| Part | What it is |
| --- | --- |
| `Select` | Holds the value and the open state. Renders nothing itself. |
| `SelectTrigger` | The control on the page. It shows the value and an arrow. |
| `SelectValue` | The text inside the trigger: the chosen option, or the placeholder. |
| `SelectContent` | The list that opens. |
| `SelectItem` | One option. |
| `SelectGroup` | Wraps options that belong together. |
| `SelectLabel` | The heading of a group. |
| `SelectSeparator` | A line between groups. |

These are separate exports, not properties of `Select`. `Select.Item` isn't available, because property access on a client component doesn't work from a server component.

## Props

### Select

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `value` | `string` |  | The chosen option, when you control it yourself. Use it with `onValueChange`. |
| `defaultValue` | `string` |  | The option chosen at first, when you don't control it. |
| `onValueChange` | `((value: string) => void)` |  | Called with an option's `value` when it's chosen. |
| `disabled` | `boolean` |  | Stops the select from being opened or focused. |
| `required` | `boolean` |  | Marks it as required. Inside a form, the browser won't submit until an option is chosen. |
| `name` | `string` |  | The name the value is submitted under in a form. |
| `open` | `boolean` |  | Whether the list is open, when you control that yourself. |
| `onOpenChange` | `((open: boolean) => void)` |  | Called when the list opens or closes. |
| `dir` | `"ltr" \| "rtl"` |  | The reading direction of the list. |

### SelectTrigger

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `variant` | `"field" \| "inline"` | `"field"` | `"inline"` is a select that sits in a sentence: no box, the size of the text around it, as wide as the option it shows. |

### SelectValue

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `placeholder` | `ReactNode` |  | What the trigger shows while nothing is chosen. |

### SelectContent

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `position` | `"item-aligned" \| "popper"` | `"popper"` | `"popper"` opens the list under the trigger, like a menu. `"item-aligned"` lays it over the trigger with the selected option on top of it, the way a native select does on a Mac. |
| `sideOffset` | `number` | `6` | The gap between the trigger and the list, in pixels. Only applies with `position="popper"`. |
| `collisionPadding` | `number \| Partial<Record<"bottom" \| "left" \| "right" \| "top", number>>` | `8` | How close the list may get to the edge of the screen, in pixels. Only applies with `position="popper"`. |
| `container` | `DocumentFragment \| Element \| null` | `document.body` | The element the list is rendered into. Set this when the list should pick up a `data-theme` from a section of the page. |

### SelectItem

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `value` (required) | `string` |  | What `onValueChange` and the form receive when this option is chosen. It can't be an empty string. |
| `disabled` | `boolean` |  | Stops the option from being chosen. The arrow keys skip it. |
| `textValue` | `string` |  | The text that typing a letter matches against. Only needed when the option's content isn't plain text. |

The other parts take the same props as the Radix parts they wrap. The [Radix Select reference](https://www.radix-ui.com/primitives/docs/components/select#api-reference) lists them.

## Groups

```tsx
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@nuvui/react";

export default function Example() {
  return (
    <div style={{ display: "grid", gap: 6 }}>
      <label htmlFor="city">Nearest office</label>
      <Select defaultValue="lisbon">
        <SelectTrigger id="city">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Europe</SelectLabel>
            <SelectItem value="berlin">Berlin</SelectItem>
            <SelectItem value="lisbon">Lisbon</SelectItem>
            <SelectItem value="oslo">Oslo</SelectItem>
          </SelectGroup>
          <SelectSeparator />
          <SelectGroup>
            <SelectLabel>Asia</SelectLabel>
            <SelectItem value="kochi">Kochi</SelectItem>
            <SelectItem value="osaka">Osaka</SelectItem>
            <SelectItem value="seoul">Seoul</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}
```

## States

```tsx
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@nuvui/react";

const field = { display: "grid", gap: 6 };

export default function Example() {
  return (
    <div style={{ display: "grid", gap: 20 }}>
      <div style={field}>
        <label htmlFor="plan-disabled">Disabled</label>
        <Select disabled defaultValue="free">
          <SelectTrigger id="plan-disabled">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="free">Free</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div style={field}>
        <label htmlFor="plan-invalid">Invalid</label>
        <Select>
          <SelectTrigger
            id="plan-invalid"
            aria-invalid
            aria-describedby="plan-error"
          >
            <SelectValue placeholder="Pick a plan" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="free">Free</SelectItem>
            <SelectItem value="team">Team</SelectItem>
          </SelectContent>
        </Select>
        <span id="plan-error" style={{ color: "var(--color-danger)" }}>
          Pick a plan to continue.
        </span>
      </div>
    </div>
  );
}
```

Set `aria-invalid` on `SelectTrigger` and its edge turns to the danger color. Color isn't enough to go on, so say what's wrong in words too, and tie the message to the trigger with `aria-describedby`.

## Controlling it yourself

```tsx
"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@nuvui/react";
import { useState } from "react";

const sizes = { s: "Small", m: "Medium", l: "Large" };

export default function Example() {
  const [size, setSize] = useState("m");

  return (
    <div style={{ display: "grid", gap: 6 }}>
      <label htmlFor="size">Size</label>
      <Select value={size} onValueChange={setSize}>
        <SelectTrigger id="size">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(sizes).map(([value, name]) => (
            <SelectItem key={value} value={value}>
              {name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p style={{ margin: 0 }}>The value is "{size}".</p>
    </div>
  );
}
```

## In a form

Give `Select` a `name` and the value is submitted with the form. Inside a `<form>`, Radix renders a hidden native `<select>` next to the trigger, so `FormData` and `required` both work.

## Width

The trigger is at least 12rem wide and grows with the text in it, up to the width of its container. Set `--nuv-select-width: 100%` to make it fill the container.

A value that's still too long is cut short with an ellipsis. The full text is in the list.

## In a sentence

`variant="inline"` on the trigger is a select with no box, for a choice that reads as part of a sentence: "164 orders in the last 30 days". It takes the size, the weight and the color of the text around it, and is as wide as the option it shows.

```tsx
"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@nuvui/react";
import { useState } from "react";

const counts: Record<string, number> = { "7": 38, "30": 164, "365": 1912 };

export default function Example() {
  const [period, setPeriod] = useState("30");

  return (
    <p style={{ margin: 0, fontSize: 18 }}>
      <span aria-live="polite">{counts[period]} orders</span> in{" "}
      <Select value={period} onValueChange={setPeriod}>
        <SelectTrigger variant="inline" aria-label="Period">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="7">the last 7 days</SelectItem>
          <SelectItem value="30">the last 30 days</SelectItem>
          <SelectItem value="365">the last year</SelectItem>
        </SelectContent>
      </Select>
      .
    </p>
  );
}
```

It has no label beside it, so name it with `aria-label`. Keep it to one in a sentence, or two: every one is a stop for the eye, and a sentence full of them is a form.

## Where the list opens

By default the list opens under the trigger, like a menu, and is at least as wide as it. With `position="item-aligned"` it lays itself over the trigger with the chosen option on top of it, the way a native select does on a Mac.

## On small screens

The trigger is 44 pixels tall on a touch screen and 40 with a mouse. Options are 44 and 32.

The list is never taller than the room around the trigger. A long one scrolls inside itself. Radix hides its scrollbar, so an arrow appears at the top or bottom edge whenever there's more in that direction.

## Accessibility

### Keyboard

| Key | What it does |
| --- | --- |
| <kbd>Enter</kbd>, <kbd>Space</kbd> or <kbd>↓</kbd> | On the trigger, opens the list with focus on the chosen option, or the first one. |
| <kbd>↓</kbd> and <kbd>↑</kbd> | Move to the next or previous option. Disabled options are skipped. |
| <kbd>Home</kbd> and <kbd>End</kbd> | Move to the first or last option. |
| A letter | In the open list, moves to the next option that starts with it. On the closed trigger, chooses that option without opening the list. |
| <kbd>Enter</kbd> or <kbd>Space</kbd> | Chooses the focused option and closes the list. |
| <kbd>Esc</kbd> | Closes the list and keeps the value it had. |

### What the component handles

Most of this is Radix. The library doesn't change it.

- The trigger has `role="combobox"` with `aria-expanded`. The list has `role="listbox"`, the options have `role="option"`, and each group is named by its `SelectLabel`.
- A click on a `<label>` that points at the trigger opens the list.
- Focus moves into the list when it opens and back to the trigger when it closes.
- The trigger's edge uses `--color-border-strong`, which has at least 3:1 contrast with the page in light and dark.
- The option that has focus is filled with the primary color. That fill is the focus indicator: it has at least 3:1 contrast with the list, and the text on it keeps 4.5:1. Radix moves focus to the option under the pointer too, so hovering and arrowing look the same.
- Where the browser forces its own colors, as Windows high contrast does, the fill isn't drawn. The focused option has an outline there instead.
- The check mark on the chosen option isn't copied into the trigger with its text.
- The list only animates when the visitor hasn't asked for reduced motion.

### What you need to handle

- Give it a name. Use a `<label>` whose `htmlFor` matches the `id` on `SelectTrigger`, or put `aria-label` on the trigger when there's no visible label.
- Don't use the placeholder as the label. It goes away once something is chosen.
- When the value is wrong, set `aria-invalid` and describe the problem in text.

### A note on automated checks

While the list is open, Radix hides the rest of the page from screen readers. If you run axe on a page in that state, it reports the trigger under its `aria-hidden-focus` rule, because the trigger is a focusable element inside the hidden part.

Focus can't actually get there until the list closes. The library's own tests leave that rule out for open lists for this reason.

## CSS variables

The trigger sits in the page, so its variables can be set on it or on anything around it. The list renders at the end of `<body>`, so set the `--nuv-select-content-*` and row variables on `:root` or `body`, or straight on `SelectContent`.

```css
.filters {
  --nuv-select-width: 100%;
}
```

| Variable | Default | What it sets |
| --- | --- | --- |
| `--nuv-select-width` | `12rem` | The narrowest the trigger gets. Set it to 100% to fill the container. |
| `--nuv-select-height` | `var(--nuv-touch-size)`, `var(--nuv-control-height-md)` | Minimum height of the trigger. The default differs between touch screens and a mouse. |
| `--nuv-select-border` | `var(--color-border-strong)` | Border color of the trigger. |
| `--nuv-select-radius` | `var(--radius-md)`, `var(--radius-sm)` | Corner radius of the trigger. |
| `--nuv-select-bg` | `var(--color-surface)` | Background color of the trigger. |
| `--nuv-select-fg` | `var(--color-foreground)`, `inherit` | Text color of the trigger once something is chosen. |
| `--nuv-select-inline-font-weight` | `var(--font-weight-medium)` | Weight of an inline trigger's text. Medium by default, so it stands out from the sentence. |
| `--nuv-select-inline-line` | `var(--color-border-strong)` | Color of the line under an inline trigger. Keep it at 3:1 against the background. |
| `--nuv-select-content-max-height` | `100vh` | The most height the list takes before it scrolls. It never goes past the room on the screen. |
| `--nuv-select-content-border` | `var(--color-border)` | Border color of the list, and the color of the separators. |
| `--nuv-select-content-radius` | `var(--radius-lg)` | Corner radius of the list. |
| `--nuv-select-content-bg` | `var(--color-surface)` | Background color of the list. |
| `--nuv-select-content-shadow` | `var(--shadow-lg)` | Shadow under the list. |
| `--nuv-select-content-fg` | `var(--color-surface-foreground)` | Text color of the list. |
| `--nuv-select-item-height` | `var(--nuv-touch-size)`, `var(--nuv-control-height-sm)` | Minimum height of an option. The default differs between touch screens and a mouse. |
| `--nuv-select-highlight-bg` | `var(--color-primary)` | Background of the option that has focus, from the pointer or the arrow keys. Keep it at 3:1 against the list. |
| `--nuv-select-highlight-fg` | `var(--color-primary-foreground)` | Text color of that option. |

## Classes

| Class | What it's on |
| --- | --- |
| `.nuv-select` | SelectTrigger. |
| `.nuv-select--inline` | SelectTrigger with variant="inline". |
| `.nuv-select__content` | SelectContent. |
| `.nuv-select__icon` | The arrow in the trigger. |
| `.nuv-select__indicator` | The check at the end of the chosen option. |
| `.nuv-select__item` | SelectItem. |
| `.nuv-select__label` | SelectLabel. |
| `.nuv-select__scroll-button` | The arrows at the top and bottom edge of a list that's too long to show whole. |
| `.nuv-select__separator` | SelectSeparator. |
| `.nuv-select__value` | The wrapper around SelectValue. It's what cuts a long value short. |
| `.nuv-select__viewport` | The scrolling area inside the list. |

Radix sets `data-placeholder` on the trigger while nothing is chosen, `data-state` on the trigger, the list and the options, `data-highlighted` on the option that has focus, and `data-disabled` on anything disabled.

## Server components

The select parts are client components. They carry `"use client"`, and the build checks that the directive is still there in the published files.

You can put a select together inside a server component, as most examples on this page do. It only needs a client component of your own when you control `value` or pass `onValueChange`.

## Themed sections

A list opened from inside a `data-theme="dark"` section doesn't inherit that theme, because it isn't rendered inside the section. Pass the section's element as `container` to `SelectContent` and it will be.

## Do and don't

**Do**

- Put a visible label above or beside it.
- Order the options in a way people can predict: alphabetical, or most used first.
- Start with a sensible option chosen when there is one.

**Don't**

- Don't use a select for two or three options. Show them.
- Don't use one for actions. That's a [dropdown menu](dropdown-menu.md).
- Don't make people scroll a list of hundreds. Let them type to search instead, with a [combobox](combobox.md).
