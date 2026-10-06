import {
  Field,
  FieldControl,
  FieldDescription,
  FieldLabel,
  Input,
} from "@nuvui/react";

export default function Example() {
  return (
    <Field style={{ inlineSize: "100%", maxInlineSize: 320 }}>
      <FieldLabel>Work email</FieldLabel>
      <FieldControl>
        <Input type="email" autoComplete="email" />
      </FieldControl>
      <FieldDescription>We send receipts here.</FieldDescription>
    </Field>
  );
}
