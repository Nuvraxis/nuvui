import { Checkbox } from "@nuvui/react";

const row = { display: "flex", alignItems: "center", gap: 8 };

export default function Example() {
  return (
    <div style={{ display: "grid", gap: 20 }}>
      <div style={row}>
        <Checkbox id="state-off" />
        <label htmlFor="state-off">Unchecked</label>
      </div>
      <div style={row}>
        <Checkbox id="state-on" defaultChecked />
        <label htmlFor="state-on">Checked</label>
      </div>
      <div style={row}>
        <Checkbox id="state-some" checked="indeterminate" />
        <label htmlFor="state-some">Indeterminate</label>
      </div>
      <div style={row}>
        <Checkbox id="state-disabled" disabled />
        <label htmlFor="state-disabled">Disabled</label>
      </div>
    </div>
  );
}
