import {
  Field,
  FieldControl,
  FieldDescription,
  FieldLabel,
  PasswordInput,
} from "@nuvui/react";

export default function Example() {
  return (
    <Field required style={{ inlineSize: "100%", maxInlineSize: 320 }}>
      <FieldLabel>New password</FieldLabel>
      <FieldControl>
        <PasswordInput autoComplete="new-password" minLength={12} />
      </FieldControl>
      <FieldDescription>At least 12 characters.</FieldDescription>
    </Field>
  );
}
