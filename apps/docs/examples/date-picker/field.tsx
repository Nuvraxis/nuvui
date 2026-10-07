"use client";

import { DatePicker } from "@nuvui/date-picker";
import {
  Button,
  Field,
  FieldControl,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@nuvui/react";
import { useState } from "react";

export default function Example() {
  const [date, setDate] = useState<Date | null>(null);
  const [sent, setSent] = useState<string | undefined>();
  const [submitted, setSubmitted] = useState(false);
  const error = submitted && !date ? "Enter the date you start." : undefined;

  return (
    <form
      noValidate
      style={{ display: "grid", gap: 16, width: "100%", maxWidth: 280 }}
      onSubmit={(event) => {
        event.preventDefault();
        setSubmitted(true);
        const data = new FormData(event.currentTarget);
        setSent(date ? String(data.get("start")) : undefined);
      }}
    >
      <Field required>
        <FieldLabel>Start date</FieldLabel>
        <FieldControl>
          <DatePicker name="start" value={date} onValueChange={setDate} />
        </FieldControl>
        <FieldDescription>Your first day with us.</FieldDescription>
        <FieldError>{error}</FieldError>
      </Field>
      <Button type="submit">Save</Button>
      <output style={{ fontSize: 14 }}>
        {sent ? `Sent: start=${sent}` : null}
      </output>
    </form>
  );
}
