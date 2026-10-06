import { Input, Label } from "@nuvui/react";

export default function Example() {
  return (
    <div
      style={{
        display: "grid",
        gap: 6,
        inlineSize: "100%",
        maxInlineSize: 320,
      }}
    >
      <Label htmlFor="input-name">Full name</Label>
      <Input id="input-name" autoComplete="name" />
    </div>
  );
}
