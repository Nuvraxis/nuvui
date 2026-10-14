# Forms

nuvui has no form component and no validation of its own. The controls are native elements, or Radix controls that keep a hidden native input in step, so a plain `<form>` submits them. `Field` ties a label, a hint and an error to each one. [reference/forms.md](../reference/forms.md) has all of it, with whole forms to copy.

## Every control goes in a Field

```tsx
// Wrong: a label that isn't tied to its control, an error nobody is told of
<div>
  <label>Email</label>
  <Input name="email" />
  <span className="error">Enter an email address</span>
</div>

// Right
<Field required>
  <FieldLabel>Email</FieldLabel>
  <FieldControl>
    <Input name="email" type="email" autoComplete="email" />
  </FieldControl>
  <FieldDescription>The invite goes to this address.</FieldDescription>
  <FieldError>{error}</FieldError>
</Field>
```

`Field` gives the control its `id`, points the label at it, and adds the hint and the error to what a screen reader reads with it. The control has to be the one child of `FieldControl`. `FieldError` renders nothing while it's empty, so it isn't rendered conditionally, and while it has something in it the control is marked invalid. Check [reference/components/field.md](../reference/components/field.md) for the props before using them: this file shows the shape, and the reference has the exact names.

- Don't write `id`, `htmlFor` or `aria-describedby` by hand inside a `Field`.
- A control that's a group, such as a `RadioGroup`, goes in a `Field` too, so it can have a `FieldError`. Its label can't be a `label` element, which names one control, so it's `<FieldLabel asChild><span>Role</span></FieldLabel>`. [reference/components/field.md](../reference/components/field.md) has it under "With other controls". Each option inside keeps its own `label` with `htmlFor`.
- Several fields that belong together, such as an address, go in a `Fieldset` with a `FieldsetLegend`.
- A placeholder isn't a label. Every control has a `FieldLabel`, or an `aria-label` where the design has no room for one.

## Give controls a name

A control is in the form's data when it has a `name`.

| Control | What's submitted |
| --- | --- |
| `Input`, `Textarea`, `NativeSelect`, `PasswordInput` | The element's value |
| `Checkbox`, `Switch` | `"on"`, or the `value` you set, while checked |
| `RadioGroup`, `Select` | The picked `value` |
| `Slider` | One number per handle |
| `OtpField` | The whole code as one value |
| `FileUpload` | The chosen files |

## Validation

Three ways. Use the one the app already has:

- **The browser's.** Put `required`, `type="email"`, `minLength` or `pattern` on the control. It costs no JavaScript and suits a short form. The message is the browser's own bubble, so nothing is shown under the field. [reference/forms.md](../reference/forms.md) has a form this way.
- **Your own, with state.** For messages under the fields, in an app with no form library: `noValidate` on the form, read the values from `FormData` on submit, keep the messages in state, and give each to its `FieldError`. [reference/components/field.md](../reference/components/field.md) has it under "Errors". Don't install a form library for one form.
- **React Hook Form**, version 7, where the app has it or has many forms. Native controls take `register`. Radix controls, `Select`, `Checkbox`, `Switch`, `RadioGroup`, `Slider`, go through `Controller`, with `onValueChange` or `onCheckedChange` wired to `field.onChange`. Put `noValidate` on the form, and each message in a `FieldError`. [reference/forms.md](../reference/forms.md) has a form this way too.

When to check: on submit. After that, a field that has a message is checked again as it's changed, so the message goes when it's put right. A field that hasn't been found wrong yet isn't checked while it's typed in.

What's checked in the browser is checked again on the server. A server action, or any function that returns a message per field, fits: put what comes back into the same `FieldError`s.

## Buttons in a form

`Button` is `type="button"` by default, which is not what HTML does. A button in a form does nothing until you say:

```tsx
<Button type="submit">Send invite</Button>
```

One submit button, and it's the `primary` one.

## While it's sending, and after

- Disable the submit button while the form is being sent, and say so: a `Spinner` in it, or other words on it.
- When it's sent, say so where a screen reader hears it: a `toast()`, or text in an element with `role="status"`. A toast needs a `Toaster` near the root. Look for one, and add it if the app has none.
- When there are errors, move the focus to the first control that has one. A `FieldError` is read with its control, and isn't announced by itself.
- When the server says no, put its message in the field's `FieldError`, or in an `Alert` at the top of the form for one that belongs to no field.

## Choosing the control

- Two to about five choices: `RadioGroup`, so they're all seen. With a description each: `ChoiceCard`.
- More than that: `Select`. So many that they need a search: `Combobox`. On a phone, or where the browser's own is wanted: `NativeSelect`.
- Yes or no, sent with the form: `Checkbox`. A setting that applies the moment it's flipped: `Switch`.
- A number with steps: `NumberField`. Within a range, roughly: `Slider`.
- A date: `DatePicker` from `@nuvui/date-picker`. Its value is a `Date`. Don't turn it into text with `toISOString()`, which gives the day in UTC: [reference/date-picker/index.md](../reference/date-picker/index.md) says what to use.
- A code sent by email or text: `OtpField`.
