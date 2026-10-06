import {
  Checkbox,
  Field,
  FieldControl,
  FieldDescription,
  FieldLabel,
  Switch,
} from "@nuvui/react";

export default function Example() {
  return (
    <div style={{ display: "grid", gap: 20 }}>
      <Field orientation="horizontal">
        <FieldControl>
          <Checkbox defaultChecked />
        </FieldControl>
        <FieldLabel>Email me a weekly summary</FieldLabel>
        <FieldDescription>It goes out on Monday morning.</FieldDescription>
      </Field>
      <Field orientation="horizontal">
        <FieldControl>
          <Switch />
        </FieldControl>
        <FieldLabel>Show my profile to the team</FieldLabel>
      </Field>
    </div>
  );
}
