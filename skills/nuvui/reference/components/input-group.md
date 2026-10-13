<!-- Written by apps/docs/scripts/agent-skill.mjs from apps/docs/content/docs/components/input-group.mdx. Don't edit it here: run `pnpm skill`. -->

# InputGroup

An input with text, an icon or a small button inside the same box, before or after what's typed.

Use an input group when something belongs inside the field with the value: a unit, a currency sign, the fixed start of an address, a search icon, a button that clears or copies. To join a full-size button to the side of an input, use a [ButtonGroup](button-group.md).

```tsx
import { Input, InputGroup, InputGroupAddon, Label } from "@nuvui/react";

export default function Example() {
  return (
    <div
      style={{
        display: "grid",
        gap: 6,
        inlineSize: "100%",
        maxInlineSize: 360,
      }}
    >
      <Label htmlFor="group-site">Website</Label>
      <InputGroup>
        <InputGroupAddon>https://</InputGroupAddon>
        <Input id="group-site" placeholder="example.com" />
      </InputGroup>
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
  Input,
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
} from "@nuvui/react";
```

The styles come from `@nuvui/react/styles.css`, which you load once for the whole app. [Getting started](../index.md) covers that, and how to load only this component's CSS. Loaded one by one, a group needs `input.css` as well as `input-group.css`.

## Parts

| Part | What it is |
| --- | --- |
| `InputGroup` | The box. It draws the edge, and the input inside gives up its own. |
| `Input` | The ordinary [Input](input.md). |
| `InputGroupAddon` | Text or an icon that isn't interactive. |
| `InputGroupButton` | A small button inside the box. |

Write the parts in the order they should appear. The first is at the start of the line, which is the right in a right-to-left layout.

## Props

None of the parts add props of their own. `InputGroup` and `InputGroupAddon` take those of a `<div>`, and `InputGroupButton` those of a `<button>`.

One default differs from HTML. The `type` of `InputGroupButton` is `"button"`, not `"submit"`, so it doesn't submit a form around it.

## Icons and buttons

```tsx
"use client";

import {
  Input,
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
} from "@nuvui/react";
import { useRef, useState } from "react";

export default function Example() {
  const [query, setQuery] = useState("invoices");
  const input = useRef<HTMLInputElement>(null);

  return (
    <InputGroup style={{ maxInlineSize: 360 }}>
      <InputGroupAddon>
        <svg
          aria-hidden="true"
          viewBox="0 0 16 16"
          width="16"
          height="16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        >
          <circle cx="7" cy="7" r="4.5" />
          <path d="M10.5 10.5L14 14" />
        </svg>
      </InputGroupAddon>
      <Input
        ref={input}
        aria-label="Search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      {query ? (
        <InputGroupButton
          aria-label="Clear search"
          onClick={() => {
            setQuery("");
            input.current?.focus();
          }}
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 16 16"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          >
            <path d="M3.5 3.5l9 9m0-9l-9 9" />
          </svg>
        </InputGroupButton>
      ) : null}
    </InputGroup>
  );
}
```

A button that holds only an icon needs an `aria-label`.

## Units

```tsx
import {
  Field,
  FieldControl,
  FieldError,
  FieldLabel,
  Input,
  InputGroup,
  InputGroupAddon,
} from "@nuvui/react";

export default function Example() {
  return (
    <div
      style={{
        display: "grid",
        gap: 20,
        inlineSize: "100%",
        maxInlineSize: 240,
      }}
    >
      <Field>
        <FieldLabel>Monthly budget</FieldLabel>
        <InputGroup>
          <InputGroupAddon>$</InputGroupAddon>
          <FieldControl>
            <Input inputMode="decimal" defaultValue="1,200" />
          </FieldControl>
          <InputGroupAddon>USD</InputGroupAddon>
        </InputGroup>
      </Field>
      <Field>
        <FieldLabel>Discount</FieldLabel>
        <InputGroup>
          <FieldControl>
            <Input inputMode="numeric" defaultValue="140" />
          </FieldControl>
          <InputGroupAddon>%</InputGroupAddon>
        </InputGroup>
        <FieldError>Enter a number from 0 to 100.</FieldError>
      </Field>
    </div>
  );
}
```

