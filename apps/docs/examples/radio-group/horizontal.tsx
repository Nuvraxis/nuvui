import { RadioGroup, RadioGroupItem } from "@nuvui/react";

const row = { display: "flex", alignItems: "center", gap: 8 };

export default function Example() {
  return (
    <RadioGroup
      aria-label="Size"
      orientation="horizontal"
      defaultValue="m"
      style={{ "--nuv-radio-group-gap": "24px" } as never}
    >
      <div style={row}>
        <RadioGroupItem value="s" id="radio-s" />
        <label htmlFor="radio-s">Small</label>
      </div>
      <div style={row}>
        <RadioGroupItem value="m" id="radio-m" />
        <label htmlFor="radio-m">Medium</label>
      </div>
      <div style={row}>
        <RadioGroupItem value="l" id="radio-l" disabled />
        <label htmlFor="radio-l">Large, sold out</label>
      </div>
    </RadioGroup>
  );
}
