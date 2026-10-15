<!-- Written by apps/docs/scripts/agent-skill.mjs from apps/docs/content/docs/components/otp-field.mdx. Don't edit it here: run `pnpm skill`. -->

# OtpField

A row of boxes for a one-time code, one character each. Typing moves along them, and a pasted code fills them all.

Use it for a short code someone copies from a text message, an email or an authenticator app. For anything longer than about eight characters, or anything people have to remember, an [input](input.md) is easier to use.

```tsx
import { Label, OtpField } from "@nuvui/react";

export default function Example() {
  return (
    <div style={{ display: "grid", gap: 8, justifyItems: "start" }}>
      <Label asChild>
        <span id="otp-basic-label">Verification code</span>
      </Label>
      <OtpField aria-labelledby="otp-basic-label" />
    </div>
  );
}
```

> **Built on a Radix primitive that isn't at 1.0**
>
> This wraps Radix's One-Time Password Field, which is at version 0.1 and may still change. The package pins it to an exact version, and this component's own props are what the library promises to keep.

## Install

```sh
pnpm add @nuvui/react
```

## Import

```tsx
import { OtpField } from "@nuvui/react";
```

The styles come from `@nuvui/react/styles.css`, which you load once for the whole app. [Getting started](../index.md) covers that, and how to load only this component's CSS.

## Props

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `length` | `number` | `6` | How many characters the code has. One box is drawn for each. |
| `groupSize` | `number` |  | Draws a dash after every this many boxes, the way a code is often printed: 3 gives 123-456. The dash isn't part of the value. |
| `inputLabel` | `((position: number, length: number) => string)` | `(position, length) => 'Character ${position} of ${length}'` | Accessible name of one box, from its position, counted from 1, and the number of boxes. Translate it with the rest of your interface. |
| `required` | `boolean` | `false` | Inside a form, the browser won't submit until every box is filled. |

These come from Radix.

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `value` | `string` |  | The code, when you control it yourself. Use it with `onValueChange`. |
| `defaultValue` | `string` |  | The code it starts with, when you don't control it. |
| `onValueChange` | `((value: string) => void)` |  | Called with the whole code each time a box changes. |
| `validationType` | `OtpPrimitive.InputValidationType` |  | Which characters a box takes: `"numeric"`, `"alpha"`, `"alphanumeric"` or `"none"`. Anything else is ignored as it's typed or pasted. |
| `type` | `"password" \| "text"` |  | `"password"` shows dots in place of the characters. |
| `autoComplete` | `"off" \| "one-time-code"` |  | `"one-time-code"` lets the browser offer a code that has just arrived by text message. `"off"` stops that. |
| `autoSubmit` | `boolean` |  | Submits the form around it once the last box is filled. |
| `onAutoSubmit` | `((value: string) => void)` |  | Called with the code just before `autoSubmit` submits. |
| `name` | `string` |  | The name the whole code is submitted under in a form. |
| `disabled` | `boolean` |  | Disables every box. |
| `readOnly` | `boolean` |  | Lets the code be read and copied and not changed. |
| `placeholder` | `string` |  | One character per box, shown while the field is empty. |
| `dir` | `"ltr" \| "rtl"` |  | The reading direction, which decides where the first box is. |

Everything else is passed to the `<div>` around the boxes, including `ref`, `id` and `className`.

## Groups

`groupSize` draws a dash after every so many boxes, the way codes are often printed. The dash is decoration: it isn't in the value, and a screen reader skips it.

```tsx
import {
  Field,
  FieldControl,
  FieldDescription,
  FieldLabel,
  OtpField,
} from "@nuvui/react";

export default function Example() {
  return (
    <Field style={{ justifyItems: "start" }}>
      <FieldLabel asChild>
        <span>Code from your authenticator app</span>
      </FieldLabel>
      <FieldControl>
        <OtpField groupSize={3} />
      </FieldControl>
      <FieldDescription>It changes every 30 seconds.</FieldDescription>
    </Field>
  );
}
```

## In a form

Give it a `name` and the whole code is submitted as one value, from a hidden input. With `autoSubmit`, the form is submitted as soon as the last box is filled.

