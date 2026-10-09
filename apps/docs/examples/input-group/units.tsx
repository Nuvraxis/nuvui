import {
  Field,
  FieldControl,
  FieldError,
  FieldLabel,
  Input,
  InputGroup,
  InputGroupAddon,
} from "@nuvui/react";

export default function Example() {
  return (
    <div
      style={{
        display: "grid",
        gap: 20,
        inlineSize: "100%",
        maxInlineSize: 240,
      }}
    >
      <Field>
        <FieldLabel>Monthly budget</FieldLabel>
        <InputGroup>
          <InputGroupAddon>$</InputGroupAddon>
          <FieldControl>
            <Input inputMode="decimal" defaultValue="1,200" />
          </FieldControl>
          <InputGroupAddon>USD</InputGroupAddon>
        </InputGroup>
      </Field>
      <Field>
        <FieldLabel>Discount</FieldLabel>
        <InputGroup>
          <FieldControl>
            <Input inputMode="numeric" defaultValue="140" />
          </FieldControl>
          <InputGroupAddon>%</InputGroupAddon>
        </InputGroup>
        <FieldError>Enter a number from 0 to 100.</FieldError>
      </Field>
    </div>
  );
}
