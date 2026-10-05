import { Switch } from "@nuvui/react";

const row = { display: "flex", alignItems: "center", gap: 12 };

export default function Example() {
  return (
    <div style={{ display: "grid", gap: 20 }}>
      <div style={row}>
        <Switch id="switch-off" />
        <label htmlFor="switch-off">Off</label>
      </div>
      <div style={row}>
        <Switch id="switch-on" defaultChecked />
        <label htmlFor="switch-on">On</label>
      </div>
      <div style={row}>
        <Switch id="switch-disabled" disabled />
        <label htmlFor="switch-disabled">Disabled</label>
      </div>
    </div>
  );
}
