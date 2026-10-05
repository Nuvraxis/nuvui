import { Checkbox } from "@nuvui/react";

export default function Example() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <Checkbox id="terms" />
      <label htmlFor="terms">I accept the terms</label>
    </div>
  );
}
