import { Kbd } from "@nuvui/react";

export default function Example() {
  return (
    <div style={{ display: "grid", gap: 8 }}>
      <p style={{ margin: 0, fontSize: 12 }}>
        Small text: <Kbd>Tab</Kbd>
      </p>
      <p style={{ margin: 0, fontSize: 16 }}>
        Body text: <Kbd>Tab</Kbd>
      </p>
      <p style={{ margin: 0, fontSize: 24 }}>
        Large text: <Kbd>Tab</Kbd>
      </p>
    </div>
  );
}
