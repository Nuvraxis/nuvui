<!-- Written by apps/docs/scripts/agent-skill.mjs from apps/docs/content/docs/components/native-select.mdx. Don't edit it here: run `pnpm skill`. -->

# NativeSelect

The browser's own select, styled to match the other fields. On a phone it opens the system picker.

Use a native select to pick one value from a list when the options are plain text. It opens the picker people already know from their phone or computer, and it works before any JavaScript has loaded.

Reach for [Select](select.md) when the options need styling of their own, icons, or anything else a native `<option>` can't hold.

```tsx
import { Label, NativeSelect } from "@nuvui/react";

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
      <Label htmlFor="native-country">Country</Label>
      <NativeSelect id="native-country" defaultValue="">
        <option value="" disabled>
          Pick a country
        </option>
        <option value="dk">Denmark</option>
        <option value="fi">Finland</option>
        <option value="no">Norway</option>
        <option value="se">Sweden</option>
      </NativeSelect>
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
import { NativeSelect } from "@nuvui/react";
```

The styles come from `@nuvui/react/styles.css`, which you load once for the whole app. [Getting started](../index.md) covers that, and how to load only this component's CSS.

## Props

NativeSelect adds no props of its own. These are the ones you'll reach for most.

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `value` | `string \| number \| readonly string[]` |  | The chosen option, when you control it yourself. Use it with `onChange`. |
| `defaultValue` | `string \| number \| readonly string[]` |  | The option chosen at first, when you don't control it. |
| `disabled` | `boolean` |  | Stops it from being focused or changed. |
| `required` | `boolean` |  | Inside a form, the browser won't submit while the chosen option's value is empty. |
| `name` | `string` |  | The name the value is submitted under in a form. |
| `multiple` | `boolean` |  | Lets several options be chosen. The options then show in the page as a list. |

The options are plain `<option>` and `<optgroup>` elements.

`className` goes on the wrapper that carries the arrow. Everything else, `ref` and `id` included, goes to the `<select>` itself.

## Groups

```tsx
import { Label, NativeSelect } from "@nuvui/react";

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
      <Label htmlFor="native-zone">Time zone</Label>
      <NativeSelect id="native-zone" defaultValue="Europe/Oslo">
        <optgroup label="Europe">
          <option value="Europe/Lisbon">Lisbon</option>
          <option value="Europe/Oslo">Oslo</option>
        </optgroup>
        <optgroup label="Asia">
          <option value="Asia/Colombo">Colombo</option>
          <option value="Asia/Tokyo">Tokyo</option>
        </optgroup>
      </NativeSelect>
    </div>
  );
}
```

## States

```tsx
import { Label, NativeSelect } from "@nuvui/react";

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
        <Label htmlFor="native-disabled" data-disabled="">
          Disabled
        </Label>
        <NativeSelect id="native-disabled" disabled>
          <option>Free</option>
        </NativeSelect>
      </div>
      <div style={field}>
        <Label htmlFor="native-invalid">Invalid</Label>
        <NativeSelect
          id="native-invalid"
          aria-invalid
          aria-describedby="native-invalid-error"
          defaultValue=""
        >
          <option value="">Pick a plan</option>
          <option value="free">Free</option>
          <option value="team">Team</option>
        </NativeSelect>
        <span
          id="native-invalid-error"
          style={{ color: "var(--color-danger)", fontSize: 14 }}
        >
          Pick a plan to continue.
        </span>
      </div>
    </div>
  );
}
```

## A placeholder

A select has no placeholder. The usual stand-in is a first option with an empty value, as in the first example on this page. Mark it `disabled` so it can't be chosen again, and add `required` to the select if a real choice is needed: the browser won't submit while the empty one is chosen.

## Accessibility

### Keyboard

The keys are the browser's and the operating system's own, so they vary a little. These hold everywhere.

| Key | What it does |
| --- | --- |
| <kbd>Tab</kbd> | Moves focus to the select. Disabled ones are skipped. |
| <kbd>↓</kbd> and <kbd>↑</kbd> | Change the chosen option. |
| A letter | Chooses the next option that starts with it. |

### What the component handles

- It renders a native `<select>`, so the role, the keyboard, the system picker and form submission come from the browser.
- The browser's arrow is replaced with one drawn in the theme's colors. It sits at the end of the box, so in a right-to-left layout it's on the left. A click on it goes through to the select.
- The edge uses `--color-border-strong`, which has at least 3:1 contrast with the page in every theme.
- Text is 16 pixels on a touch screen, so iOS doesn't zoom in when it takes focus.
- With `multiple`, or a `size` above 1, the browser shows the options as a list in the page. The arrow is hidden then.

### What you need to handle

- Give it a name. Use a [label](label.md) whose `htmlFor` matches its `id`, or `aria-label` when there's no visible text.
- When the value is wrong, set `aria-invalid` and describe the problem in text.

## CSS variables

Set any of these on the select, or on anything around it. The open list of options belongs to the operating system and can't be styled.

```css
.filters {
  --nuv-native-select-width: 12rem;
}
```

| Variable | Default | What it sets |
| --- | --- | --- |
| `--nuv-native-select-width` | `100%` | Width. It fills its container by default. |
| `--nuv-native-select-border` | `var(--color-border-strong)` | Border color. |
| `--nuv-native-select-radius` | `var(--radius-md)` | Corner radius. |
| `--nuv-native-select-bg` | `var(--color-surface)` | Background color. |
| `--nuv-native-select-fg` | `var(--color-foreground)` | Text color. |
| `--nuv-native-select-height` | `var(--nuv-touch-size)`, `var(--nuv-control-height-md)` | Minimum height. The default differs between touch screens and a mouse. |
| `--nuv-native-select-font-size` | `var(--text-base)`, `var(--text-sm)` | Font size. The default differs between touch screens and a mouse. |
| `--nuv-native-select-icon` | `var(--color-muted-foreground)` | Color of the arrow. |

## Classes

| Class | What it's on |
| --- | --- |
| `.nuv-native-select` | The wrapper. It's what `className` is added to. |
| `.nuv-native-select__control` | The select. |
| `.nuv-native-select__icon` | The arrow. |

## Server components

NativeSelect has no `"use client"` directive and uses no state, so it renders in a server component as it is. An `onChange` handler is the usual reason to need a client component around it.

## Do and don't

**Do**

- Use it on forms that are mostly filled in on phones.
- Order the options in a way people can predict.

**Don't**

- Don't use a select for two or three options. Show them as [radio buttons](radio-group.md).
- Don't use `multiple` for more than a handful of options. Few people know how to pick several from a list box, and [checkboxes](checkbox.md) are clearer.
