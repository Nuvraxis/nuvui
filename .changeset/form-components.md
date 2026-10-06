---
"@nuvui/react": minor
---

Fifteen components for forms.

- `Label`, `Input`, `Textarea` and `NativeSelect`: the browser's own elements with the library's styles. `Textarea` has `autoResize`, which grows it with its text.
- `Field`, with `FieldLabel`, `FieldControl`, `FieldDescription` and `FieldError`: ties a label, a hint and an error message to any control, with the ids and ARIA attributes filled in. It takes its error from you, so it works with any form library.
- `Fieldset` and `FieldsetLegend`: a named group of fields.
- `InputGroup`, with `InputGroupAddon` and `InputGroupButton`: text, icons and small buttons inside an input's box.
- `PasswordInput`: a password field with a button that shows what was typed.
- `OtpField`: a row of boxes for a one-time code.
- `RadioGroup` and `RadioGroupItem`.
- `Slider`, with one handle or several.
- `Toggle`, and `ToggleGroup` with `ToggleGroupItem`.
- `ButtonGroup`: joins buttons, inputs and select triggers into one strip.
- `FileUpload`: a drop area around a file input, with a list of the chosen files and limits on type, size and count.

`PasswordInput` and `OtpField` wrap Radix primitives that are still at version 0.1. The package pins those two to an exact version.

Changed in existing components:

- Button, Checkbox, Switch and the Select trigger now fade when the browser disables them, as it does inside a `<fieldset disabled>`. Before, only their own `disabled` prop did.
- `SelectTrigger` no longer passes a `required` prop on to its button, which has no such attribute. Set `required` on `Select`.
