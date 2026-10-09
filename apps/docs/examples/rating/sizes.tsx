import { Rating } from "@nuvui/react";

export default function Example() {
  return (
    <div style={{ display: "grid", gap: 12, justifyItems: "center" }}>
      <Rating size="sm" defaultValue={4} aria-label="Small" />
      <Rating size="md" defaultValue={4} aria-label="Medium" />
      <Rating size="lg" defaultValue={4} aria-label="Large" />
      <Rating max={10} defaultValue={7} aria-label="Out of ten" />
    </div>
  );
}