```tsx
"use client";

import { OtpField } from "@nuvui/react";
import { useState } from "react";

export default function Example() {
  const [sent, setSent] = useState("");

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        setSent(String(new FormData(event.currentTarget).get("pin")));
      }}
      style={{ display: "grid", gap: 12, justifyItems: "start" }}
    >
      <OtpField
        aria-label="Four digit PIN"
        name="pin"
        length={4}
        type="password"
        autoComplete="off"
        autoSubmit
      />
      <output aria-live="polite">
        {sent
          ? `Submitted a ${sent.length} digit PIN.`
          : "Nothing submitted yet."}
      </output>
    </form>
  );
}
```

Only use `autoSubmit` where a wrong code is cheap to retry. It takes away the chance to look the code over first.

## On small screens

Each box is 44 pixels square on a touch screen and 40 with a mouse, where [density](../theming.md#density) moves it. Six of them with their gaps are 304 pixels wide. In a narrower space the boxes get narrower and keep their height.

With the default `validationType`, a phone opens its number pad.

## Accessibility

### Keyboard

| Key | What it does |
| --- | --- |
| <kbd>Tab</kbd> | Moves into the field, to the first empty box, and out of it again. The boxes are one tab stop together. |
| A character | Fills the box and moves to the next. One that isn't allowed is ignored. |
| <kbd>Backspace</kbd> | Clears the box and moves to the one before. |
| <kbd>←</kbd> and <kbd>→</kbd> | Move between the boxes that are filled, and the first empty one. |
| Paste | Fills the boxes from the start with the pasted code. Spaces in it are dropped. |

### What the component handles

Most of this is Radix. The library doesn't change it.

- The boxes sit in an element with `role="group"`. Give it a name and a screen reader reads it when focus moves in.
- Each box has a name of its own, "Character 2 of 6". `inputLabel` replaces it, for another language.
- `aria-invalid` on the field is put on each box, where it means something, and not on the group.
- A box can't be reached until the ones before it are filled, so a code is always typed in order.
- Each box's edge uses `--color-border-strong`, at least 3:1 against the page in every theme. The box with focus has a 2 pixel ring.

### What you need to handle

- Name the group. Use `aria-label`, or `aria-labelledby` pointing at visible text. A `<label>` can't do it, because there's no single input for it to point at. In a [Field](field.md), use `FieldLabel asChild` around a `<span>`.
- Say where the code was sent, and offer a way to get another one.
- Don't put a short time limit on typing it. If the code expires, say when.

## CSS variables

Set any of these on the field, or on anything around it.

```css
.verify {
  --nuv-otp-field-size: 3.5rem;
}
```

| Variable | Default | What it sets |
| --- | --- | --- |
| `--nuv-otp-field-gap` | `calc(var(--spacing) * 2)` | Space between boxes. |
| `--nuv-otp-field-size` | `var(--nuv-touch-size)`, `var(--nuv-control-height-md)` | Width and height of a box. The default differs between touch screens and a mouse. |
| `--nuv-otp-field-font-size` | `var(--text-lg)` | Font size of the character in a box. |
| `--nuv-otp-field-border` | `var(--color-border-strong)` | Border color of a box. |
| `--nuv-otp-field-radius` | `var(--radius-md)` | Corner radius of a box. |
| `--nuv-otp-field-bg` | `var(--color-surface)` | Background color of a box. |
| `--nuv-otp-field-fg` | `var(--color-foreground)` | Text color. |
| `--nuv-otp-field-readonly-bg` | `var(--color-muted)` | Background color of a box while read-only. |
| `--nuv-otp-field-separator` | `var(--color-border-strong)` | Color of the dash between groups. |

## Classes

| Class | What it's on |
| --- | --- |
| `.nuv-otp-field` | The group around the boxes. |
| `.nuv-otp-field__input` | One box. |
| `.nuv-otp-field__separator` | The dash between groups. |

## Server components

OtpField is a client component. It carries `"use client"`, and the build checks that the directive is still there in the published files. You can render it from a server component, as the first example on this page does.

## Do and don't

**Do**

- Match `length` to the code you send.
- Leave `autoComplete` at `"one-time-code"` for codes sent by text message.

**Don't**

- Don't use it for a password or anything else people know by heart.
- Don't clear the boxes when the code is wrong. Leave it there, say it didn't match, and let people fix one digit.
