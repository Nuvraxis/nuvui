import { RadioGroup, RadioGroupItem } from "@nuvui/react";

const row = { display: "flex", alignItems: "center", gap: 8 };

export default function Example() {
  return (
    <RadioGroup aria-label="Plan" defaultValue="team">
      <div style={row}>
        <RadioGroupItem value="free" id="radio-free" />
        <label htmlFor="radio-free">Free</label>
      </div>
      <div style={row}>
        <RadioGroupItem value="team" id="radio-team" />
        <label htmlFor="radio-team">Team</label>
      </div>
      <div style={row}>
        <RadioGroupItem value="company" id="radio-company" />
        <label htmlFor="radio-company">Company</label>
      </div>
    </RadioGroup>
  );
}
