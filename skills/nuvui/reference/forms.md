<!-- Written by apps/docs/scripts/agent-skill.mjs from apps/docs/content/docs/forms.mdx. Don't edit it here: run `pnpm skill`. -->

# Forms

Build a form from nuvui's fields, validate it with the browser or with React Hook Form, and show errors that a screen reader reads with the control.

nuvui has no form component and no validation of its own. The controls are either the browser's own elements or Radix controls that keep a hidden native input in step, so a plain `<form>` already submits them. [Field](components/field.md) ties a label, a hint and an error message to each one. Where the error comes from is up to you.

This page shows two ways to do that: the browser's built-in validation, and [React Hook Form](https://react-hook-form.com), version 7. The same pattern fits any other form library, because Field only needs a message to show.

## What submits, and how

Every control with a `name` is part of the form's data.

| Control | What's submitted |
| --- | --- |
| Input, Textarea, NativeSelect, PasswordInput | The element's own value. These are native elements. |
| FileUpload | The chosen files, from a native file input. |
| Checkbox, Switch | `"on"`, or the `value` you set, while checked. Radix renders a hidden checkbox. |
| RadioGroup, Select | The picked `value`. Radix renders hidden inputs. |
| Slider | One number per handle. |
| OtpField | The whole code as one value. |

`disabled` works on all of them, and `required` on all but the slider, which always has a value.

## With the browser's validation

Put `required`, `type="email"`, `minLength` or `pattern` on a control and the browser checks it when the form is submitted. It stops the submit, moves focus to the first control that fails and shows its own message there, in the visitor's language.

```tsx
"use client";

import {
  Button,
  Field,
  FieldControl,
  FieldDescription,
  FieldLabel,
  Input,
  NativeSelect,
} from "@nuvui/react";
import { useState } from "react";

export default function Example() {
  const [sent, setSent] = useState("");

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        setSent(`Sent: ${data.get("email")}, ${data.get("team")}.`);
      }}
      style={{
        display: "grid",
        gap: 20,
        inlineSize: "100%",
        maxInlineSize: 360,
      }}
    >
      <Field required>
        <FieldLabel>Email</FieldLabel>
        <FieldControl>
          {/* A teammate's address, so the browser isn't asked to offer
              the reader's own. */}
          <Input name="email" type="email" autoComplete="off" />
        </FieldControl>
        <FieldDescription>The invite goes to this address.</FieldDescription>
      </Field>
      <Field required>
        <FieldLabel>Team</FieldLabel>
        <FieldControl>
          <NativeSelect name="team" defaultValue="">
            <option value="" disabled>
              Pick a team
            </option>
            <option value="design">Design</option>
            <option value="engineering">Engineering</option>
            <option value="finance">Finance</option>
            <option value="marketing">Marketing</option>
            <option value="sales">Sales</option>
            <option value="support">Support</option>
          </NativeSelect>
        </FieldControl>
      </Field>
      <Button type="submit" style={{ justifySelf: "start" }}>
        Send invite
      </Button>
      <output aria-live="polite">{sent}</output>
    </form>
  );
}
```

That costs no JavaScript and suits a short form. Its limits are that the message's wording and look are the browser's, and that only one problem is shown at a time.

## With React Hook Form

Install it next to the library:

```sh
pnpm add react-hook-form
```

