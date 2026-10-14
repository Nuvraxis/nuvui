<!-- Written by apps/docs/scripts/agent-skill.mjs from apps/docs/content/docs/components/field.mdx. Don't edit it here: run `pnpm skill`. -->

# Field

Ties a label, a hint and an error message to a form control, with the ids and ARIA attributes a screen reader needs.

Use a field around any form control that has a label. It makes up the ids, points the label at the control, and tells the control which text describes it and whether it's invalid. It takes its error from you, so it works with whatever does your validation. [Forms](../forms.md) shows it with React Hook Form.

```tsx
import {
  Field,
  FieldControl,
  FieldDescription,
  FieldLabel,
  Input,
} from "@nuvui/react";

export default function Example() {
  return (
    <Field style={{ inlineSize: "100%", maxInlineSize: 320 }}>
      <FieldLabel>Work email</FieldLabel>
      <FieldControl>
        <Input type="email" autoComplete="email" />
      </FieldControl>
      <FieldDescription>We send receipts here.</FieldDescription>
    </Field>
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
  Field,
  FieldControl,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@nuvui/react";
```

The styles come from `@nuvui/react/styles.css`, which you load once for the whole app. [Getting started](../index.md) covers that, and how to load only this component's CSS. Loaded one by one, a field needs `label.css` as well as `field.css`.

## Parts

| Part | What it is |
| --- | --- |
| `Field` | The wrapper. It holds the ids and the state the other parts read. |
| `FieldLabel` | The label. It's a [Label](label.md) that points at the control. |
| `FieldControl` | Wraps the control and passes the field's props to it. It renders nothing itself. |
| `FieldDescription` | A hint under the control. |
| `FieldError` | The error message. It renders nothing while it has nothing to say. |

These are separate exports, not properties of `Field`. `Field.Label` isn't available, because property access on a client component doesn't work from a server component.

## Props

### Field

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `orientation` | `"horizontal" \| "vertical"` | `"vertical"` | `"vertical"` stacks the label, the control and the text under it. `"horizontal"` puts the first two side by side, which suits a checkbox or a switch with its label. |
| `invalid` | `boolean` |  | Marks the control as invalid. Left out, the control is invalid while a `FieldError` has something in it. |
| `required` | `boolean` | `false` | Makes the control required and puts a mark after the label. |
| `disabled` | `boolean` | `false` | Disables the control and fades the label. |
| `controlId` | `string` |  | The `id` the control gets. The label, the description and the error take theirs from it. Left out, one is made up. |

Everything else is passed to the `<div>` it renders.

### FieldLabel

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `requiredIndicator` | `ReactNode` | `"*"` | What follows the label's text while the field is required. It's hidden from screen readers, which hear "required" from the control itself. |

It also takes everything [Label](label.md) does, `asChild` included.

### FieldControl

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `children` (required) | `ReactNode` |  | The control: one element, which gets the field's props. |

`FieldDescription` and `FieldError` take the props of a `<div>`.

## What the control is given

`FieldControl` holds one element and adds these props to it. Anything you set on the control yourself wins, except `aria-describedby`, where yours is kept and the field's ids are added after it.

| Prop | Value |
| --- | --- |
| `id` | The field's id, which the label's `htmlFor` matches. |
| `aria-labelledby` | The label's id, once there is a `FieldLabel`. |
| `aria-describedby` | The description's id and the error's id, for whichever of the two is on the page. |
| `aria-invalid` | `true` while the field is invalid. |
| `required` | Set when `Field` has `required`. |
| `disabled` | Set when `Field` has `disabled`. |

Set the id on `Field` with `controlId` and not on the control, or the label will point at an id that isn't there.

## Errors

Pass the message to `FieldError`. While it's empty it renders nothing, so there's no need to render it conditionally. While it has something in it, the control is marked invalid and described by it.

