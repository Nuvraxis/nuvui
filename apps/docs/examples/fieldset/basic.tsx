import {
  Field,
  FieldControl,
  FieldLabel,
  Fieldset,
  FieldsetLegend,
  Input,
} from "@nuvui/react";

export default function Example() {
  return (
    <Fieldset style={{ inlineSize: "100%", maxInlineSize: 360 }}>
      <FieldsetLegend>Shipping address</FieldsetLegend>
      <Field>
        <FieldLabel>Street</FieldLabel>
        <FieldControl>
          <Input autoComplete="shipping address-line1" />
        </FieldControl>
      </Field>
      <Field>
        <FieldLabel>City</FieldLabel>
        <FieldControl>
          <Input autoComplete="shipping address-level2" />
        </FieldControl>
      </Field>
    </Fieldset>
  );
}
