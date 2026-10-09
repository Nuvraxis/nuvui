"use client";

import { type DateRange, DateRangePicker } from "@nuvui/date-picker";
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
  const [range, setRange] = useState<DateRange | null>(null);
  const [sent, setSent] = useState<string | undefined>();
  const [submitted, setSubmitted] = useState(false);
  const complete = Boolean(range?.from && range.to);
  const error = submitted && !complete ? "Enter both dates." : undefined;

  return (
    <form
      noValidate
      style={{ display: "grid", gap: 16, width: "100%", maxWidth: 340 }}
      onSubmit={(event) => {
        event.preventDefault();
        setSubmitted(true);
        const data = new FormData(event.currentTarget);
        setSent(
          complete
            ? `from=${data.get("from")} to=${data.get("to")}`
            : undefined,
        );
      }}
    >
      <Field required>
        <FieldLabel>Report period</FieldLabel>
        <FieldControl>
          <DateRangePicker
            startName="from"
            endName="to"
            max={new Date()}
            value={range}
            onValueChange={setRange}
          />
        </FieldControl>
        <FieldDescription>Up to today.</FieldDescription>
        <FieldError>{error}</FieldError>
      </Field>
      <Button type="submit">Run report</Button>
      <output style={{ fontSize: 14 }}>{sent ? `Sent: ${sent}` : null}</output>
    </form>
  );
}
