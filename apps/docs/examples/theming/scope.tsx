import "./scope.css";
import { Button, Switch } from "@nuvui/react";

const row = { display: "flex", alignItems: "center", gap: 12 };

export default function Example() {
  return (
    <div style={{ display: "grid", gap: 20 }}>
      <div style={row}>
        <Button>Outside</Button>
        <Switch aria-label="Outside" defaultChecked />
      </div>
      <div className="checkout" style={row}>
        <Button>Inside .checkout</Button>
        <Switch aria-label="Inside .checkout" defaultChecked />
      </div>
    </div>
  );
}
