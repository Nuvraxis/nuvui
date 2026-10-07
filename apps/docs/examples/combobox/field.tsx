"use client";

import {
  Button,
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxTrigger,
  ComboboxValue,
  Field,
  FieldControl,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@nuvui/react";
import { useState } from "react";

const plans = ["Starter", "Team", "Business", "Enterprise"];

export default function Example() {
  const [plan, setPlan] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const error = submitted && !plan ? "Pick a plan to continue." : undefined;

  return (
    <form
      style={{ display: "grid", gap: 16, width: "100%", maxWidth: 280 }}
      onSubmit={(event) => {
        event.preventDefault();
        setSubmitted(true);
      }}
    >
      <Field required>
        <FieldLabel>Plan</FieldLabel>
        <Combobox value={plan} onValueChange={setPlan} name="plan">
          <FieldControl>
            <ComboboxTrigger style={{ inlineSize: "100%" }}>
              <ComboboxValue placeholder="Pick a plan" />
            </ComboboxTrigger>
          </FieldControl>
          <ComboboxContent
            aria-label="Plan"
            label="Search plans"
            searchPlaceholder="Search"
          >
            <ComboboxEmpty>No plan found.</ComboboxEmpty>
            {plans.map((name) => (
              <ComboboxItem key={name} value={name}>
                {name}
              </ComboboxItem>
            ))}
          </ComboboxContent>
        </Combobox>
        <FieldDescription>You can change it later.</FieldDescription>
        <FieldError>{error}</FieldError>
      </Field>
      <Button type="submit">Continue</Button>
    </form>
  );
}
