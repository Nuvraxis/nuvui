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
