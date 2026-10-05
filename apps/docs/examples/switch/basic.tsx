import { Switch } from "@nuvui/react";

export default function Example() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <Switch id="updates" />
      <label htmlFor="updates">Email me product updates</label>
    </div>
  );
}
