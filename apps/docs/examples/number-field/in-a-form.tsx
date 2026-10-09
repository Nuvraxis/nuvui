"use client";

import {
  Button,
  Field,
  FieldControl,
  FieldDescription,
  FieldLabel,
  NumberField,
} from "@nuvui/react";
import { useState } from "react";

export default function Example() {
  const [sent, setSent] = useState<string>();

  return (
    <form
      style={{
        display: "grid",
        gap: 16,
        inlineSize: "100%",
        maxInlineSize: 260,
      }}
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        setSent(String(data.get("amount")));
      }}
    >
      <Field required>
        <FieldLabel>Amount</FieldLabel>
        <FieldControl>
          <NumberField
            name="amount"
            defaultValue={1250}
            min={0}
            step={10}
            format={{ currency: "EUR", locale: "de-DE" }}
          />
        </FieldControl>
        <FieldDescription>
          In euros. What's sent is the plain number.
        </FieldDescription>
      </Field>
      <Button type="submit">Send</Button>
      <output aria-live="polite">
        {sent === undefined ? "" : `Sent: ${sent}`}
      </output>
    </form>
  );
}
