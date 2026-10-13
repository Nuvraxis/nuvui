<!-- Written by apps/docs/scripts/agent-skill.mjs from apps/docs/content/docs/components/input.mdx. Don't edit it here: run `pnpm skill`. -->

# Input

A one-line text field. It's the browser's own input with the library's styles, so every type and attribute works.

Use an input for a short piece of text: a name, an email address, a number, a date. For several lines, use a [textarea](textarea.md). To give it a label, a hint and an error message that screen readers tie together, put it in a [Field](field.md).

```tsx
import { Input, Label } from "@nuvui/react";

export default function Example() {
  return (
    <div
      style={{
        display: "grid",
        gap: 6,
        inlineSize: "100%",
        maxInlineSize: 320,
      }}
    >
      <Label htmlFor="input-name">Full name</Label>
      <Input id="input-name" autoComplete="name" />
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
import { Input } from "@nuvui/react";
```

The styles come from `@nuvui/react/styles.css`, which you load once for the whole app. [Getting started](../index.md) covers that, and how to load only this component's CSS.

## Props

Input adds no props of its own. These are the ones you'll reach for most.

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `type` | `HTMLInputTypeAttribute` |  | What kind of value it takes. The browser picks the keyboard and the checks to match. |
| `value` | `string \| number \| readonly string[]` |  | The text, when you control it yourself. Use it with `onChange`. |
| `defaultValue` | `string \| number \| readonly string[]` |  | The text it starts with, when you don't control it. |
| `placeholder` | `string` |  | An example of what to type, shown while it's empty. |
| `disabled` | `boolean` |  | Stops it from being focused or changed, and leaves it out of the form. |
| `readOnly` | `boolean` |  | Lets the text be selected and copied and not changed. It's still submitted. |
| `required` | `boolean` |  | Inside a form, the browser won't submit while it's empty. |
| `name` | `string` |  | The name the value is submitted under in a form. |
| `autoComplete` | `HTMLInputAutoCompleteAttribute` |  | What the browser may fill in, such as `"email"` or `"name"`. |

Everything else is passed to the `<input>` element, including `ref`, `id`, `className` and event handlers.

## Types

`type` goes straight to the browser. On a phone it decides which keyboard opens.

```tsx
import { Input, Label } from "@nuvui/react";

const field = { display: "grid", gap: 6 };

export default function Example() {
  return (
    <div
      style={{
        display: "grid",
        gap: 20,
        inlineSize: "100%",
        maxInlineSize: 320,
      }}
    >
      <div style={field}>
        <Label htmlFor="type-email">Email</Label>
        <Input id="type-email" type="email" autoComplete="email" />
      </div>
      <div style={field}>
        <Label htmlFor="type-number">Seats</Label>
        <Input
          id="type-number"
          type="number"
          min={1}
          max={50}
          defaultValue={5}
        />
      </div>
      <div style={field}>
        <Label htmlFor="type-date">Start date</Label>
        <Input id="type-date" type="date" />
      </div>
      <div style={field}>
        <Label htmlFor="type-search">Search</Label>
        <Input id="type-search" type="search" placeholder="Invoices, people" />
      </div>
      <div style={field}>
        <Label htmlFor="type-file">Logo</Label>
        <Input id="type-file" type="file" accept="image/*" />
      </div>
    </div>
  );
}
```

`type="file"` gets the browser's own button, styled to match. For a drop area and a list of the chosen files, use [FileUpload](file-upload.md). For a password with a button that shows it, use [PasswordInput](password-input.md).

## States

```tsx
import { Input, Label } from "@nuvui/react";

const field = { display: "grid", gap: 6 };

export default function Example() {
  return (
    <div
      style={{
        display: "grid",
        gap: 20,
        inlineSize: "100%",
        maxInlineSize: 320,
      }}
    >
      <div style={field}>
        <Label htmlFor="state-disabled" data-disabled="">
          Disabled
        </Label>
        <Input id="state-disabled" disabled defaultValue="Ada Lovelace" />
      </div>
      <div style={field}>
        <Label htmlFor="state-readonly">Read-only</Label>
        <Input id="state-readonly" readOnly defaultValue="INV-0042" />
      </div>
      <div style={field}>
        <Label htmlFor="state-invalid">Invalid</Label>
        <Input
          id="state-invalid"
          type="email"
          aria-invalid
          aria-describedby="state-invalid-error"
          defaultValue="ada@"
        />
        <span
          id="state-invalid-error"
          style={{ color: "var(--color-danger)", fontSize: 14 }}
        >
          Enter an email address, like ada@example.com.
        </span>
      </div>
    </div>
  );
}
```

