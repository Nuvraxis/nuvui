<!-- Written by apps/docs/scripts/agent-skill.mjs from apps/docs/content/docs/components/number-field.mdx. Don't edit it here: run `pnpm skill`. -->

# NumberField

A field for a number that can be typed or stepped, with limits, a step size, and the number written for a language and region.

Use a number field for a quantity someone sets: seats, a budget, a discount. It takes typing, a button at each end, and the arrow keys. For a number picked by feel from a range, use a [slider](slider.md).

```tsx
import { Label, NumberField } from "@nuvui/react";

export default function Example() {
  return (
    <div
      style={{
        display: "grid",
        gap: 6,
        inlineSize: "100%",
        maxInlineSize: 200,
      }}
    >
      <Label htmlFor="number-seats">Seats</Label>
      <NumberField id="number-seats" defaultValue={5} min={1} max={50} />
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
import { NumberField } from "@nuvui/react";
```

The styles come from `@nuvui/react/styles.css`, which you load once for the whole app. [Getting started](../index.md) covers that, and how to load only this component's CSS.

## Props

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `value` | `number \| null` |  | The number, when you control it yourself. `null` is an empty field. |
| `defaultValue` | `number \| null` |  | The number at first, when you don't control it. |
| `onValueChange` | `((value: number \| null) => void)` |  | Called with the new number when it changes: on a press of a button or an arrow key, and when typing is finished, which is on Enter and on leaving the field. Not on every key. `null` means the field was emptied. |
| `min` | `number` |  | The least the number can be. A smaller one is raised to it. |
| `max` | `number` |  | The most the number can be. A larger one is lowered to it. |
| `step` | `number` | `1` | How much a button or an arrow key changes the number by. |
| `largeStep` | `number` |  | How much Page Up and Page Down change it by. Ten steps unless you say otherwise. |
| `format` | `FormatNumberOptions` |  | How the number is written when it isn't being typed: a locale, a currency, a percentage, a number of decimals. What's typed is read by the same rules, so in German `1.234,5` is one number. |
| `incrementLabel` | `string` | `"Increase"` | Accessible name of the button that raises the number. Translate it with the rest of your interface. |
| `decrementLabel` | `string` | `"Decrease"` | Accessible name of the button that lowers the number. Translate it with the rest of your interface. |
| `name` | `string` |  | The name the number is submitted under in a form. What's sent is the plain number, such as `1234.5`, however it's written on the screen. |

Everything else is passed to the `<input>`, including `ref`, `id`, `disabled`, `readOnly`, `required` and `placeholder`. `className` goes on the box around it.

## When the number changes

`onValueChange` is called when the number changes, and not on every key. A press of a button or an arrow key changes it at once. Typing changes it when the typing is finished: on Enter, and on leaving the field. Until then "12" on its way to "125" isn't reported as twelve.

What's typed is tidied when it's taken. A number past `min` or `max` is moved to the limit, a number with more decimals than the format shows is rounded to what it shows, and text that isn't a number is dropped, which puts the last number back. An emptied field is `null`.

## Formats

`format` takes what [`FormattedNumber`](formatted-number.md) does: a locale, a currency, a percentage, a number of decimals, a unit. The field shows the number that way when it isn't being typed into.

```tsx
import { Label, NumberField } from "@nuvui/react";

const row = {
  display: "grid",
  gap: 6,
  inlineSize: "100%",
  maxInlineSize: 220,
};

export default function Example() {
  return (
    <div style={{ display: "grid", gap: 16, inlineSize: "100%" }}>
      <div style={row}>
        <Label htmlFor="number-budget">Budget</Label>
        <NumberField
          id="number-budget"
          defaultValue={2500}
          min={0}
          step={50}
          format={{ currency: "USD", maximumFractionDigits: 0 }}
        />
      </div>
      <div style={row}>
        <Label htmlFor="number-discount">Discount</Label>
        <NumberField
          id="number-discount"
          defaultValue={0.15}
          min={0}
          max={1}
          step={0.05}
          format={{ format: "percent" }}
        />
      </div>
      <div style={row}>
        <Label htmlFor="number-weight">Weight, written the German way</Label>
        <NumberField
          id="number-weight"
          defaultValue={1234.5}
          min={0}
          step={0.5}
          format={{
            locale: "de-DE",
            options: { style: "unit", unit: "kilogram" },
          }}
        />
      </div>
    </div>
  );
}
```

Typing is read by the same rules. With a German locale `1.234,5` is one thousand two hundred and thirty-four and a half, and a currency sign or a unit that's typed along with the digits is ignored. A percentage is typed as people say it: 15 for 15%, which gives the value 0.15.

Give every field the locale your app is in. Left out, it's `"en-US"`, and never the visitor's own, so that the server and the browser write the same text.

## In a form

With a `name`, the number is submitted as plain digits, such as `1250`, however it's written on the screen. Inside a [field](field.md), the label, the description and the error are connected for you.

