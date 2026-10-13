<!-- Written by apps/docs/scripts/agent-skill.mjs from apps/docs/content/docs/components/checkbox.mdx. Don't edit it here: run `pnpm skill`. -->

# Checkbox

A box that's checked, unchecked or partly checked. It works with a label and submits with a form.

Use a checkbox for a choice that's saved along with the rest of a form, or for picking several things from a list. If the change applies the moment it's made, a [switch](switch.md) says that better.

```tsx
import { Checkbox } from "@nuvui/react";

export default function Example() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <Checkbox id="terms" />
      <label htmlFor="terms">I accept the terms</label>
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
import { Checkbox } from "@nuvui/react";
```

The styles come from `@nuvui/react/styles.css`, which you load once for the whole app. [Getting started](../index.md) covers that, and how to load only this component's CSS.

## Props

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `checked` | `CheckboxPrimitive.CheckedState` |  | The state, when you control it yourself. Use it with `onCheckedChange`. |
| `defaultChecked` | `CheckboxPrimitive.CheckedState` |  | The state it starts in, when you don't control it. |
| `onCheckedChange` | `((checked: CheckboxPrimitive.CheckedState) => void)` |  | Called with the new state when someone toggles it. |
| `disabled` | `boolean` |  | Stops it from being focused or toggled. |
| `required` | `boolean` |  | Marks it as required. Inside a form, the browser won't submit until it's checked. |
| `name` | `string` |  | The name it's submitted under in a form. |
| `value` | `string \| number \| readonly string[]` |  | The value submitted when it's checked. It's `"on"` if you don't set one. |

Everything else is passed to the `<button>` that Radix renders, including `ref`, `id`, `className` and `aria-label`. The [Radix Checkbox reference](https://www.radix-ui.com/primitives/docs/components/checkbox#api-reference) has the full list.

## States

```tsx
import { Checkbox } from "@nuvui/react";

const row = { display: "flex", alignItems: "center", gap: 8 };

export default function Example() {
  return (
    <div style={{ display: "grid", gap: 20 }}>
      <div style={row}>
        <Checkbox id="state-off" />
        <label htmlFor="state-off">Unchecked</label>
      </div>
      <div style={row}>
        <Checkbox id="state-on" defaultChecked />
        <label htmlFor="state-on">Checked</label>
      </div>
      <div style={row}>
        <Checkbox id="state-some" checked="indeterminate" />
        <label htmlFor="state-some">Indeterminate</label>
      </div>
      <div style={row}>
        <Checkbox id="state-disabled" disabled />
        <label htmlFor="state-disabled">Disabled</label>
      </div>
    </div>
  );
}
```

## Indeterminate

A click only ever checks or unchecks the box. The third state is one you set, with `checked="indeterminate"`, usually on a checkbox that stands for a group where some items are selected and some aren't.

```tsx
"use client";

import { Checkbox } from "@nuvui/react";
import { useState } from "react";

const files = ["invoice.pdf", "notes.txt", "photo.jpg"];
const row = { display: "flex", alignItems: "center", gap: 8 };

export default function Example() {
  const [selected, setSelected] = useState<string[]>(["notes.txt"]);

  const all = selected.length === files.length;
  const some = selected.length > 0 && !all;

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <div style={row}>
        <Checkbox
          id="files-all"
          checked={some ? "indeterminate" : all}
          onCheckedChange={(checked) => setSelected(checked ? files : [])}
        />
        <label htmlFor="files-all">Select all</label>
      </div>
      {files.map((file) => (
        <div key={file} style={{ ...row, paddingInlineStart: 28 }}>
          <Checkbox
            id={`file-${file}`}
            checked={selected.includes(file)}
            onCheckedChange={(checked) =>
              setSelected(
                checked
                  ? [...selected, file]
                  : selected.filter((name) => name !== file),
              )
            }
          />
          <label htmlFor={`file-${file}`}>{file}</label>
        </div>
      ))}
    </div>
  );
}
```

## In a form

Give the checkbox a `name` and it's submitted like a native one. Inside a `<form>`, Radix renders a hidden `<input type="checkbox">` next to the button, so `FormData`, `required` and form resets all work.

## Accessibility

### Keyboard

| Key | What it does |
| --- | --- |
| <kbd>Tab</kbd> | Moves focus to the checkbox. Disabled ones are skipped. |
| <kbd>Space</kbd> | Checks or unchecks it. |

<kbd>Enter</kbd> does nothing, the same as on a native checkbox.

### What the component handles

- It renders a `<button>` with `role="checkbox"` and `aria-checked`, which is `mixed` while indeterminate. This part is Radix.
- A click on a `<label>` that points at it toggles it.
- The box is 20 pixels, which is too small for a finger. On a touch screen the area that responds to a tap is 44 by 44 pixels, centered on the box. With a mouse it's the box alone.
- The edge of the box uses `--color-border-strong`, which has at least 3:1 contrast with the page in light and dark, so an empty box is still visible as a control.
- Keyboard focus shows a 2 pixel ring in `--color-ring`.
- The color change is only animated when the visitor hasn't asked for reduced motion.

### What you need to handle

- Give it a name. Use a `<label>` whose `htmlFor` matches the checkbox's `id`, or `aria-label` when there's no visible text.
- Leave room around it on phones. If two checkboxes are less than 44 pixels apart from center to center, their tap areas overlap and the one later in the page wins the overlap.

## CSS variables

Set any of these on the checkbox, or on anything around it.

```css
.settings {
  --nuv-checkbox-radius: var(--radius-full);
}
```

| Variable | Default | What it sets |
| --- | --- | --- |
| `--nuv-checkbox-size` | `1.25rem` | Width and height of the box. |
| `--nuv-checkbox-border` | `var(--color-border-strong)` | Border color while unchecked. |
| `--nuv-checkbox-radius` | `var(--radius-sm)` | Corner radius. |
| `--nuv-checkbox-bg` | `var(--color-surface)` | Background color while unchecked. |
| `--nuv-checkbox-fg` | `var(--color-primary-foreground)` | Color of the check mark and the dash. |
| `--nuv-checkbox-checked-bg` | `var(--color-primary)` | Background and border color while checked or indeterminate. |

## Classes

| Class | What it's on |
| --- | --- |
| `.nuv-checkbox` | The box, which is the button itself. |
| `.nuv-checkbox__check` | The check mark. |
| `.nuv-checkbox__dash` | The dash shown while indeterminate. |
| `.nuv-checkbox__icon` | The SVG that holds both marks. |
| `.nuv-checkbox__indicator` | The wrapper around the mark. Radix only renders it while the box is checked or indeterminate. |

Radix sets `data-state` on the box to `checked`, `unchecked` or `indeterminate`, and `data-disabled` when it's disabled. Style those, not a modifier class.

## Server components

Checkbox is a client component. It carries `"use client"`, and the build checks that the directive is still there in the published files.

You can render it from a server component, as the first example on this page does. It needs a client component of your own once you pass `onCheckedChange` or control `checked`.

## Do and don't

**Do**

- Make the label clickable by linking it with `htmlFor`. It's a much bigger target than the box.
- Word the label so that checked means yes. "Email me updates", not "Don't email me".
- Use the indeterminate state for a parent whose children are partly selected.

**Don't**

- Don't use a checkbox for something that takes effect right away. That's a switch.
- Don't use checkboxes for a choice where only one option can be picked.
- Don't check a box for someone when it signs them up for something.