```tsx
"use client";

import {
  Button,
  Field,
  FieldControl,
  FieldDescription,
  FieldError,
  FieldLabel,
  Input,
} from "@nuvui/react";
import { type FormEvent, useState } from "react";

export default function Example() {
  const [error, setError] = useState("");

  function check(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = new FormData(event.currentTarget).get("workspace");
    setError(
      /^[a-z0-9-]{3,}$/.test(String(name))
        ? ""
        : "Use at least 3 lowercase letters, digits or hyphens.",
    );
  }

  return (
    <form
      // The browser's own checks are off, so the message below is the only one.
      noValidate
      onSubmit={check}
      style={{
        display: "grid",
        gap: 16,
        inlineSize: "100%",
        maxInlineSize: 320,
      }}
    >
      <Field required>
        <FieldLabel>Workspace name</FieldLabel>
        <FieldControl>
          <Input name="workspace" defaultValue="My Team" />
        </FieldControl>
        <FieldDescription>It becomes part of your address.</FieldDescription>
        <FieldError>{error}</FieldError>
      </Field>
      <Button type="submit">Create workspace</Button>
    </form>
  );
}
```

`invalid` on `Field` overrides that either way: `invalid` with no message, or `invalid={false}` to show a message without marking the control yet.

The message isn't a live region. A screen reader reads it when focus is on the control, as part of the control's description. So when a form is submitted with errors, move focus to the first invalid control. If your messages appear while someone is still typing in the field, add `role="alert"` or `aria-live="polite"` to `FieldError` so the change is announced.

## Required and disabled

`required` on `Field` reaches the control and puts an asterisk after the label. The asterisk is hidden from screen readers, which hear "required" from the control. Change it with `requiredIndicator` on `FieldLabel`, or pass `null` to leave it out.

`disabled` reaches the control and fades the label.

## Side by side

`orientation="horizontal"` puts the first two parts on one row, in the order you write them. Put the control first for a checkbox or a switch. The description and the error line up under the second part.

```tsx
import {
  Checkbox,
  Field,
  FieldControl,
  FieldDescription,
  FieldLabel,
  Switch,
} from "@nuvui/react";

export default function Example() {
  return (
    <div style={{ display: "grid", gap: 20 }}>
      <Field orientation="horizontal">
        <FieldControl>
          <Checkbox defaultChecked />
        </FieldControl>
        <FieldLabel>Email me a weekly summary</FieldLabel>
        <FieldDescription>It goes out on Monday morning.</FieldDescription>
      </Field>
      <Field orientation="horizontal">
        <FieldControl>
          <Switch />
        </FieldControl>
        <FieldLabel>Show my profile to the team</FieldLabel>
      </Field>
    </div>
  );
}
```

## With other controls

```tsx
import {
  Field,
  FieldControl,
  FieldDescription,
  FieldLabel,
  RadioGroup,
  RadioGroupItem,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Slider,
} from "@nuvui/react";

const row = { display: "flex", alignItems: "center", gap: 8 };

export default function Example() {
  return (
    <div
      style={{
        display: "grid",
        gap: 24,
        inlineSize: "100%",
        maxInlineSize: 320,
      }}
    >
      <Field>
        <FieldLabel>Role</FieldLabel>
        <Select defaultValue="editor">
          {/* The control is the trigger, so that's what gets wrapped. */}
          <FieldControl>
            <SelectTrigger style={{ "--nuv-select-width": "100%" } as never}>
              <SelectValue />
            </SelectTrigger>
          </FieldControl>
          <SelectContent>
            <SelectItem value="viewer">Viewer</SelectItem>
            <SelectItem value="commenter">Commenter</SelectItem>
            <SelectItem value="editor">Editor</SelectItem>
            <SelectItem value="billing">Billing</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="owner">Owner</SelectItem>
          </SelectContent>
        </Select>
        <FieldDescription>
          Editors can change pages and not settings.
        </FieldDescription>
      </Field>

      <Field>
        {/* A group isn't something a <label> can point at. */}
        <FieldLabel asChild>
          <span>Billing period</span>
        </FieldLabel>
        <FieldControl>
          <RadioGroup defaultValue="year">
            <div style={row}>
              <RadioGroupItem value="month" id="field-month" />
              <label htmlFor="field-month">Monthly</label>
            </div>
            <div style={row}>
              <RadioGroupItem value="year" id="field-year" />
              <label htmlFor="field-year">Yearly</label>
            </div>
          </RadioGroup>
        </FieldControl>
      </Field>

      <Field>
        <FieldLabel>Storage limit</FieldLabel>
        <FieldControl>
          <Slider defaultValue={[40]} step={10} />
        </FieldControl>
        <FieldDescription>In gigabytes, from 0 to 100.</FieldDescription>
      </Field>
    </div>
  );
}
```

