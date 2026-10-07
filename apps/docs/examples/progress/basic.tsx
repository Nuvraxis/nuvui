import { Progress } from "@nuvui/react";

export default function Example() {
  return (
    <div style={{ width: "100%", maxWidth: 320 }}>
      <Progress aria-label="Storage used" value={64} />
    </div>
  );
}
