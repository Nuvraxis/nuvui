import { Slider } from "@nuvui/react";

export default function Example() {
  return (
    <div style={{ display: "flex", gap: 32 }}>
      <Slider aria-label="Bass" orientation="vertical" defaultValue={[60]} />
      <Slider aria-label="Mid" orientation="vertical" defaultValue={[45]} />
      <Slider aria-label="Treble" orientation="vertical" defaultValue={[70]} />
    </div>
  );
}