Set `aria-invalid` and the edge turns to the danger color. Color isn't enough to go on, so say what's wrong in words too, and tie the message to the input with `aria-describedby`. [Field](field.md) does both.

A read-only input is filled with the muted color, so it's clear that it isn't waiting for input.

## Width

An input fills the width of its container. Give the container a width, or set `--nuv-input-width`.

## On small screens

An input is 44 pixels tall on a touch screen and 40 with a mouse, where [density](../theming.md#density) moves it.

Its text is 16 pixels on a touch screen and 14 with a mouse. iOS zooms the page in when a field with text under 16 pixels takes focus, and doesn't zoom back out.

## Accessibility

### Keyboard

| Key | What it does |
| --- | --- |
| <kbd>Tab</kbd> | Moves focus to the input. Disabled ones are skipped. |

Everything else is the browser's own text editing.

### What the component handles

- It renders a native `<input>`, so the role, the keyboard and form submission come from the browser.
- The edge uses `--color-border-strong`, which has at least 3:1 contrast with the page in every theme, so an empty input is still visible as a control.
- The placeholder uses `--color-muted-foreground` at full opacity, which has at least 4.5:1 against the input. Firefox would otherwise fade it.
- Focus shows a 2 pixel ring in `--color-ring`.
- The edge only animates when the visitor hasn't asked for reduced motion.

### What you need to handle

- Give it a name. Use a [label](label.md) whose `htmlFor` matches the input's `id`, or `aria-label` when there's no visible text.
- Set `autoComplete` on fields about the person filling in the form, such as their name, email and address. It lets the browser fill them in, and WCAG asks for it. A field about someone else, such as a teammate to invite, takes `autoComplete="off"`, or the browser offers the reader's own details for it.
- When the value is wrong, set `aria-invalid` and describe the problem in text.

## CSS variables

Set any of these on the input, or on anything around it.

```css
.search {
  --nuv-input-radius: var(--radius-full);
}
```

| Variable | Default | What it sets |
| --- | --- | --- |
| `--nuv-input-width` | `100%` | Width. It fills its container by default. |
| `--nuv-input-padding-inline` | `calc(var(--spacing) * 3)` | Padding left and right. |
| `--nuv-input-border` | `var(--color-border-strong)` | Border color. |
| `--nuv-input-radius` | `var(--radius-md)` | Corner radius. |
| `--nuv-input-bg` | `var(--color-surface)` | Background color. |
| `--nuv-input-fg` | `var(--color-foreground)` | Text color. |
| `--nuv-input-height` | `var(--nuv-touch-size)`, `var(--nuv-control-height-md)` | Minimum height. The default differs between touch screens and a mouse. |
| `--nuv-input-font-size` | `var(--text-base)`, `var(--text-sm)` | Font size. The default differs between touch screens and a mouse. Keep it at 16px or more on phones. |
| `--nuv-input-placeholder` | `var(--color-muted-foreground)` | Color of the placeholder. |
| `--nuv-input-readonly-bg` | `var(--color-muted)` | Background color while read-only. |

## Classes

| Class | What it's on |
| --- | --- |
| `.nuv-input` | The input. |

States are attributes, not modifier classes: `:disabled`, `[readonly]` and `[aria-invalid="true"]`.

## Server components

Input has no `"use client"` directive and uses no state, so it renders in a server component as it is. An `onChange` handler is the usual reason to need a client component around it.

## Do and don't

**Do**

- Pick the `type` that matches the value. It costs nothing and gives phone users the right keyboard.
- Size the input to what goes in it. A postcode doesn't need the full width of the page.

**Don't**

- Don't use the placeholder for instructions. It's gone once someone starts typing.
- Don't disable an input without saying why somewhere on the page.
- Don't set the font size under 16 pixels on pages people use on phones.
