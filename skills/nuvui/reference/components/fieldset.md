<!-- Written by apps/docs/scripts/agent-skill.mjs from apps/docs/content/docs/components/fieldset.mdx. Don't edit it here: run `pnpm skill`. -->

# Fieldset

Groups related form controls under one heading that screen readers read with the group.

Use a fieldset for controls that belong together and need a shared name: the lines of an address, a set of radio buttons, the two ends of a date range. A screen reader reads the legend when someone moves into the group.

```tsx
import {
  Field,
  FieldControl,
  FieldLabel,
  Fieldset,
  FieldsetLegend,
  Input,
} from "@nuvui/react";

export default function Example() {
  return (
    <Fieldset style={{ inlineSize: "100%", maxInlineSize: 360 }}>
      <FieldsetLegend>Shipping address</FieldsetLegend>
      <Field>
        <FieldLabel>Street</FieldLabel>
        <FieldControl>
          <Input autoComplete="shipping address-line1" />
        </FieldControl>
      </Field>
      <Field>
        <FieldLabel>City</FieldLabel>
        <FieldControl>
          <Input autoComplete="shipping address-level2" />
        </FieldControl>
      </Field>
    </Fieldset>
  );
}
```

## Install

```sh
pnpm add @nuvui/react
```

## Import

```tsx
import { Fieldset, FieldsetLegend } from "@nuvui/react";
```

The styles come from `@nuvui/react/styles.css`, which you load once for the whole app. [Getting started](../index.md) covers that, and how to load only this component's CSS.

## Parts

| Part | What it is |
| --- | --- |
| `Fieldset` | The group. It renders a `<fieldset>`. |
| `FieldsetLegend` | The group's name. It renders a `<legend>`, and has to be the first thing inside. |

## Props

Neither part adds props of its own. `Fieldset` takes those of a `<fieldset>`, and these are the ones you'll reach for.

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `disabled` | `boolean` |  | Disables every control inside it at once. |
| `name` | `string` |  | A name for the group in the form's `elements`. |

`FieldsetLegend` takes the props of a `<legend>`.

## Disabling a group

`disabled` on the fieldset is the browser's own feature. Every input, select, textarea and button inside is disabled and skipped by the keyboard, the library's components included, and each one fades.

A [slider](slider.md) is the exception. It isn't built from a form element, so the browser leaves it alone. Give it its own `disabled`.

## Radio buttons

A group of radio buttons needs a name for the question they answer. A fieldset with a legend gives it one.

```tsx
import {
  Fieldset,
  FieldsetLegend,
  RadioGroup,
  RadioGroupItem,
} from "@nuvui/react";

const row = { display: "flex", alignItems: "center", gap: 8 };

export default function Example() {
  return (
    <Fieldset>
      <FieldsetLegend id="fieldset-contact">
        How should we reach you?
      </FieldsetLegend>
      <RadioGroup aria-labelledby="fieldset-contact" defaultValue="email">
        <div style={row}>
          <RadioGroupItem value="email" id="fieldset-email" />
          <label htmlFor="fieldset-email">Email</label>
        </div>
        <div style={row}>
          <RadioGroupItem value="phone" id="fieldset-phone" />
          <label htmlFor="fieldset-phone">Phone</label>
        </div>
      </RadioGroup>
    </Fieldset>
  );
}
```

The radio group also points at the legend with `aria-labelledby`, so its own `radiogroup` role has the same name.

## Accessibility

A fieldset has no keyboard behavior of its own.

### What the component handles

- It renders a native `<fieldset>` and `<legend>`, so the group role and its name come from the browser.
- The browser's own edge, padding and minimum width are taken off. A fieldset otherwise refuses to get narrower than its content, which breaks layouts on a phone.
- The legend keeps its place as the first child, which is what makes it the group's name.

### What you need to handle

- Keep the legend short. A screen reader may read it again for every control in the group.
- Don't nest fieldsets more than one level. The legends pile up.
- Use it for groups that need a name. A whole form doesn't need one around it.

## CSS variables

Set any of these on the fieldset, or on anything around it.

```css
.form {
  --nuv-fieldset-gap: calc(var(--spacing) * 6);
}
```

| Variable | Default | What it sets |
| --- | --- | --- |
| `--nuv-fieldset-gap` | `calc(var(--spacing) * 4)` | Space between the things inside the fieldset. |
| `--nuv-fieldset-legend-gap` | `calc(var(--spacing) * 3)` | Space under the legend. |
| `--nuv-fieldset-legend-fg` | `var(--color-foreground)` | Text color of the legend. |

## Classes

| Class | What it's on |
| --- | --- |
| `.nuv-fieldset` | Fieldset. |
| `.nuv-fieldset__legend` | FieldsetLegend. |

## Server components

Neither part has a `"use client"` directive or uses state, so both render in a server component as they are.

## Do and don't

**Do**

- Put radio buttons and related checkboxes in a fieldset.
- Word the legend as the question or the thing being described.

**Don't**

- Don't use a fieldset only to draw a box around something. Use it where the group needs a name.
- Don't put a single control in one. A [Field](field.md) is the right wrapper for that.