Most controls only need wrapping. A few have something to know about.

| Control | What to know |
| --- | --- |
| Input, Textarea, NativeSelect, PasswordInput, Checkbox, Switch, FileUpload | Wrap the control. |
| Select | Wrap `SelectTrigger`, not `Select`. `required` has to go on `Select` itself, which is where the form value lives. |
| RadioGroup, ToggleGroup | Use `FieldLabel asChild` with a `<span>`. A `<label>` can only point at one control, and a group isn't one. The group is named through `aria-labelledby`. |
| Slider | The name and the description go to the handle, which is the part with the slider role. `required` is dropped: a slider always has a value. |
| OtpField | The label names the group of boxes. `aria-invalid` and `required` go on each box. Use `FieldLabel asChild` here too. |

## Accessibility

A field has no keyboard behavior of its own.

### What the component handles

- The label is a real `<label>` with `htmlFor`, so a click on it focuses the control.
- The control is named by the label and described by the description and the error, in that order. The ids only appear in `aria-describedby` while the part they belong to is on the page.
- `aria-invalid` follows the error, so the two can't disagree.
- The error is drawn in `--color-danger`, which has at least 4.5:1 contrast with the page in every theme. It's text, so it doesn't depend on the color being seen.
- The ids come from React's `useId`, so they're the same on the server and in the browser.

### What you need to handle

- Write the error so it says what to do: "Enter a date after today", not "Invalid date".
- After a failed submit, move focus to the first invalid control. Form libraries usually do this for you.
- The parts report themselves to the field after they've rendered. On a page rendered on the server, `aria-describedby` is added when the page hydrates.

## CSS variables

Set any of these on the field, or on anything around it.

```css
.form {
  --nuv-field-gap: calc(var(--spacing) * 2);
}
```

| Variable | Default | What it sets |
| --- | --- | --- |
| `--nuv-field-gap` | `calc(var(--spacing) * 1.5)` | Space between the parts. |
| `--nuv-field-column-gap` | `calc(var(--spacing) * 2)` | Space between the control and the label when they're side by side. |
| `--nuv-field-required` | `var(--color-danger)` | Color of the required mark. |
| `--nuv-field-description` | `var(--color-muted-foreground)` | Text color of the description. |
| `--nuv-field-error` | `var(--color-danger)` | Text color of the error. |

## Classes

| Class | What it's on |
| --- | --- |
| `.nuv-field` | Field. |
| `.nuv-field--horizontal` | orientation="horizontal" |
| `.nuv-field--vertical` | orientation="vertical" |
| `.nuv-field__description` | FieldDescription. |
| `.nuv-field__error` | FieldError. |
| `.nuv-field__required` | The required mark inside the label. |

`Field` has the `data-invalid` attribute while it's invalid and `data-disabled` while it's disabled. `FieldLabel` has the class `nuv-label`.

## Server components

The field parts are client components. They carry `"use client"`, and the build checks that the directive is still there in the published files.

You can put a field together inside a server component, as the first example on this page does. Showing an error needs state somewhere, which means a client component of your own or a form library.

## Do and don't

**Do**

- Use a field for every labelled control in a form, so they all behave the same.
- Put the hint in `FieldDescription`, where a screen reader reads it with the control.
- Keep the error next to its control.

**Don't**

- Don't set `id` on the control inside `FieldControl`. Use `controlId` on `Field`.
- Don't put two controls in one field. Give each its own, and group them with a [Fieldset](fieldset.md).
- Don't rely on the asterisk alone. Say which fields are optional or required somewhere in words.