Inside a [Field](field.md), wrap the input in `FieldControl`, not the group. The group takes its invalid edge and its disabled look from the input.

## How the box behaves

- A press anywhere in the box that isn't on a button or the input itself puts the cursor in the input. The text and icons beside it read as part of the field, so they act like it.
- While the input has keyboard focus, the ring goes around the whole box. While a button inside has focus, the ring is around that button.
- When the input has `aria-invalid`, the box's edge turns to the danger color. When the input is disabled, the box fades.

The last two use the CSS `:has()` selector, which arrived in Firefox 121. In an older Firefox the ring shows while anything in the box has focus, and the edge doesn't change for an invalid input. The error message still shows.

## On small screens

The box is 44 pixels tall on a touch screen and 40 with a mouse, where [density](../theming.md#density) moves it. A button inside is drawn 8 pixels shorter than the box. On a touch screen the area that responds to a tap is 44 by 44 pixels, centered on the button.

## Accessibility

### Keyboard

| Key | What it does |
| --- | --- |
| <kbd>Tab</kbd> | Moves to the input, then to each button, in the order they're written. |
| <kbd>Enter</kbd> or <kbd>Space</kbd> | On a button, presses it. |

### What the component handles

- The group adds no role. A screen reader meets the input and the buttons as it would outside one.
- The box's edge uses `--color-border-strong`, which has at least 3:1 contrast with the page in every theme.
- Text in an addon uses `--color-muted-foreground`, which has at least 4.5:1 against the box.

### What you need to handle

- An addon isn't part of the input's name. A screen reader reads "Monthly budget", not "dollars". If the unit matters to understanding the field, put it in the label too: "Monthly budget in US dollars".
- Give every icon-only button an `aria-label`.
- Label the input itself, with a [label](label.md) or `aria-label`.

## CSS variables

Set any of these on the group, or on anything around it.

```css
.search {
  --nuv-input-group-radius: var(--radius-full);
}
```

| Variable | Default | What it sets |
| --- | --- | --- |
| `--nuv-input-group-width` | `100%` | Width. It fills its container by default. |
| `--nuv-input-group-border` | `var(--color-border-strong)` | Border color of the box. |
| `--nuv-input-group-radius` | `var(--radius-md)` | Corner radius of the box. |
| `--nuv-input-group-bg` | `var(--color-surface)` | Background color of the box. |
| `--nuv-input-group-fg` | `var(--color-foreground)` | Text color of the input. |
| `--nuv-input-group-height` | `var(--nuv-touch-size)`, `var(--nuv-control-height-md)` | Minimum height of the box. The buttons inside are sized from it. The default differs between touch screens and a mouse. |
| `--nuv-input-group-addon-fg` | `var(--color-muted-foreground)` | Color of the text and icons in an addon. |
| `--nuv-input-group-button-radius` | `var(--radius-sm)` | Corner radius of a button. |
| `--nuv-input-group-button-fg` | `var(--color-muted-foreground)` | Color of a button's text or icon. |
| `--nuv-input-group-button-bg-hover` | `var(--color-muted)` | Background of a button while hovered. |

## Classes

| Class | What it's on |
| --- | --- |
| `.nuv-input-group` | InputGroup. |
| `.nuv-input-group__addon` | InputGroupAddon. |
| `.nuv-input-group__button` | InputGroupButton. |

## Server components

The parts are client components, because the group listens for a press to focus its input. They carry `"use client"`, and the build checks that the directive is still there in the published files. You can put a group together inside a server component, as the first example on this page does.

## Do and don't

**Do**

- Keep addons short: a sign, a unit, a few fixed characters.
- Put the thing people read first, such as a currency sign, before the input.

**Don't**

- Don't put more than one input in a group.
- Don't put the field's only label in an addon. It isn't read as one.
- Don't crowd the box. One addon and one button on a side is about the limit on a phone.
