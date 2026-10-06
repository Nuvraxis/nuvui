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
            autoComplete="name"
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
            autoComplete="email"
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
                <SelectItem value="editor">Editor</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
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
