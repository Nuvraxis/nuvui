import {
  Field,
  FieldControl,
  FieldDescription,
  FieldLabel,
  OtpField,
} from "@nuvui/react";

export default function Example() {
  return (
    <Field style={{ justifyItems: "start" }}>
      <FieldLabel asChild>
        <span>Code from your authenticator app</span>
      </FieldLabel>
      <FieldControl>
        <OtpField groupSize={3} />
      </FieldControl>
      <FieldDescription>It changes every 30 seconds.</FieldDescription>
    </Field>
  );
}
