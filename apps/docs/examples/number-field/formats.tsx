import { Label, NumberField } from "@nuvui/react";

const row = {
  display: "grid",
  gap: 6,
  inlineSize: "100%",
  maxInlineSize: 220,
};

export default function Example() {
  return (
    <div style={{ display: "grid", gap: 16, inlineSize: "100%" }}>
      <div style={row}>
        <Label htmlFor="number-budget">Budget</Label>
        <NumberField
          id="number-budget"
          defaultValue={2500}
          min={0}
          step={50}
          format={{ currency: "USD", maximumFractionDigits: 0 }}
        />
      </div>
      <div style={row}>
        <Label htmlFor="number-discount">Discount</Label>
        <NumberField
          id="number-discount"
          defaultValue={0.15}
          min={0}
          max={1}
          step={0.05}
          format={{ format: "percent" }}
        />
      </div>
      <div style={row}>
        <Label htmlFor="number-weight">Weight, written the German way</Label>
        <NumberField
          id="number-weight"
          defaultValue={1234.5}
          min={0}
          step={0.5}
          format={{
            locale: "de-DE",
            options: { style: "unit", unit: "kilogram" },
          }}
        />
      </div>
    </div>
  );
}
