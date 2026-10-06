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
