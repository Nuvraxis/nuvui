import { Label, NumberField } from "@nuvui/react";

export default function Example() {
  return (
    <div
      style={{
        display: "grid",
        gap: 6,
        inlineSize: "100%",
        maxInlineSize: 200,
      }}
    >
      <Label htmlFor="number-seats">Seats</Label>
      <NumberField id="number-seats" defaultValue={5} min={1} max={50} />
    </div>
  );
}
