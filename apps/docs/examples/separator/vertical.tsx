import { Separator } from "@nuvui/react";

export default function Example() {
  return (
    <div
      style={{ display: "flex", gap: 12, alignItems: "center", fontSize: 14 }}
    >
      <span>Docs</span>
      <Separator orientation="vertical" />
      <span>Components</span>
      <Separator orientation="vertical" />
      <span>Changelog</span>
    </div>
  );
}