```tsx
"use client";

import {
  Button,
  Checkbox,
  Field,
  FieldControl,
  FieldDescription,
  FieldError,
  FieldLabel,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "@nuvui/react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";

interface Invite {
  name: string;
  email: string;
  role: string;
  note: string;
  terms: boolean;
}

export default function Example() {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<Invite>({
    defaultValues: { name: "", email: "", role: "", note: "", terms: false },
  });
  const [sent, setSent] = useState("");

  return (
    <form
      // The browser's own messages are off. The ones below take their place.
      noValidate
      onSubmit={handleSubmit((invite) =>
        setSent(`Invite sent to ${invite.email}.`),
      )}
      style={{
        display: "grid",
        gap: 20,
        inlineSize: "100%",
        maxInlineSize: 360,
      }}
    >
      {/* A native control: register() gives it its name, ref and handlers. */}
      <Field required>
        <FieldLabel>Full name</FieldLabel>
        <FieldControl>
          <Input
            // Someone else's name, so the browser isn't asked to offer the
            // reader's own.
            autoComplete="off"
            {...register("name", { required: "Enter their name." })}
          />
        </FieldControl>
        <FieldError>{errors.name?.message}</FieldError>
      </Field>

      <Field required>
        <FieldLabel>Email</FieldLabel>
        <FieldControl>
          <Input
            type="email"
            autoComplete="off"
            {...register("email", {
              required: "Enter their email address.",
              pattern: {
                value: /^\S+@\S+\.\S+$/,
                message: "Enter an email address, like ada@example.com.",
              },
            })}
          />
        </FieldControl>
        <FieldDescription>The invite goes to this address.</FieldDescription>
        <FieldError>{errors.email?.message}</FieldError>
      </Field>

      {/* A Radix control has no change event to register, so a Controller
          hands it the value and takes the new one back. */}
      <Field required>
        <FieldLabel>Role</FieldLabel>
        <Controller
          name="role"
          control={control}
          rules={{ required: "Pick a role." }}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <FieldControl>
                {/* The ref is what lets the form focus this on an error. */}
                <SelectTrigger
                  ref={field.ref}
                  onBlur={field.onBlur}
                  style={{ "--nuv-select-width": "100%" } as never}
                >
                  <SelectValue placeholder="Pick a role" />
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
          )}
        />
        <FieldError>{errors.role?.message}</FieldError>
      </Field>

      <Field>
        <FieldLabel>Note</FieldLabel>
        <FieldControl>
          <Textarea
            autoResize
            {...register("note", {
              maxLength: {
                value: 200,
                message: "Keep it under 200 characters.",
              },
            })}
          />
        </FieldControl>
        <FieldDescription>
          Optional. They see it in the invite.
        </FieldDescription>
        <FieldError>{errors.note?.message}</FieldError>
      </Field>

      <Field orientation="horizontal">
        <Controller
          name="terms"
          control={control}
          rules={{ required: "Confirm that they've agreed." }}
          render={({ field }) => (
            <FieldControl>
              <Checkbox
                ref={field.ref}
                checked={field.value}
                onCheckedChange={(checked) => field.onChange(checked === true)}
                onBlur={field.onBlur}
              />
            </FieldControl>
          )}
        />
        <FieldLabel>They've agreed to be contacted</FieldLabel>
        <FieldError>{errors.terms?.message}</FieldError>
      </Field>

      <Button type="submit" style={{ justifySelf: "start" }}>
        Send invite
      </Button>
      <output aria-live="polite">{sent}</output>
    </form>
  );
}
```

Four things in that example are worth pointing out.

**`noValidate` on the form.** It turns the browser's own messages off, so yours are the only ones. `required` on `Field` still marks the control as required for screen readers and puts the mark on the label.

**`register` for native controls.** Input, Textarea, NativeSelect and PasswordInput are native elements and forward their ref, so `{...register("name")}` works on them inside `FieldControl` as it would on a bare `<input>`.

**`Controller` for Radix controls.** Select, Checkbox, Switch, RadioGroup, Slider and ToggleGroup report a value through a callback, not a change event. `Controller` passes the value in and takes the new one back. Pass its `ref` on to the part that takes focus, the trigger of a select or the checkbox itself. That's what lets the form move focus there when the field fails.

**`FieldError` takes the message as it is.** `errors.name?.message` is `undefined` while the field is fine, and `FieldError` renders nothing for it. When there is a message, the control gets `aria-invalid` and is described by it, with nothing else to wire up.

## What a screen reader is told

A screen reader builds what it says from four things the browser works out for each control: its role, its name, its description and its states. Field sets all four. This is what they are for the email field above, before and after a failed submit.

| | Before | After submitting it empty |
| --- | --- | --- |
| Role | Text field | Text field |
| Name | "Email" | "Email" |
| Description | "The invite goes to this address." | "The invite goes to this address. Enter their email address." |
| States | Required | Required, invalid |

The asterisk isn't in the name. It's hidden from screen readers, because "required" already comes from the control.

The library's tests check these values in Chromium, Firefox and WebKit. How they're worded, and in what order, differs from one screen reader to the next, and that hasn't been tested with each of them. Try your own forms with the screen readers your users have.

Two more things decide whether someone who can't see the form finds the errors.

- **Focus has to move.** The description is read when focus lands on the control, not when the message appears. React Hook Form focuses the first failed field after a submit, as long as it has the control's ref. The browser's validation does the same.
- **A message that appears while typing needs announcing.** If you validate on every keystroke or on blur, add `aria-live="polite"` to that `FieldError`. A message that appears on submit doesn't need it, since focus is about to move there.

## Writing the messages

- Say what to do, not what's wrong. "Enter a date after today", not "Invalid date".
- Name the field when messages are collected in one place. Next to the field, the label already does.
- Don't blame. "Enter your email address" reads better than "You forgot your email address".
- Keep the hint and the error apart. The hint in `FieldDescription` says what's expected before anything goes wrong, and stays there after.

## Long forms

On a form too long to see at once, list the errors at the top after a failed submit, each one a link to its field, and move focus to that list. The list tells people how many problems there are, which a message next to each field can't. Group related fields with a [Fieldset](components/fieldset.md).

## Checking on the server

Whatever runs in the browser is a convenience for the person filling the form in. Check everything again on the server. Send the server's messages back keyed by field name, and pass each to the `FieldError` of its field. With React Hook Form that's `setError("email", { message })`.