```tsx
"use client";

import {
  Button,
  Field,
  FieldControl,
  FieldDescription,
  FieldLabel,
  NumberField,
} from "@nuvui/react";
import { useState } from "react";

export default function Example() {
  const [sent, setSent] = useState<string>();

  return (
    <form
      style={{
        display: "grid",
        gap: 16,
        inlineSize: "100%",
        maxInlineSize: 260,
      }}
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        setSent(String(data.get("amount")));
      }}
    >
      <Field required>
        <FieldLabel>Amount</FieldLabel>
        <FieldControl>
          <NumberField
            name="amount"
            defaultValue={1250}
            min={0}
            step={10}
            format={{ currency: "EUR", locale: "de-DE" }}
          />
        </FieldControl>
        <FieldDescription>
          In euros. What's sent is the plain number.
        </FieldDescription>
      </Field>
      <Button type="submit">Send</Button>
      <output aria-live="polite">
        {sent === undefined ? "" : `Sent: ${sent}`}
      </output>
    </form>
  );
}
```

`required` stops the form while the field is empty. `min` and `max` can't fail: a number outside them is moved inside when it's taken.

## Accessibility

| Key | What it does |
| --- | --- |
| Arrow up, Arrow down | One step up or down. |
| Page up, Page down | A large step, ten steps unless `largeStep` says otherwise. |
| Home, End | To `min` or `max`, when there is one. |
| Enter | Takes what's typed. In a form it submits, as in any field. |

### What the component handles

- The input has `role="spinbutton"`, with the number, the limits, and the number as it's written on the screen, so a screen reader says "$2,500" and not "2500".
- The two buttons are named "Decrease" and "Increase". Tab doesn't stop on them, because the arrow keys do the same from the field. A screen reader and a switch can still reach and press them.
- A button is disabled at its limit.
- Holding a button repeats the step.
- A phone shows its number keypad where a negative number can't be typed, which is when `min` is zero or more. The keypad has a decimal point unless the format has no decimals.
- The focus ring goes around the whole box, and the box's edge turns red while the field is invalid.

### What you need to handle

- Give it a label, with a [`Label`](label.md) and an `id`, or a [`Field`](field.md).
- Translate the two button names. [Translation](../translation.md) lists them.
- Say the unit somewhere a screen reader gets it, when the format doesn't write one: in the label, as in "Weight in kilograms".
- Say the limits in a description when they aren't obvious. A number that's quietly moved to a limit is confusing without one.

## On small screens

Each button is 44 pixels to a finger, though it's drawn smaller. The text is 16 pixels on a touch screen, which keeps iOS from zooming the page in when the field takes focus.

## CSS variables

Set any of these on the field, or on anything around it.

```css
.quantity {
  --nuv-number-field-width: 8rem;
}
```

| Variable | Default | What it sets |
| --- | --- | --- |
| `--nuv-number-field-width` | `100%` | Width. It fills its container by default. |
| `--nuv-number-field-border` | `var(--color-border-strong)` | Border color of the box. |
| `--nuv-number-field-radius` | `var(--radius-md)` | Corner radius of the box. |
| `--nuv-number-field-bg` | `var(--color-surface)` | Background color of the box. |
| `--nuv-number-field-fg` | `var(--color-foreground)` | Text color. |
| `--nuv-number-field-height` | `var(--nuv-touch-size)`, `var(--nuv-control-height-md)` | Minimum height of the box. The buttons are sized from it. The default differs between touch screens and a mouse. |
| `--nuv-number-field-align` | `center` | Where the number sits between the buttons. In the middle by default. Set it to `end` to line numbers up in a column. |
| `--nuv-number-field-font-size` | `var(--text-base)`, `var(--text-sm)` | Font size. The default differs between touch screens and a mouse. |
| `--nuv-number-field-placeholder` | `var(--color-muted-foreground)` | Color of the placeholder. |
| `--nuv-number-field-button-radius` | `var(--radius-sm)` | Corner radius of the buttons. |
| `--nuv-number-field-button-fg` | `var(--color-muted-foreground)` | Color of the minus and the plus. |
| `--nuv-number-field-button-bg-hover` | `var(--color-muted)` | Background of a button while hovered. |

## Classes

| Class | What it's on |
| --- | --- |
| `.nuv-number-field` | The box around the input and the buttons. |
| `.nuv-number-field__button` | Each of the two buttons. |
| `.nuv-number-field__control` | The input. |

## Server components

NumberField starts with `"use client"`, because it keeps what's being typed. You can still render it from a server component, with plain props. `onValueChange` needs a client component.

## Do and don't

**Do**

- Set `min` and `max` wherever the number has them.
- Pick a `step` that matches how people change the number: 1 for seats, 50 for a budget.

**Don't**

- Don't use it for a number that isn't a quantity, such as a phone number, a postcode or a card number. Those are text: use an [input](input.md).
- Don't rely on the buttons for a large change. Typing has to work, and does.
