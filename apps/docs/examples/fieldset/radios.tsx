import {
  Fieldset,
  FieldsetLegend,
  RadioGroup,
  RadioGroupItem,
} from "@nuvui/react";

const row = { display: "flex", alignItems: "center", gap: 8 };

export default function Example() {
  return (
    <Fieldset>
      <FieldsetLegend id="fieldset-contact">
        How should we reach you?
      </FieldsetLegend>
      <RadioGroup aria-labelledby="fieldset-contact" defaultValue="email">
        <div style={row}>
          <RadioGroupItem value="email" id="fieldset-email" />
          <label htmlFor="fieldset-email">Email</label>
        </div>
        <div style={row}>
          <RadioGroupItem value="phone" id="fieldset-phone" />
          <label htmlFor="fieldset-phone">Phone</label>
        </div>
      </RadioGroup>
    </Fieldset>
  );
}
